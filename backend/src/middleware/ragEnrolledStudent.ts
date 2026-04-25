import type { NextFunction, Response } from 'express';
import { canAccessRag } from '../services/ragAccessService.js';
import type { AuthRequest } from './auth.js';
import { sendProblem } from '../utils/problemJson.js';

/**
 * After `authenticate`. Document RAG and related APIs are for enrolled students only.
 */
export const requireEnrolledStudentForRag = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return sendProblem(res, 401, 'UNAUTHORIZED', 'Unauthorized', 'Not authenticated.');
  }
  const allowed = await canAccessRag(req.user.id, req.user.role);
  if (!allowed) {
    return sendProblem(
      res,
      403,
      'FORBIDDEN',
      'Forbidden',
      'RAG and personal document features are only available to students with an approved course enrollment.'
    );
  }
  return next();
};
