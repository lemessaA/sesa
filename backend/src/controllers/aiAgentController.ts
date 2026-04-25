import type { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import User from '../models/User.js';
import { UserRole } from '../models/User.js';
import { buildAgentDashboardContext } from './dashboardController.js';
import { createChatResponse } from '../services/aiService.js';
import { invokeLangGraphAgent } from '../services/langGraphAgentClient.js';
import logger from '../utils/logger.js';
import { sendProblem } from '../utils/problemJson.js';

function normalizeRole(role: string): UserRole {
  const allowed = Object.values(UserRole) as string[];
  if (allowed.includes(role)) return role as UserRole;
  return UserRole.STUDENT;
}

function fallbackAgentSystemPrompt(
  dashboard: Record<string, unknown>,
  userName?: string
): string {
  const dashJson = JSON.stringify(dashboard);
  const truncated = dashJson.length > 10000 ? `${dashJson.slice(0, 10000)}…` : dashJson;
  return `You are the SESA personal assistant. The user is signed in as ${userName || 'a learner'}.

Use this live dashboard snapshot (stats, routes in quickActions, enrollments, recommendations) to give accurate, concise answers:
${truncated}

Capabilities you should steer users toward:
- Students: browse/enroll in courses, track progress on the dashboard, certificates, AI tutor sessions (/api/ai-tutor), quizzes and assessments.
- Instructors: create courses, view enrollments and analytics.
- If they ask for a quiz, output 3–5 clear practice questions in plain text (numbered) with answers at the end.
- If they ask what to do next, prioritize routes from quickActions and unfinished courses from progress.

Keep replies under ~400 words unless they ask for detail.`;
}

/**
 * Internal: service-to-service dashboard snapshot (e.g. Python LangGraph refresh).
 * POST { userId: string } → 200 { data: { context } } or 4xx/5xx Problem+JSON
 */
export const postInternalAgentDashboard = async (req: Request, res: Response) => {
  try {
    const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
    if (!userId) {
      return sendProblem(res, 400, 'VALIDATION_ERROR', 'Bad Request', 'Request body must include "userId".');
    }
    const user = await User.findById(userId).select('role').lean();
    if (!user) {
      return sendProblem(res, 404, 'NOT_FOUND', 'User Not Found', 'No user exists for the given id.');
    }
    const role = normalizeRole(String(user.role));
    const context = await buildAgentDashboardContext(userId, role);
    return res.status(200).json({ data: { context } });
  } catch (err) {
    logger.error('[agent] internal dashboard context failed', err);
    return sendProblem(
      res,
      500,
      'INTERNAL_ERROR',
      'Internal Server Error',
      'Failed to build dashboard context.'
    );
  }
};

/**
 * POST /api/v1/agent/messages — LangGraph agent or inline AI fallback.
 * Response: 200 { data: { reply, intent, quiz?, recommendations?, source } }
 */
export const postAgentMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = normalizeRole(req.user!.role);
    const { message, conversationHistory } = req.body as {
      message?: string;
      conversationHistory?: { role: string; content: string }[];
    };

    if (!message || typeof message !== 'string' || !message.trim()) {
      return sendProblem(
        res,
        400,
        'VALIDATION_ERROR',
        'Validation Error',
        'Field "message" is required and must be a non-empty string.'
      );
    }

    const [user, dashboard] = await Promise.all([
      User.findById(userId).select('name').lean(),
      buildAgentDashboardContext(userId, role),
    ]);

    const history = Array.isArray(conversationHistory)
      ? conversationHistory
          .filter((m) => m && typeof m.content === 'string' && typeof m.role === 'string')
          .slice(-10)
      : [];

    const langGraphEnabled = Boolean(process.env.LANGGRAPH_AGENT_URL?.trim());
    if (langGraphEnabled) {
      try {
        const agentOut = await invokeLangGraphAgent({
          user_message: message,
          role: String(role),
          user_name: user?.name,
          user_id: userId,
          dashboard_context: dashboard,
          conversation_history: history,
        });
        return res.status(200).json({
          data: {
            reply: agentOut.reply,
            intent: agentOut.intent,
            quiz: agentOut.quiz,
            recommendations: agentOut.recommendations,
            source: 'langgraph' as const,
          },
        });
      } catch (langErr) {
        logger.warn(
          { err: langErr },
          '[agent] LangGraph service unreachable or error — falling back to inline AI'
        );
      }
    } else {
      logger.info('[agent] LangGraph not configured — using inline AI');
    }

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: fallbackAgentSystemPrompt(dashboard, user?.name) },
      ...history.map((m) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const reply = await createChatResponse(messages, { temperature: 0.55, maxTokens: 1200 });
    return res.status(200).json({
      data: {
        reply,
        intent: 'general',
        quiz: undefined,
        recommendations: undefined,
        source: 'inline' as const,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[agent] message completion failed', err);
    return sendProblem(
      res,
      503,
      'SERVICE_UNAVAILABLE',
      'Service Unavailable',
      process.env.NODE_ENV === 'development'
        ? msg
        : 'The agent service is not available. Try again later or contact support.'
    );
  }
};
