import mongoose from 'mongoose';
import Gamification from '../models/Gamification.js';
import { createNotification } from '../models/Notification.js';
import { notifyUser } from '../utils/socket.js';

export type GamificationAction = 
    | 'lesson_complete' 
    | 'quiz_pass' 
    | 'quiz_perfect' 
    | 'course_enroll' 
    | 'course_complete' 
    | 'daily_streak' 
    | 'bonus';

const POINT_VALUES: Record<GamificationAction, number> = {
    lesson_complete: 50,
    quiz_pass: 100,
    quiz_perfect: 200,
    course_enroll: 20,
    course_complete: 500,
    daily_streak: 10, // Base, will be multiplied by streak count
    bonus: 0 // Dynamic
};

export class GamificationService {
    /**
     * Award points to a user for a specific action
     */
    static async awardPoints(
        userId: string | mongoose.Types.ObjectId, 
        action: GamificationAction, 
        metadata: { 
            points?: number, 
            reason?: string, 
            sourceId?: string | mongoose.Types.ObjectId 
        } = {}
    ) {
        try {
            let gamification = await Gamification.findOne({ userId });
            
            if (!gamification) {
                gamification = new Gamification({ userId });
            }

            const basePoints = POINT_VALUES[action];
            let pointsToAward = metadata.points || basePoints;

            // Handle special logic for streaks
            if (action === 'daily_streak' && !metadata.points) {
                pointsToAward = gamification.streak.current * 10;
            }

            const oldLevel = gamification.level;
            gamification.totalPoints += pointsToAward;
            
            // Re-calculate level (Model pre-save also does this, but we need it here for notification)
            const newLevel = Math.floor(gamification.totalPoints / 1000) + 1;
            
            gamification.pointsHistory.push({
                points: pointsToAward,
                reason: metadata.reason || this.getDefaultReason(action),
                source: this.mapActionToSource(action),
                sourceId: metadata.sourceId ? new mongoose.Types.ObjectId(metadata.sourceId.toString()) : undefined,
                earnedAt: new Date()
            });

            // Update achievements counts
            if (action === 'lesson_complete') gamification.achievements.lessonsCompleted += 1;
            if (action === 'quiz_pass') gamification.achievements.quizzesPassed += 1;
            if (action === 'quiz_perfect') {
                gamification.achievements.quizzesPassed += 1;
                gamification.achievements.perfectScores += 1;
            }
            if (action === 'course_complete') gamification.achievements.coursesCompleted += 1;

            await gamification.save();

            // Handle Level Up
            if (newLevel > oldLevel) {
                await this.handleLevelUp(userId, newLevel);
            }

            // Socket notification for points
            notifyUser(userId.toString(), `You earned ${pointsToAward} XP!`, { 
                type: 'points_earned', 
                points: pointsToAward,
                totalPoints: gamification.totalPoints,
                level: newLevel
            });

            return {
                pointsAwarded: pointsToAward,
                totalPoints: gamification.totalPoints,
                level: newLevel,
                leveledUp: newLevel > oldLevel
            };
        } catch (error) {
            console.error('Error awarding points:', error);
            throw error;
        }
    }

    /**
     * Update user streak
     */
    static async updateStreak(userId: string | mongoose.Types.ObjectId) {
        try {
            let gamification = await Gamification.findOne({ userId });
            if (!gamification) {
                gamification = new Gamification({ userId });
            }

            const now = new Date();
            const lastActivity = gamification.streak.lastActivityDate;
            
            // Reset hours to compare dates only
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const lastDate = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
            
            const diffTime = Math.abs(today.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                // Already active today
                return gamification.streak;
            }

            if (diffDays === 1) {
                // Sequential day!
                gamification.streak.current += 1;
                if (gamification.streak.current > gamification.streak.longest) {
                    gamification.streak.longest = gamification.streak.current;
                }
                
                // Award points for streak
                await this.awardPoints(userId, 'daily_streak', { 
                    reason: `${gamification.streak.current}-day streak!` 
                });
            } else {
                // Streak broken
                gamification.streak.current = 1;
            }

            gamification.streak.lastActivityDate = now;
            await gamification.save();

            return gamification.streak;
        } catch (error) {
            console.error('Error updating streak:', error);
            throw error;
        }
    }

    private static getDefaultReason(action: GamificationAction): string {
        switch (action) {
            case 'lesson_complete': return 'Completed a lesson';
            case 'quiz_pass': return 'Passed a quiz';
            case 'quiz_perfect': return 'Perfect score on quiz!';
            case 'course_enroll': return 'Enrolled in a new course';
            case 'course_complete': return 'Completed a full course';
            case 'daily_streak': return 'Daily learning streak';
            default: return 'Bonus points';
        }
    }

    private static mapActionToSource(action: GamificationAction): any {
        if (action === 'lesson_complete') return 'lesson';
        if (action === 'quiz_pass' || action === 'quiz_perfect') return 'quiz';
        if (action === 'daily_streak') return 'streak';
        if (action === 'course_enroll' || action === 'course_complete') return 'bonus';
        return 'bonus';
    }

    private static async handleLevelUp(userId: string | mongoose.Types.ObjectId, level: number) {
        await createNotification({
            userId,
            type: 'system',
            title: '🎉 Level Up!',
            message: `Congratulations! You've reached Level ${level}. Keep up the great work!`,
            link: '/student/dashboard'
        });

        notifyUser(userId.toString(), `Congratulations! You reached Level ${level}!`, { type: 'level_up', level });
    }
}
