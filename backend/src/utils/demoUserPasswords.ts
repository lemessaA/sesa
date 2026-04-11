/**
 * Demo account plaintext passwords — shared by seed.ts and seedEnhanced.ts for the same emails.
 * Any seeded user whose email is not listed uses DEFAULT_DEMO_PASSWORD (seedEnhanced-only roles).
 */
import bcrypt from 'bcryptjs';

export const DEMO_PASSWORD_BY_EMAIL: Record<string, string> = {
    'superadmin@sesa.com': 'superadmin123_Secure!',
    'admin@sesa.com': 'admin123_Secure!',
    'moderator@sesa.com': 'moderator123_Secure!',
    'instructor@sesa.com': 'instructor123_Secure!',
    'assistant@sesa.com': 'assistant123_Secure!',
    'premium@sesa.com': 'student123_Secure!',
    'student@sesa.com': 'student123_Secure!',
};

export const DEFAULT_DEMO_PASSWORD = 'password123';

export async function hashDemoPassword(email: string): Promise<string> {
    const plain = DEMO_PASSWORD_BY_EMAIL[email.toLowerCase()] ?? DEFAULT_DEMO_PASSWORD;
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
}
