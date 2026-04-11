import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User, { UserRole } from '../models/User.js';
import dotenv from 'dotenv';
import { getMongoUri, MONGOOSE_CONNECT_OPTIONS } from '../config/mongoUri.js';

// Simple dotenv load for the seed script
dotenv.config();

const seedDB = async () => {
    const MONGO_URI = getMongoUri();

    try {
        await mongoose.connect(MONGO_URI, { ...MONGOOSE_CONNECT_OPTIONS });
        console.log('Connected to MongoDB for seeding...');

        const usersToCreate = [
            {
                name: 'SESA Super Admin',
                email: 'superadmin@sesa.com',
                password: 'superadmin123_Secure!',
                role: UserRole.SUPER_ADMIN
            },
            {
                name: 'SESA Admin',
                email: 'admin@sesa.com',
                password: 'admin123_Secure!',
                role: UserRole.ADMIN
            },
            {
                name: 'Main Moderator',
                email: 'moderator@sesa.com',
                password: 'moderator123_Secure!',
                role: UserRole.MODERATOR
            },
            {
                name: 'Lead Instructor',
                email: 'instructor@sesa.com',
                password: 'instructor123_Secure!',
                role: UserRole.INSTRUCTOR
            },
            {
                name: 'Assistant Teacher',
                email: 'assistant@sesa.com',
                password: 'assistant123_Secure!',
                role: UserRole.ASSISTANT_INSTRUCTOR
            },
            {
                name: 'Premium Student',
                email: 'premium@sesa.com',
                password: 'student123_Secure!',
                role: UserRole.PREMIUM_STUDENT
            },
            {
                name: 'Regular Student',
                email: 'student@sesa.com',
                password: 'student123_Secure!',
                role: UserRole.STUDENT
            }
        ];

        for (const userData of usersToCreate) {
            const existingUser = await User.findOne({ email: userData.email });
            if (!existingUser) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(userData.password, salt);
                const user = new User({
                    ...userData,
                    password: hashedPassword
                });
                await user.save();
                console.log(`✅ User created: ${userData.email} (${userData.role}) | Pwd: ${userData.password}`);
            } else {
                console.log(`ℹ️ User already exists: ${userData.email}`);
            }
        }

        console.log('--- Seeding completed! 🚀 ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding error:', err);
        process.exit(1);
    }
};

seedDB();
