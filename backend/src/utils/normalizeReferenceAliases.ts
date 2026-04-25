import 'dotenv/config';
import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Progress from '../models/Progress.js';
import { getMongoUri, getMongooseConnectOptions } from '../config/mongoUri.js';
import { syncUserCourseRefs } from './normalizedRefs.js';

const needsNormalization = (doc: {
    userId?: mongoose.Types.ObjectId;
    user?: mongoose.Types.ObjectId;
    courseId?: mongoose.Types.ObjectId;
    course?: mongoose.Types.ObjectId;
}) => {
    const hasUserPair = Boolean(doc.userId && doc.user);
    const hasCoursePair = Boolean(doc.courseId && doc.course);
    return !hasUserPair || !hasCoursePair;
};

const normalizeModel = async (
    model: mongoose.Model<any>,
    label: string
): Promise<{ scanned: number; updated: number }> => {
    const docs = await model.find().cursor();
    let scanned = 0;
    let updated = 0;

    for await (const doc of docs) {
        scanned += 1;

        if (!needsNormalization(doc)) {
            continue;
        }

        syncUserCourseRefs(doc);

        if (doc.isModified('userId') || doc.isModified('user') || doc.isModified('courseId') || doc.isModified('course')) {
            await doc.save();
            updated += 1;
        }
    }

    console.log(`[normalize-refs] ${label}: scanned ${scanned}, updated ${updated}`);
    return { scanned, updated };
};

const main = async () => {
    const mongoUri = getMongoUri();
    await mongoose.connect(mongoUri, getMongooseConnectOptions(mongoUri));

    try {
        await normalizeModel(Payment, 'payments');
        await normalizeModel(Progress, 'progress');
        console.log('[normalize-refs] Completed successfully.');
    } finally {
        await mongoose.disconnect();
    }
};

main().catch((error) => {
    console.error('[normalize-refs] Failed:', error);
    process.exit(1);
});
