import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course.js';
import User, { UserRole } from '../models/User.js';
import { getMongoUri, MONGOOSE_CONNECT_OPTIONS } from '../config/mongoUri.js';

dotenv.config();

const seedCourses = async () => {
    const MONGO_URI = getMongoUri();

    try {
        await mongoose.connect(MONGO_URI, { ...MONGOOSE_CONNECT_OPTIONS });
        console.log('Connected to MongoDB for seeding courses...');

        // Find the instructor user
        const instructor = await User.findOne({ role: UserRole.INSTRUCTOR });
        const student = await User.findOne({ role: UserRole.STUDENT });

        if (!instructor) {
            console.error('No instructor found. Please run seed script first.');
            process.exit(1);
        }

        if (!student) {
            console.error('No student found. Please run seed script first.');
            process.exit(1);
        }

        const coursesToCreate = [
            {
                title: 'Introduction to React',
                description: 'Learn React from scratch. Build modern web applications with React, hooks, and state management.',
                resourceUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
                instructor: instructor._id
            },
            {
                title: 'Node.js & Express Masterclass',
                description: 'Master backend development with Node.js and Express. Learn REST APIs, authentication, and database integration.',
                resourceUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
                instructor: instructor._id
            },
            {
                title: 'MongoDB Complete Guide',
                description: 'Complete guide to MongoDB. Learn NoSQL database design, queries, aggregation, and best practices.',
                resourceUrl: 'https://www.youtube.com/watch?v=-56x56UppqQ',
                instructor: instructor._id
            },
            {
                title: 'TypeScript for Beginners',
                description: 'Learn TypeScript and add type safety to your JavaScript projects. Perfect for beginners.',
                resourceUrl: 'https://www.youtube.com/watch?v=BwuLxPH8IDs',
                instructor: instructor._id
            },
            {
                title: 'Python Programming Fundamentals',
                description: 'Start your programming journey with Python. Learn syntax, data structures, and problem solving.',
                resourceUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
                instructor: instructor._id
            },
            {
                title: 'Full Stack MERN Development',
                description: 'Build complete web applications with MongoDB, Express, React, and Node.js.',
                resourceUrl: 'https://www.youtube.com/watch?v=7CqJlxBYj-M',
                instructor: instructor._id
            }
        ];

        for (const courseData of coursesToCreate) {
            const existingCourse = await Course.findOne({ title: courseData.title });
            if (!existingCourse) {
                const course = new Course(courseData);
                await course.save();
                console.log(`✅ Course created: ${courseData.title}`);

                // Enroll student in first 3 courses
                if (coursesToCreate.indexOf(courseData) < 3) {
                    course.students.push({
                        studentId: student._id,
                        status: coursesToCreate.indexOf(courseData) < 2 ? 'approved' : 'pending'
                    });
                    await course.save();
                    console.log(`   📝 Student enrolled in: ${courseData.title} (${coursesToCreate.indexOf(courseData) < 2 ? 'approved' : 'pending'})`);
                }
            } else {
                console.log(`ℹ️  Course already exists: ${courseData.title}`);
            }
        }

        console.log('--- Course seeding completed! 🚀 ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Course seeding error:', err);
        process.exit(1);
    }
};

seedCourses();
