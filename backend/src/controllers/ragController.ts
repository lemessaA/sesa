import type { Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import type { AuthRequest } from '../middleware/auth.js';
import '../models/RagChunk.js';
import RagUserDocument from '../models/RagUserDocument.js';
import { canAccessRag } from '../services/ragAccessService.js';
import { sendProblem } from '../utils/problemJson.js';

const RAG_SUBDIR = 'rag';
const MAX_STORED_TEXT = 1_000_000;

/** GET /api/v1/rag/access — for UI: whether the user may use document Q&A (enrolled students only). */
export const getRagAccess = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;
  const eligible = await canAccessRag(userId, role);
  return res.json({
    data: {
      eligible,
      message: eligible
        ? 'You can upload documents so the assistant can read them and answer from the full text.'
        : 'Document Q&A is only available to students with at least one approved enrollment.',
    },
  });
};

async function forwardExtractToPython(params: {
  buffer: Buffer;
  originalName: string;
}): Promise<{ text: string; char_count?: number }> {
  const base = process.env.LANGGRAPH_AGENT_URL?.trim().replace(/\/+$/, '');
  if (!base) {
    throw new Error('LANGGRAPH_AGENT_URL is not configured (required for document text extraction)');
  }
  const form = new FormData();
  form.append('original_name', params.originalName);
  form.append('file', new Blob([new Uint8Array(params.buffer)]), params.originalName);

  const url = `${base}/v1/rag/extract`;
  let res: Awaited<ReturnType<typeof fetch>>;
  try {
    res = await fetch(url, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(120_000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const c =
      e && typeof e === 'object' && 'cause' in e
        ? (e as { cause?: Error | { code?: string; message?: string } }).cause
        : undefined;
    const cmsg =
      c instanceof Error
        ? c.message
        : c && typeof c === 'object' && 'code' in c
          ? String((c as { code?: string }).code)
          : c != null
            ? String(c)
            : '';
    const tip =
      'Document extract service is unreachable. Start python-agents (`npm run dev:all` or `npm run agent:dev`) and set LANGGRAPH_AGENT_URL (e.g. http://127.0.0.1:8088, no /v1).';
    throw new Error(`${tip} [${cmsg || msg}] → ${url}`);
  }
  const body = await res.text();
  if (!res.ok) {
    let detail = body.slice(0, 500);
    try {
      const j = JSON.parse(body) as { detail?: unknown };
      if (j.detail) detail = String(j.detail);
    } catch {
      /* ignore */
    }
    throw new Error(`Document extract failed (${res.status}): ${detail}`);
  }
  const j = JSON.parse(body) as { text?: string; char_count?: number };
  const text = typeof j.text === 'string' ? j.text : '';
  return { text, char_count: j.char_count };
}

/**
 * POST /api/v1/rag/documents — multipart `file` field; extracts full text via python-agents, stores in Mongo.
 */
export const postRagDocument = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  if (!req.file) {
    return sendProblem(res, 400, 'VALIDATION_ERROR', 'Bad Request', 'Missing file (field name: file).');
  }

  const myId = new mongoose.Types.ObjectId();
  const key = myId.toString();
  const doc = await RagUserDocument.create({
    _id: myId,
    userId,
    originalName: req.file.originalname || 'upload',
    mimeType: req.file.mimetype || 'application/octet-stream',
    sizeBytes: req.file.size,
    storageRelativePath: path.relative(path.join(process.cwd(), 'uploads'), req.file.path).replace(/\\/g, '/'),
    pythonStoreKey: key,
    status: 'pending',
  });

  try {
    const buf = await fs.readFile(req.file.path);
    const out = await forwardExtractToPython({
      buffer: buf,
      originalName: doc.originalName,
    });
    const raw = out.text?.trim() || '';
    if (!raw) {
      throw new Error('No extractable text in file');
    }
    const stored = raw.length > MAX_STORED_TEXT ? `${raw.slice(0, MAX_STORED_TEXT)}\n\n[...truncated at ${MAX_STORED_TEXT} characters]` : raw;
    doc.status = 'indexed';
    doc.extractedText = stored;
    doc.chunkCount = stored.length;
    doc.errorMessage = undefined;
    await doc.save();
    return res.status(201).json({
      data: {
        id: key,
        originalName: doc.originalName,
        sizeBytes: doc.sizeBytes,
        status: doc.status,
        chunkCount: doc.chunkCount,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Processing failed';
    doc.status = 'error';
    doc.errorMessage = msg;
    await doc.save();
    return sendProblem(res, 502, 'BAD_GATEWAY', 'Document processing unavailable', msg);
  }
};

export const getRagDocuments = async (req: AuthRequest, res: Response) => {
  const list = await RagUserDocument.find({ userId: req.user!.id })
    .select('originalName sizeBytes status chunkCount errorMessage createdAt')
    .sort({ createdAt: -1 })
    .lean();
  return res.json({
    data: {
      documents: list.map((d) => ({
        id: d._id.toString(),
        originalName: d.originalName,
        sizeBytes: d.sizeBytes,
        status: d.status,
        chunkCount: d.chunkCount,
        errorMessage: d.errorMessage,
        createdAt: d.createdAt,
      })),
    },
  });
};

export const deleteRagDocument = async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id || '').trim();
  if (!id) {
    return sendProblem(res, 400, 'VALIDATION_ERROR', 'Bad Request', 'Missing document id');
  }
  const doc = await RagUserDocument.findOne({ _id: id, userId: req.user!.id });
  if (!doc) {
    return sendProblem(res, 404, 'NOT_FOUND', 'Not Found', 'Document not found');
  }
  const abs = path.join(process.cwd(), 'uploads', doc.storageRelativePath);
  try {
    await fs.unlink(abs);
  } catch {
    /* file may be gone */
  }
  await doc.deleteOne();
  return res.status(200).json({ data: { ok: true } });
};

/**
 * Used at startup: ensure upload dir exists
 */
export async function ensureRagUploadRoot() {
  const root = path.join(process.cwd(), 'uploads', RAG_SUBDIR);
  try {
    await fs.mkdir(root, { recursive: true });
  } catch {
    /* ignore */
  }
}
