import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI;
console.log(`Connecting to: ${MONGO_URI?.replace(/\/\/.*@/, '//****:****@')}`);

async function testConnection() {
    try {
        await mongoose.connect(MONGO_URI!);
        console.log('✅ Connection Successful!');
        process.exit(0);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('❌ Connection Failed:', message);
        process.exit(1);
    }
}

testConnection();
