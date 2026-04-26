import type { Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import type { AuthRequest } from '../middleware/auth.js';
import '../models/RagChunk.js';
import RagUserDocument from '../models/RagUserDocument.js';
import { canAccessRag } from '../services/ragAccessService.js';
import logger from '../utils/logger.js';
import { sendProblem } from '../utils/problemJson.js';

const RAG_SUBDIR = 'rag';

/** GET /api/v1/rag/access — for UI: whether the user may use RAG (enrolled students only). */
export const getRagAccess = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;
  const eligible = await canAccessRag(userId, role);
  return res.json({
    data: {
      eligible,
      message: eligible
        ? 'You can upload documents and use them in the assistant.'
        : 'RAG is only available to students with at least one approved enrollment.',
    },
  });
};

async function forwardIngestToPython(params: {
  buffer: Buffer;
  originalName: string;
  userId: string;
  documentId: string;
}): Promise<{ chunks_indexed?: number }> {
  const base = process.env.LANGGRAPH_AGENT_URL?.trim().replace(/\/+$/, '');
  if (!base) {
    throw new Error('LANGGRAPH_AGENT_URL is not configured (required for RAG indexing)');
  }
  const form = new FormData();
  form.append('user_id', params.userId);
  form.append('document_id', params.documentId);
  form.append('original_name', params.originalName);
  form.append('file', new Blob([new Uint8Array(params.buffer)]), params.originalName);

  const ingestUrl = `${base}/v1/rag/ingest`;
  let res: Awaited<ReturnType<typeof fetch>>;
  try {
    res = await fetch(ingestUrl, {
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
      'RAG ingest is unreachable. Start the python-agents app, then set backend LANGGRAPH_AGENT_URL to its base ' +
      'URL (no /v1 path) reachable from this Node process — e.g. http://127.0.0.1:8000. If the API runs in Docker, ' +
      "use the container hostname or host.docker.internal, not localhost, unless the service is on the same host.";
    throw new Error(`${tip} [${cmsg || msg}] → ${ingestUrl}`);
  }
  const text = await res.text();
  if (!res.ok) {
    let detail = text.slice(0, 500);
    try {
      const j = JSON.parse(text) as { detail?: unknown };
      if (j.detail) detail = String(j.detail);
    } catch {
      /* ignore */
    }
    throw new Error(`RAG ingest failed (${res.status}): ${detail}`);
  }
  return JSON.parse(text) as { chunks_indexed?: number };
}

async function forwardDeleteToPython(userId: string, documentId: string) {
  const base = process.env.LANGGRAPH_AGENT_URL?.trim().replace(/\/+$/, '');
  if (!base) return;
  try {
    const res = await fetch(`${base}/v1/rag/documents/${encodeURIComponent(userId)}/${encodeURIComponent(documentId)}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      const t = await res.text();
      logger.warn(`[RAG] Python delete non-ok ${res.status}: ${t.slice(0, 200)}`);
    }
  } catch (e) {
    logger.warn('[RAG] Python delete failed', e);
  }
}

/**
 * POST /api/v1/rag/documents — multipart `file` field
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
    const out = await forwardIngestToPython({
      buffer: buf,
      originalName: doc.originalName,
      userId,
      documentId: key,
    });
    doc.status = 'indexed';
    doc.chunkCount = out.chunks_indexed ?? 0;
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
    const msg = e instanceof Error ? e.message : 'Indexing failed';
    doc.status = 'error';
    doc.errorMessage = msg;
    await doc.save();
    return sendProblem(res, 502, 'BAD_GATEWAY', 'RAG Unavailable', msg);
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
  await forwardDeleteToPython(req.user!.id, doc.pythonStoreKey || id);
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
