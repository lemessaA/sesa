import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const UserRole = {
    ADMIN: 'admin',
    INSTRUCTOR: 'instructor',
    STUDENT: 'student'
};

// Define Schema manually to avoid TS module import issues
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.STUDENT },
    authProvider: { type: String, default: 'local' },
    isEmailVerified: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

const seedDB = async () => {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sesa_db';

    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        // Delete existing test users
        await User.deleteMany({ email: { $in: ['admin@sesa.com', 'instructor@sesa.com', 'student@sesa.com'] } });
        console.log('Cleared existing test users');

        const usersToCreate = [
            {
                name: 'SESA Admin',
                email: 'admin@sesa.com',
                password: 'admin123_Secure!',
                role: UserRole.ADMIN
            },
            {
                name: 'Lead Instructor',
                email: 'instructor@sesa.com',
                password: 'instructor123_Secure!',
                role: UserRole.INSTRUCTOR
            },
            {
                name: 'Premium Student',
                email: 'student@sesa.com',
                password: 'student123_Secure!',
                role: UserRole.STUDENT
            }
        ];

        for (const userData of usersToCreate) {
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(userData.password, salt);
            const user = new User({
                ...userData,
                password: hashedPassword,
                authProvider: 'local',
                isEmailVerified: true
            });
            await user.save();
            console.log(`✅ User created: ${userData.email} (${userData.role}) | Pwd: ${userData.password}`);
        }

        console.log('--- Seeding completed! 🚀 ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding error:', err);
        process.exit(1);
    }
};

seedDB();
