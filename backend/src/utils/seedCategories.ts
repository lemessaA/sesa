import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import { getMongoUri, MONGOOSE_CONNECT_OPTIONS } from '../config/mongoUri.js';

dotenv.config();

const seedCategories = async () => {
    const MONGO_URI = getMongoUri();

    try {
        await mongoose.connect(MONGO_URI, { ...MONGOOSE_CONNECT_OPTIONS });
        console.log('Connected to MongoDB for seeding categories...');

        const categoriesToCreate = [
            {
                name: 'Web Development',
                description: 'Learn HTML, CSS, JavaScript, React, Node.js and more',
                icon: '💻'
            },
            {
                name: 'Mobile Development',
                description: 'Build iOS and Android apps with React Native, Flutter',
                icon: '📱'
            },
            {
                name: 'Data Science',
                description: 'Master data analysis, visualization, and statistics',
                icon: '📊'
            },
            {
                name: 'Machine Learning',
                description: 'Learn AI, neural networks, and deep learning',
                icon: '🤖'
            },
            {
                name: 'DevOps',
                description: 'CI/CD, Docker, Kubernetes, cloud infrastructure',
                icon: '⚙️'
            },
            {
                name: 'Cybersecurity',
                description: 'Network security, ethical hacking, cryptography',
                icon: '🔒'
            },
            {
                name: 'UI/UX Design',
                description: 'User interface and experience design principles',
                icon: '🎨'
            },
            {
                name: 'Business',
                description: 'Entrepreneurship, management, and business strategy',
                icon: '💼'
            },
            {
                name: 'Marketing',
                description: 'Digital marketing, SEO, social media, content marketing',
                icon: '📈'
            },
            {
                name: 'Languages',
                description: 'Learn programming and spoken languages',
                icon: '🌍'
            },
            {
                name: 'Mathematics',
                description: 'Algebra, calculus, statistics, and applied mathematics',
                icon: '📐'
            },
            {
                name: 'Science',
                description: 'Physics, chemistry, biology, and natural sciences',
                icon: '🔬'
            }
        ];

        for (const categoryData of categoriesToCreate) {
            const existingCategory = await Category.findOne({ name: categoryData.name });
            if (!existingCategory) {
                const category = new Category(categoryData);
                await category.save();
                console.log(`✅ Category created: ${categoryData.name} ${categoryData.icon}`);
            } else {
                console.log(`ℹ️  Category already exists: ${categoryData.name}`);
            }
        }

        console.log('--- Category seeding completed! 🚀 ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Category seeding error:', err);
        process.exit(1);
    }
};

seedCategories();
