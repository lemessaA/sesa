/**
 * Migration script to fix payment proof URLs
 * This updates all existing payment and enrollment records to use the correct /uploads/proofs/ path
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sesa-academy';

async function fixPaymentProofUrls() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully');

        const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
        const Enrollment = mongoose.model('Enrollment', new mongoose.Schema({}, { strict: false }));
        
        // Fix Payment records
        console.log('\n--- Fixing Payment records ---');
        const payments = await Payment.find({
            $or: [
                { proofUrl: { $regex: '^/uploads/proof-', $options: 'i' } },
                { receiptImage: { $regex: '^/uploads/proof-', $options: 'i' } }
            ]
        });

        console.log(`Found ${payments.length} payment(s) with incorrect proof URLs`);

        let paymentUpdatedCount = 0;
        for (const payment of payments) {
            let updated = false;

            // Fix proofUrl
            if (payment.proofUrl && payment.proofUrl.startsWith('/uploads/proof-')) {
                payment.proofUrl = payment.proofUrl.replace('/uploads/proof-', '/uploads/proofs/proof-');
                updated = true;
            }

            // Fix receiptImage
            if (payment.receiptImage && payment.receiptImage.startsWith('/uploads/proof-')) {
                payment.receiptImage = payment.receiptImage.replace('/uploads/proof-', '/uploads/proofs/proof-');
                updated = true;
            }

            if (updated) {
                await payment.save();
                paymentUpdatedCount++;
                console.log(`✓ Updated payment ${payment._id}`);
            }
        }

        // Fix Enrollment records
        console.log('\n--- Fixing Enrollment records ---');
        const enrollments = await Enrollment.find({
            paymentProofUrl: { $regex: '^/uploads/proof-', $options: 'i' }
        });

        console.log(`Found ${enrollments.length} enrollment(s) with incorrect proof URLs`);

        let enrollmentUpdatedCount = 0;
        for (const enrollment of enrollments) {
            if (enrollment.paymentProofUrl && enrollment.paymentProofUrl.startsWith('/uploads/proof-')) {
                enrollment.paymentProofUrl = enrollment.paymentProofUrl.replace('/uploads/proof-', '/uploads/proofs/proof-');
                await enrollment.save();
                enrollmentUpdatedCount++;
                console.log(`✓ Updated enrollment ${enrollment._id}`);
            }
        }

        console.log(`\n✅ Migration complete!`);
        console.log(`   - Updated ${paymentUpdatedCount} payment record(s)`);
        console.log(`   - Updated ${enrollmentUpdatedCount} enrollment record(s)`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

fixPaymentProofUrls();
