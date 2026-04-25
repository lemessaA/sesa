export type AgentResponseMode = 'default' | 'tutorial' | 'research' | 'conversation' | 'conversation_history';

export type AgentInvokePayload = {
  user_message: string;
  role: string;
  user_name?: string;
  /** Lets LangGraph refresh dashboard from Node before app_help / recommend. */
  user_id?: string;
  dashboard_context: Record<string, unknown>;
  conversation_history?: { role: string; content: string }[];
  /** When true, LangGraph runs BM25 over user-uploaded docs (RAG). */
  use_rag?: boolean;
  response_mode?: AgentResponseMode;
  /** Indexed filenames from Mongo (must match the same user as user_id in the RAG store). */
  user_document_names?: string[];
};

export type AgentInvokeResponse = {
  reply: string;
  intent: string;
  quiz?: { questions?: unknown[] };
  recommendations?: { title?: string; reason?: string; courseId?: string }[];
  rag_citations?: string[];
};

export async function invokeLangGraphAgent(
  payload: AgentInvokePayload
): Promise<AgentInvokeResponse> {
  const base = process.env.LANGGRAPH_AGENT_URL?.trim().replace(/\/+$/, '');
  if (!base) {
    throw new Error('LANGGRAPH_AGENT_URL is not configured');
  }

  const res = await fetch(`${base}/v1/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120_000),
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Agent service returned non-JSON (${res.status})`);
  }

  if (!res.ok) {
    const msg =
      typeof data === 'object' && data && 'detail' in data
        ? String((data as { detail: unknown }).detail)
        : text.slice(0, 500);
    throw new Error(`Agent service error ${res.status}: ${msg}`);
  }

  return normalizePythonAgentResponse(data) as AgentInvokeResponse;
}

/** Accept flat or { data: { reply, ... } } from FastAPI. */
function normalizePythonAgentResponse(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const o = data as Record<string, unknown>;
  if ('data' in o && o.data && typeof o.data === 'object') {
    const inner = o.data as Record<string, unknown>;
    if (typeof inner.reply === 'string') {
      return o.data;
    }
  }
  return data;
}
