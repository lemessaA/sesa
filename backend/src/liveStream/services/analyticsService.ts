import mongoose from 'mongoose';
import LiveSession from '../models/LiveSession.js';
import StreamEvent from '../models/StreamEvent.js';
import Attendance from '../models/Attendance.js';
import logger from '../../utils/logger.js';

/**
 * Compute and persist final analytics when a session ends
 */
export const computeSessionAnalytics = async (sessionId: string): Promise<void> => {
    try {
        const sid = new mongoose.Types.ObjectId(sessionId);

        // Get all attendance records for this session
        const attendees = await Attendance.find({ sessionId: sid }).lean();
        const totalAttendees = attendees.length;

        // Calculate average watch time
        const totalWatchTime = attendees.reduce((sum, a) => sum + (a.watchDurationSeconds || 0), 0);
        const avgWatchTimeSeconds = totalAttendees > 0 ? Math.round(totalWatchTime / totalAttendees) : 0;

        // Get peak concurrent from session (already tracked in Redis during session)
        const session = await LiveSession.findById(sid).lean();
        const peakConcurrent = session?.peakParticipants || 0;

        // Calculate drop-off rate: users who left before session ended / total
        const earlyLeavers = attendees.filter(a => {
            if (!a.leftAt || !session?.endedAt) return false;
            // Left more than 2 minutes before session ended
            return (session.endedAt.getTime() - new Date(a.leftAt).getTime()) > 120000;
        }).length;
        const dropOffRate = totalAttendees > 0 ? Math.round((earlyLeavers / totalAttendees) * 100) : 0;

        // Count chat messages and hand raises from events
        const [chatCount, handCount] = await Promise.all([
            StreamEvent.countDocuments({ sessionId: sid, eventType: 'chat' }),
            StreamEvent.countDocuments({ sessionId: sid, eventType: 'hand_raise' }),
        ]);

        // Update session with computed analytics
        await LiveSession.findByIdAndUpdate(sid, {
            'analytics.totalAttendees': totalAttendees,
            'analytics.peakConcurrent': peakConcurrent,
            'analytics.dropOffRate': dropOffRate,
            'analytics.avgWatchTimeSeconds': avgWatchTimeSeconds,
            'analytics.chatMessageCount': chatCount,
            'analytics.handRaiseCount': handCount,
        });

        logger.info(`[Analytics] Session ${sessionId}: ${totalAttendees} attendees, peak ${peakConcurrent}, dropoff ${dropOffRate}%, avg watch ${avgWatchTimeSeconds}s`);
    } catch (err: any) {
        logger.error(`[Analytics] Failed to compute for session ${sessionId}: ${err.message}`);
    }
};

/**
 * Get analytics for an instructor's sessions
 */
export const getInstructorAnalytics = async (instructorId: string, courseId?: string) => {
    const filter: Record<string, unknown> = { hostId: instructorId, status: 'ended' };
    if (courseId) filter.courseId = courseId;

    const sessions = await LiveSession.find(filter)
        .select('title courseId startedAt endedAt analytics participantCount peakParticipants')
        .populate('courseId', 'title')
        .sort({ endedAt: -1 })
        .limit(50)
        .lean();

    const totalSessions = sessions.length;
    const totalAttendees = sessions.reduce((sum, s) => sum + (s.analytics?.totalAttendees || 0), 0);
    const avgAttendees = totalSessions > 0 ? Math.round(totalAttendees / totalSessions) : 0;
    const avgDropOff = totalSessions > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.analytics?.dropOffRate || 0), 0) / totalSessions)
        : 0;

    return {
        totalSessions,
        totalAttendees,
        avgAttendees,
        avgDropOff,
        sessions,
    };
};

/**
 * Get platform-wide analytics for admin
 */
export const getAdminAnalytics = async () => {
    const [totalSessions, activeSessions, totalAttendanceRecords] = await Promise.all([
        LiveSession.countDocuments({ status: 'ended' }),
        LiveSession.countDocuments({ status: 'live' }),
        Attendance.countDocuments(),
    ]);

    // Top 5 sessions by peak participants
    const topSessions = await LiveSession.find({ status: 'ended' })
        .sort({ peakParticipants: -1 })
        .limit(5)
        .populate('hostId', 'name')
        .populate('courseId', 'title')
        .select('title peakParticipants analytics startedAt')
        .lean();

    return {
        totalSessions,
        activeSessions,
        totalAttendanceRecords,
        topSessions,
    };
};
