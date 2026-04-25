import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { deleteRagDocument, getRagAccess, getRagDocuments, postRagDocument } from '../controllers/ragController.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { requireEnrolledStudentForRag } from '../middleware/ragEnrolledStudent.js';

const maxBytes = 20 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) {
      cb(new Error('Unauthorized'), '');
      return;
    }
    const dir = path.join(process.cwd(), 'uploads', 'rag', userId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `doc-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxBytes },
  fileFilter: (_req, file, cb) => {
    cb(null, true);
  },
});

const router = express.Router();
router.get('/access', authenticate, getRagAccess);
router.get('/documents', authenticate, requireEnrolledStudentForRag, getRagDocuments);
router.post(
  '/documents',
  authenticate,
  requireEnrolledStudentForRag,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(413).json({ message: 'File too large (max 20MB)' });
          return;
        }
      }
      if (err) {
        res.status(400).json({ message: err instanceof Error ? err.message : 'Upload failed' });
        return;
      }
      next();
    });
  },
  postRagDocument
);
router.delete('/documents/:id', authenticate, requireEnrolledStudentForRag, deleteRagDocument);

export default router;
