import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { useLocation } from '@/lib/navigation';

type ConciergeKey = 'about' | 'start' | 'studentFlow' | 'instructorFlow';

const replies: Record<ConciergeKey, string> = {
  about:
    'SESA Academy is a digital learning platform focused on practical education, clear approval workflows, and verified access to course content.',
  start:
    'Quick start: 1) Register with your role, 2) Browse courses, 3) Request enrollment, 4) Complete payment verification, 5) Start lessons from your dashboard.',
  studentFlow:
    'Student path: Dashboard -> Browse Courses -> Enrollment Request -> Payment Proof -> Approval -> Resource Vault and lessons.',
  instructorFlow:
    'Instructor path: Create Course -> Submit for admin review -> Track requests in dashboard -> publish after approval.',
};

const quickActions: Array<{ key: ConciergeKey; label: string }> = [
  { key: 'about', label: 'About Us' },
  { key: 'start', label: 'How to get started' },
  { key: 'studentFlow', label: 'Student journey' },
  { key: 'instructorFlow', label: 'Instructor journey' },
];

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

const inferRouteContext = (): string => {
  const path = window.location.pathname || '/';
  if (path.startsWith('/admin/approvals')) return 'You are on admin approvals. You can verify enrollments and review receipts/videos.';
  if (path.startsWith('/student/resources')) return 'You are in Resource Vault. You can search and open PDFs/docs/links from your enrolled courses.';
  if (path.startsWith('/student/browse')) return 'You are browsing courses. You can request enrollment from available courses.';
  if (path.startsWith('/dashboard')) return 'You are on the dashboard. Use role-specific cards and alerts to continue.';
  return `You are currently on ${path}.`;
};

const generateContextReply = (input: string): string => {
  const lower = input.toLowerCase();
  const routeContext = inferRouteContext();

  if (lower.includes('payment') || lower.includes('receipt') || lower.includes('verify')) {
    return `${routeContext} For payment flow: submit proof, then wait for admin verification. Once approved, course access is unlocked automatically.`;
  }
  if (lower.includes('enroll') || lower.includes('course')) {
    return `${routeContext} Enrollment flow: browse course -> request enrollment -> payment verification -> approval -> start learning.`;
  }
  if (lower.includes('resource') || lower.includes('pdf') || lower.includes('document')) {
    return `${routeContext} In Resource Vault, use search/filter by course and open the file card to access the original material URL.`;
  }
  if (lower.includes('admin') || lower.includes('approval') || lower.includes('review')) {
    return `${routeContext} Admin can review videos, receipts, and enrollment states from Approvals, then accept or reject directly.`;
  }
  if (lower.includes('start') || lower.includes('how')) {
    return `${routeContext} Recommended start: choose role -> complete auth -> open dashboard -> follow role tasks (student: browse/enroll, instructor: create/submit).`;
  }

  return `${routeContext} I can help with enrollment, payment verification, approvals, resources, and dashboard navigation. Ask me a specific task and I will guide step by step.`;
};

const SafeEduConcierge: React.FC = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ConciergeKey>('about');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: replies.about },
  ]);

  const handleQuickAction = (key: ConciergeKey) => {
    setSelected(key);
    setMessages((prev) => [...prev, { role: 'assistant', content: replies[key] }]);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const reply = generateContextReply(text);
    setMessages((prev) => [...prev, { role: 'user', content: text }, { role: 'assistant', content: reply }]);
    setInput('');
  };

  const isDashboardRoute = useMemo(() => {
    const path = location.pathname || '/';
    return ['/dashboard', '/student', '/instructor', '/admin'].some((prefix) => path.startsWith(prefix));
  }, [location.pathname]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className={`fixed z-50 h-[32rem] w-[min(24rem,calc(100vw-1rem))] max-h-[min(80vh,42rem)] overflow-hidden rounded-3xl border border-[#1d3f7a] bg-[#050b17]/90 shadow-2xl backdrop-blur-xl sm:h-[34rem] ${
              isDashboardRoute ? 'bottom-24 right-2 sm:bottom-24 sm:right-4 lg:right-6' : 'bottom-24 right-2 sm:right-6'
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#1d3f7a] bg-gradient-to-r from-[#0a1630] to-[#10244a] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-[#3b82f6]/20 p-2">
                  <Bot className="h-4 w-4 text-[#60a5fa]" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">SafeEdu Concierge</p>
                  <p className="text-[11px] text-slate-300">Your platform specialist</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex h-[calc(100%-3.5rem)] flex-col space-y-3 p-3 sm:p-4">
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.key}
                    onClick={() => handleQuickAction(action.key)}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      selected === action.key
                        ? 'border-[#3b82f6] bg-[#3b82f6] text-white'
                        : 'border-[#1d3f7a] bg-[#0a1630] text-slate-200 hover:border-[#3b82f6]/60'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 space-y-2 overflow-auto rounded-2xl border border-[#1d3f7a] bg-[#0a1630] p-3">
                {messages.map((msg, idx) => (
                  <div
                    key={`${msg.role}-${idx}`}
                    className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'assistant'
                        ? 'bg-[#10244a] text-slate-100'
                        : 'ml-8 bg-[#1e3a8a] text-white'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  placeholder="Ask anything about this page..."
                  className="flex-1 rounded-xl border border-[#1d3f7a] bg-[#0a1630] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-400 focus:border-[#3b82f6]"
                />
                <button
                  onClick={handleSend}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#3b82f6] bg-[#3b82f6] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#2563eb]"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen((v) => !v)}
        className={`fixed z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#60a5fa] to-[#1d4ed8] text-white shadow-2xl shadow-[#1d4ed8]/40 sm:h-14 sm:w-14 ${
          isDashboardRoute ? 'bottom-4 right-2 sm:bottom-6 sm:right-4 lg:right-6' : 'bottom-4 right-2 sm:right-6'
        }`}
        aria-label="Open SafeEdu Concierge"
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>
    </>
  );
};

export default SafeEduConcierge;
