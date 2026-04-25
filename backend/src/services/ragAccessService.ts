import Enrollment from '../models/Enrollment.js';
import { UserRole } from '../models/User.js';

/** Roles that may use RAG as enrolled students (not staff/instructors). */
const ENROLLED_STUDENT_ROLES = new Set<string>([
  UserRole.STUDENT,
  UserRole.PREMIUM_STUDENT,
  UserRole.TRIAL_STUDENT,
]);

/**
 * RAG (document upload + retrieval) is allowed only for student roles
 * with at least one approved course enrollment.
 */
export async function canAccessRag(userId: string, role: string): Promise<boolean> {
  if (!ENROLLED_STUDENT_ROLES.has(role)) {
    return false;
  }
  const n = await Enrollment.countDocuments({ user: userId, status: 'approved' });
  return n > 0;
}
