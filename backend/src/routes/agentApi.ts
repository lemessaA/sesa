import express, { type Request, type Response, type Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { postAgentMessage, postInternalAgentDashboard } from '../controllers/aiAgentController.js';

/**
 * GET /api/v1 — version entry point (links to resources).
 * https://datatracker.ietf.org/doc/html/draft-kelly-json-hal
 */
export const getApiV1Index = (_req: Request, res: Response) => {
  res.set('Cache-Control', 'public, max-age=60');
  res.json({
    data: {
      version: 1,
      name: 'SESA API v1',
      _links: {
        self: { href: '/api/v1' },
        agent: { href: '/api/v1/agent' },
        agentHealth: { href: '/api/v1/agent/health' },
        agentMessages: { href: '/api/v1/agent/messages', method: 'POST' as const, description: 'Send user message' },
        ragDocuments: { href: '/api/v1/rag/documents' },
      },
    },
  });
};

function agentHealth(_req: Request, res: Response) {
  const langGraphConfigured = Boolean(process.env.LANGGRAPH_AGENT_URL?.trim());
  res.set('Cache-Control', 'no-store');
  res.json({
    data: {
      status: 'healthy',
      api: { name: 'agent', version: '1' },
      capabilities: { langGraphAgent: { available: langGraphConfigured } },
    },
  });
}

function buildAgentRouter(mode: 'v1' | 'legacy'): Router {
  const r = express.Router();
  r.get('/health', agentHealth);

  if (mode === 'v1') {
    r.post('/messages', authenticate, postAgentMessage);
    // Internal dashboard fetch for the LangGraph process. No token — restrict who can reach this in production.
    r.post('/internal/dashboard-context', postInternalAgentDashboard);
  } else {
    r.post('/chat', authenticate, postAgentMessage);
    r.post('/internal/context', postInternalAgentDashboard);
  }
  return r;
}

/** GET/POST /api/v1/agent/* — canonical REST-style agent API */
export const agentV1Router = buildAgentRouter('v1');

/** @deprecated Use /api/v1/agent. Shipped for backward compatibility. */
export const agentLegacyRouter = buildAgentRouter('legacy');
