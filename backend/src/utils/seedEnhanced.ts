import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User, { UserRole } from '../models/User.js';
import Course from '../models/Course.js';
import Category from '../models/Category.js';
import Enrollment from '../models/Enrollment.js';
import Payment from '../models/Payment.js';
import Progress from '../models/Progress.js';
import Certificate from '../models/Certificate.js';
import Announcement from '../models/Announcement.js';
import { getMongoUri, getMongooseConnectOptions } from '../config/mongoUri.js';

dotenv.config();

async function seedDatabase() {
    try {
        const MONGO_URI = getMongoUri();
        await mongoose.connect(MONGO_URI, getMongooseConnectOptions(MONGO_URI));
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Course.deleteMany({});
        await Category.deleteMany({});
        await Enrollment.deleteMany({});
        await Payment.deleteMany({});
        await Progress.deleteMany({});
        await Certificate.deleteMany({});
        await Announcement.deleteMany({});

        console.log('Cleared existing data');

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // Create users for all roles
        const users = await User.insertMany([
            // Admin Roles
            {
                name: 'Super Admin',
                email: 'superadmin@sesa.com',
                password: hashedPassword,
                role: UserRole.SUPER_ADMIN,
                isActive: true,
                bio: 'System Super Administrator'
            },
            {
                name: 'Admin User',
                email: 'admin@sesa.com',
                password: hashedPassword,
                role: UserRole.ADMIN,
                isActive: true,
                bio: 'System Administrator'
            },
            {
                name: 'Moderator User',
                email: 'moderator@sesa.com',
                password: hashedPassword,
                role: UserRole.MODERATOR,
                isActive: true,
                bio: 'Content Moderator'
            },
            {
                name: 'Content Manager',
                email: 'content@sesa.com',
                password: hashedPassword,
                role: UserRole.CONTENT_MANAGER,
                isActive: true,
                bio: 'Content Management Specialist'
            },
            {
                name: 'Support Staff',
                email: 'support@sesa.com',
                password: hashedPassword,
                role: UserRole.SUPPORT_STAFF,
                isActive: true,
                bio: 'Customer Support Representative'
            },

            // Instructor Roles
            {
                name: 'Lead Instructor',
                email: 'instructor@sesa.com',
                password: hashedPassword,
                role: UserRole.INSTRUCTOR,
                isActive: true,
                bio: 'Senior Course Instructor'
            },
            {
                name: 'Assistant Instructor',
                email: 'assistant@sesa.com',
                password: hashedPassword,
                role: UserRole.ASSISTANT_INSTRUCTOR,
                isActive: true,
                bio: 'Teaching Assistant'
            },
            {
                name: 'Guest Instructor',
                email: 'guest@sesa.com',
                password: hashedPassword,
                role: UserRole.GUEST_INSTRUCTOR,
                isActive: true,
                bio: 'Guest Lecturer'
            },

            // Student Roles
            {
                name: 'Regular Student',
                email: 'student@sesa.com',
                password: hashedPassword,
                role: UserRole.STUDENT,
                isActive: true,
                bio: 'Regular Student Account'
            },
            {
                name: 'Premium Student',
                email: 'premium@sesa.com',
                password: hashedPassword,
                role: UserRole.PREMIUM_STUDENT,
                isActive: true,
                bio: 'Premium Membership Student'
            },
            {
                name: 'Trial Student',
                email: 'trial@sesa.com',
                password: hashedPassword,
                role: UserRole.TRIAL_STUDENT,
                isActive: true,
                bio: 'Trial Period Student'
            },

            // Specialized Roles
            {
                name: 'Content Reviewer',
                email: 'reviewer@sesa.com',
                password: hashedPassword,
                role: UserRole.REVIEWER,
                isActive: true,
                bio: 'Content Review Specialist'
            },
            {
                name: 'Data Analyst',
                email: 'analyst@sesa.com',
                password: hashedPassword,
                role: UserRole.ANALYST,
                isActive: true,
                bio: 'Business Intelligence Analyst'
            },
            {
                name: 'Finance Manager',
                email: 'finance@sesa.com',
                password: hashedPassword,
                role: UserRole.FINANCE_MANAGER,
                isActive: true,
                bio: 'Financial Operations Manager'
            }
        ]);

        console.log('Created users for all 14 roles');

        // Create categories
        const categories = await Category.insertMany([
            { name: 'Programming', icon: 'code' },
            { name: 'Web Development', icon: 'web' },
            { name: 'Data Science', icon: 'chart' },
            { name: 'Mobile Development', icon: 'mobile' },
            { name: 'DevOps', icon: 'server' },
            { name: 'Design', icon: 'palette' },
            { name: 'Business', icon: 'briefcase' },
            { name: 'Marketing', icon: 'megaphone' }
        ]);

        console.log('Created categories');

        // Get instructor user
        const instructor = users.find(u => u.role === UserRole.INSTRUCTOR);
        const assistant = users.find(u => u.role === UserRole.ASSISTANT_INSTRUCTOR);

        // Create courses
        const courses = await Course.insertMany([
            {
                title: 'Complete JavaScript Masterclass',
                description: 'Learn JavaScript from basics to advanced concepts. Part 1 is free, full course requires payment.',
                resourceUrl: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
                previewVideoUrl: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
                enrolledContentUrls: [
                    'https://www.youtube.com/watch?v=W6NZfCO5SIk',
                    'https://www.youtube.com/watch?v=hdI2bqOjy3c',
                    'https://www.youtube.com/watch?v=3PHXvlpOkf4'
                ],
                youtubeVideoId: 'PkZNo7MFNFg',
                thumbnailUrl: 'https://i.ytimg.com/vi/PkZNo7MFNFg/maxresdefault.jpg',
                category: categories[0]._id,
                instructor: instructor!._id,
                level: 'beginner',
                duration: '20 hours',
                price: 99.99,
                tags: ['javascript', 'programming', 'web'],
                isPublished: true,
                status: 'approved'
            },
            {
                title: 'React Complete Course',
                description: 'Master React.js with hands-on projects. Preview available, full access after payment.',
                resourceUrl: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
                previewVideoUrl: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
                enrolledContentUrls: [
                    'https://www.youtube.com/watch?v=Ke90Tje7VS0',
                    'https://www.youtube.com/watch?v=w7ejDZ8SWv8'
                ],
                youtubeVideoId: 'bMknfKXIFA8',
                thumbnailUrl: 'https://i.ytimg.com/vi/bMknfKXIFA8/maxresdefault.jpg',
                category: categories[1]._id,
                instructor: instructor!._id,
                level: 'intermediate',
                duration: '15 hours',
                price: 149.99,
                tags: ['react', 'frontend', 'javascript'],
                isPublished: true,
                status: 'approved'
            },
            {
                title: 'Python for Data Science',
                description: 'Learn Python and data analysis. First lesson free!',
                resourceUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
                previewVideoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
                enrolledContentUrls: [
                    'https://www.youtube.com/watch?v=HXV3zeQKqGY',
                    'https://www.youtube.com/watch?v=GPVsHOlRBBI'
                ],
                youtubeVideoId: 'rfscVS0vtbw',
                thumbnailUrl: 'https://i.ytimg.com/vi/rfscVS0vtbw/maxresdefault.jpg',
                category: categories[2]._id,
                instructor: assistant!._id,
                level: 'beginner',
                duration: '25 hours',
                price: 129.99,
                tags: ['python', 'data-science', 'analytics'],
                isPublished: true,
                status: 'approved'
            },
            {
                title: 'Node.js Backend Development',
                description: 'Build scalable backend applications with Node.js',
                resourceUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
                previewVideoUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
                enrolledContentUrls: [
                    'https://www.youtube.com/watch?v=fBNz5xF-Kx4',
                    'https://www.youtube.com/watch?v=ENrzD9HAZK4'
                ],
                youtubeVideoId: 'Oe421EPjeBE',
                thumbnailUrl: 'https://i.ytimg.com/vi/Oe421EPjeBE/maxresdefault.jpg',
                category: categories[1]._id,
                instructor: instructor!._id,
                level: 'intermediate',
                duration: '18 hours',
                price: 119.99,
                tags: ['nodejs', 'backend', 'javascript'],
                isPublished: true,
                status: 'approved'
            },
            {
                title: 'Mobile App Development with React Native',
                description: 'Create cross-platform mobile apps',
                resourceUrl: 'https://www.youtube.com/watch?v=0-S5a0eXPoc',
                previewVideoUrl: 'https://www.youtube.com/watch?v=0-S5a0eXPoc',
                enrolledContentUrls: [
                    'https://www.youtube.com/watch?v=ur6I5m2nTvk',
                    'https://www.youtube.com/watch?v=qSRrxpdMpVc'
                ],
                youtubeVideoId: '0-S5a0eXPoc',
                thumbnailUrl: 'https://i.ytimg.com/vi/0-S5a0eXPoc/maxresdefault.jpg',
                category: categories[3]._id,
                instructor: assistant!._id,
                level: 'advanced',
                duration: '22 hours',
                price: 159.99,
                tags: ['react-native', 'mobile', 'ios', 'android'],
                isPublished: true,
                status: 'approved'
            }
        ]);

        console.log('Created courses');

        // Get student users
        const student = users.find(u => u.role === UserRole.STUDENT);
        const premiumStudent = users.find(u => u.role === UserRole.PREMIUM_STUDENT);

        // Create enrollments
        const enrollments = await Enrollment.insertMany([
            {
                user: student!._id,
                course: courses[0]._id,
                status: 'pending'
            },
            {
                user: premiumStudent!._id,
                course: courses[0]._id,
                status: 'approved'
            },
            {
                user: premiumStudent!._id,
                course: courses[1]._id,
                status: 'approved'
            }
        ]);

        console.log('Created enrollments');

        // Create payments
        const payments = await Payment.insertMany([
            {
                user: premiumStudent!._id,
                course: courses[0]._id,
                amount: 99.99,
                paymentMethod: 'stripe',
                status: 'completed',
                transactionId: 'TXN-001',
                paymentDate: new Date()
            },
            {
                user: premiumStudent!._id,
                course: courses[1]._id,
                amount: 149.99,
                paymentMethod: 'paypal',
                status: 'completed',
                transactionId: 'TXN-002',
                paymentDate: new Date()
            }
        ]);

        console.log('Created payments');

        // Create progress
        const progressRecords = await Progress.insertMany([
            {
                user: premiumStudent!._id,
                course: courses[0]._id,
                userId: premiumStudent!._id,
                courseId: courses[0]._id,
                watchCount: 5,
                totalMinutesWatched: 120,
                completed: false
            },
            {
                user: premiumStudent!._id,
                course: courses[1]._id,
                userId: premiumStudent!._id,
                courseId: courses[1]._id,
                watchCount: 10,
                totalMinutesWatched: 300,
                completed: true
            }
        ]);

        console.log('Created progress records');

        // Create certificate
        const certificates = await Certificate.insertMany([
            {
                user: premiumStudent!._id,
                course: courses[1]._id,
                certificateNumber: 'CERT-2024-001',
                issuedDate: new Date(),
                grade: 'A',
                certificateUrl: '/certificates/CERT-2024-001.pdf'
            }
        ]);

        console.log('Created certificates');

        // Get admin user for announcements
        const admin = users.find(u => u.role === UserRole.ADMIN);

        // Create announcements
        const announcements = await Announcement.insertMany([
            {
                title: 'Welcome to SESA Learning Platform',
                message: 'Start your learning journey today! Part 1 of all courses is free.',
                type: 'info',
                isActive: true,
                createdBy: admin!._id
            },
            {
                title: 'New Courses Available',
                message: 'Check out our latest courses in Web Development and Data Science.',
                type: 'success',
                isActive: true,
                createdBy: admin!._id
            }
        ]);

        console.log('Created announcements');

        // Update courses with enrollments
        await Course.findByIdAndUpdate(courses[0]._id, {
            $push: {
                students: {
                    studentId: premiumStudent!._id,
                    status: 'approved',
                    enrolledAt: new Date(),
                    approvedAt: new Date()
                }
            },
            $addToSet: {
                enrolledStudents: premiumStudent!._id
            }
        });

        await Course.findByIdAndUpdate(courses[1]._id, {
            $push: {
                students: {
                    studentId: premiumStudent!._id,
                    status: 'approved',
                    enrolledAt: new Date(),
                    approvedAt: new Date()
                }
            },
            $addToSet: {
                enrolledStudents: premiumStudent!._id
            }
        });

        console.log('\n✅ Database seeded successfully!\n');
        console.log('Test Credentials:');
        console.log('==================');
        console.log('Email: [role]@sesa.com');
        console.log('Password: password123');
        console.log('\nAvailable roles:');
        console.log('- superadmin@sesa.com (Super Admin)');
        console.log('- admin@sesa.com (Admin)');
        console.log('- moderator@sesa.com (Moderator)');
        console.log('- content@sesa.com (Content Manager)');
        console.log('- support@sesa.com (Support Staff)');
        console.log('- instructor@sesa.com (Instructor)');
        console.log('- assistant@sesa.com (Assistant Instructor)');
        console.log('- guest@sesa.com (Guest Instructor)');
        console.log('- student@sesa.com (Student)');
        console.log('- premium@sesa.com (Premium Student)');
        console.log('- trial@sesa.com (Trial Student)');
        console.log('- reviewer@sesa.com (Reviewer)');
        console.log('- analyst@sesa.com (Analyst)');
        console.log('- finance@sesa.com (Finance Manager)');

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seedDatabase();
