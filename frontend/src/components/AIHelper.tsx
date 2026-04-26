import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Loader2, User, MessageSquarePlus, Paperclip, FileText } from 'lucide-react';
import apiService from '../utils/api';

interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

const QUICK_ACTIONS = [
    { label: '✨ What can you do?', query: 'What can you help me with in SESA? List your main capabilities in short bullets.' },
    { label: '📄 My uploaded file', query: 'Summarize the main points from my uploaded document in 3–5 bullet points.' },
    { label: '❓ Quiz me', query: 'Give me 5 practice questions on a topic that matches one of my current courses, with answers at the end.' },
    { label: '🎯 What next?', query: 'Based on my dashboard, what should I focus on this week? Give specific next steps.' },
    { label: '📚 How to enroll?', query: 'How do I enroll in a course?' },
    { label: '💳 Payment options', query: 'What payment methods do you accept?' },
    { label: '📊 My dashboard', query: 'What can I see in my dashboard?' },
    { label: '🎓 Certificates', query: 'How do I get a certificate?' },
    { label: '👨‍🏫 Become instructor', query: 'How can I become an instructor?' },
];

type AgentChatPayload = {
    reply?: string;
    quiz?: { questions?: Array<Record<string, unknown>> };
    recommendations?: Array<{ title?: string; reason?: string; courseTitle?: string; courseId?: string }>;
    intent?: string;
    /** From Node API (camelCase). */
    ragCitations?: string[];
};

const RESPONSE_MODES: { id: string; label: string }[] = [
    { id: 'default', label: 'Default' },
    { id: 'tutorial', label: 'Tutorial' },
    { id: 'research', label: 'Research' },
    { id: 'conversation', label: 'Conversation' },
];

function formatAgentReply(data: AgentChatPayload): string {
    const parts: string[] = [];
    if (data.reply?.trim()) parts.push(data.reply.trim());
    const qs = data.quiz?.questions;
    if (Array.isArray(qs) && qs.length > 0) {
        const preview = qs
            .slice(0, 4)
            .map((q, i) => {
                const t = (q.question as string) || (q.questionText as string) || JSON.stringify(q);
                return `${i + 1}. ${t}`;
            })
            .join('\n');
        parts.push(
            `\n**Practice quiz (${qs.length} questions)** — preview:\n${preview}${qs.length > 4 ? '\n…' : ''}`
        );
    }
    if (Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        const lines = data.recommendations
            .map((r) => {
                const title = r.title || r.courseTitle || 'Course';
                return `• **${title}**${r.reason ? `: ${r.reason}` : ''}`;
            })
            .join('\n');
        parts.push(`\n**Suggested next steps:**\n${lines}`);
    }
    if (data.ragCitations && data.ragCitations.length > 0) {
        parts.push(`\n**Sources (your uploads):** ${data.ragCitations.join(' · ')}`);
    }
    return parts.join('\n') || 'Sorry, I could not generate a response right now. Please try again.';
}

const AIHelper: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            text: 'Hi there! I am the SESA AI Assistant 🎓 How can I help you today?',
            sender: 'ai',
            timestamp: new Date(),
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(true);
    const [useRag, setUseRag] = useState(true);
    const [responseMode, setResponseMode] = useState('default');
    const [ragDocs, setRagDocs] = useState<
        { id: string; originalName: string; status: string; chunkCount?: number }[]
    >([]);
    const [uploadBusy, setUploadBusy] = useState(false);
    const [ragEligible, setRagEligible] = useState<boolean | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const loadRagAccess = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setRagEligible(null);
            return;
        }
        try {
            const res = await apiService.rag.access();
            const eligible = Boolean((res.data as { data?: { eligible?: boolean } })?.data?.eligible);
            setRagEligible(eligible);
            if (!eligible) setUseRag(false);
        } catch {
            setRagEligible(false);
            setUseRag(false);
        }
    }, []);

    const loadRagDocs = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await apiService.rag.listDocuments();
            const data = (res.data as { data?: { documents?: typeof ragDocs } })?.data;
            if (data?.documents) setRagDocs(data.documents);
        } catch {
            setRagDocs([]);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            void loadRagAccess();
        }
    }, [isOpen, loadRagAccess]);

    useEffect(() => {
        if (isOpen && ragEligible === true) {
            void loadRagDocs();
        }
        if (isOpen && ragEligible === false) {
            setRagDocs([]);
        }
    }, [isOpen, ragEligible, loadRagDocs]);

    // When at least one file is indexed, default document mode on so questions can use those uploads.
    useEffect(() => {
        if (ragEligible && ragDocs.some((d) => d.status === 'indexed')) {
            setUseRag(true);
        }
    }, [ragEligible, ragDocs]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const generateAIResponse = async (
        input: string,
        conversationHistory: { role: string; content: string }[]
    ): Promise<string> => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const res = await apiService.aiAgent.chat(input, conversationHistory, {
                    useRag,
                    responseMode,
                });
                const raw = res.data as { data?: AgentChatPayload } & Partial<AgentChatPayload>;
                const d = raw.data;
                const payload: AgentChatPayload = {
                    reply: d?.reply ?? raw.reply,
                    intent: d?.intent ?? raw.intent,
                    quiz: d?.quiz ?? raw.quiz,
                    recommendations: d?.recommendations ?? raw.recommendations,
                    ragCitations: d?.ragCitations,
                };
                if (d && 'ragAccessDenied' in d && (d as { ragAccessDenied?: boolean }).ragAccessDenied && useRag) {
                    payload.reply = `${payload.reply || ''}\n\n_Note: Document-based answers (RAG) are only available to students with an approved course enrollment._`;
                }
                return formatAgentReply(payload);
            } catch (err) {
                console.warn('[AIHelper] ai-agent chat failed, falling back to public /ai/chat', err);
            }
        }
        try {
            const res = await apiService.ai.chat(input);
            return res.data?.reply || 'Sorry, I could not generate a response right now. Please try again.';
        } catch (error) {
            console.error('AI chat error:', error);
            return 'Sorry, I could not reach the AI assistant right now. Please try again later.';
        }
    };

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            text: text.trim(),
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputValue('');
        if (textareaRef.current) {
            textareaRef.current.style.height = '44px';
        }
        setIsTyping(true);
        setShowQuickActions(false);

        const conversationHistory = messages
            .slice(-8)
            .map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));

        const replyText = await generateAIResponse(userMsg.text, conversationHistory);

        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: replyText,
            sender: 'ai',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
    };

    const handleSend = () => sendMessage(inputValue);
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isTyping && inputValue.trim()) void handleSend();
        }
    };

    const clearChat = () => {
        setMessages([{
            id: Date.now().toString(),
            text: 'Chat cleared! How can I help you? 😊',
            sender: 'ai',
            timestamp: new Date(),
        }]);
        setShowQuickActions(true);
    };

    const onPickFile = () => fileInputRef.current?.click();
    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        setUploadBusy(true);
        try {
            await apiService.rag.uploadDocument(f);
            setUseRag(true);
            await loadRagDocs();
        } catch (err) {
            console.error('[AIHelper] RAG upload failed', err);
        } finally {
            setUploadBusy(false);
        }
    };

    const removeDoc = async (id: string) => {
        try {
            await apiService.rag.deleteDocument(id);
            await loadRagDocs();
        } catch (err) {
            console.error('[AIHelper] RAG delete failed', err);
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            {/* Launcher — ChatGPT-style floating button */}
            <motion.button
                type="button"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/25 ring-1 ring-zinc-700/50 transition-all dark:bg-white dark:text-zinc-900 dark:ring-zinc-200/30 ${
                    isOpen ? 'pointer-events-none scale-0 opacity-0' : 'opacity-100'
                }`}
                aria-label="Open SESA assistant"
            >
                <Bot className="h-6 w-6" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 z-40 cursor-pointer bg-zinc-950/40 sm:bg-zinc-950/25"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            aria-hidden
                        />
                        <motion.div
                            role="dialog"
                            aria-label="SESA AI chat"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 12 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                            onClick={(e) => e.stopPropagation()}
                            className="fixed z-50 flex h-[100dvh] w-full max-h-[100dvh] flex-col overflow-hidden bg-white sm:bottom-5 sm:right-5 sm:top-auto sm:left-auto sm:h-[min(720px,calc(100dvh-2.5rem))] sm:max-h-[min(720px,calc(100dvh-2.5rem))] sm:w-full sm:max-w-[420px] sm:rounded-2xl dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-700/80 shadow-2xl"
                        >
                            {/* Header — minimal like ChatGPT */}
                            <header className="flex h-[52px] flex-shrink-0 items-center justify-between border-b border-zinc-200/90 bg-white px-2 dark:border-zinc-800 dark:bg-zinc-900">
                                <div className="flex min-w-0 items-center gap-2 pl-1">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800">
                                        <Bot className="h-4 w-4 text-zinc-700 dark:text-zinc-200" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                            SESA
                                        </h2>
                                        <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">Assistant</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5 pr-0.5">
                                    <button
                                        type="button"
                                        onClick={clearChat}
                                        className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                                        title="New chat"
                                    >
                                        <MessageSquarePlus className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                                        title="Close"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </header>

                            {/* RAG strip — compact toolbar */}
                            {ragEligible === null && (
                                <div className="border-b border-zinc-100 px-3 py-2 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
                                    Checking document features…
                                </div>
                            )}
                            {ragEligible === false && (
                                <div className="border-b border-amber-200/80 bg-amber-50/95 px-3 py-2 text-[11px] text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                                    Document chat needs an approved course enrollment. General assistant still works.
                                </div>
                            )}
                            {ragEligible === true && (
                                <div className="border-b border-zinc-100 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
                                        <label className="inline-flex cursor-pointer items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                                            <input
                                                type="checkbox"
                                                checked={useRag}
                                                onChange={(e) => setUseRag(e.target.checked)}
                                                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600"
                                            />
                                            <span>Documents</span>
                                        </label>
                                        <select
                                            value={responseMode}
                                            onChange={(e) => setResponseMode(e.target.value)}
                                            className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                                        >
                                            {RESPONSE_MODES.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="ml-auto flex items-center gap-1">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                className="hidden"
                                                accept=".txt,.md,.pdf,.docx,.html,.htm,.csv,.json,.yml,.yaml,.xml,.log"
                                                onChange={onFileChange}
                                            />
                                            <button
                                                type="button"
                                                onClick={onPickFile}
                                                disabled={uploadBusy}
                                                className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                                                title="Upload"
                                            >
                                                {uploadBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                    {ragDocs.length > 0 && (
                                        <ul className="mt-1.5 max-h-14 space-y-0.5 overflow-y-auto text-[10px] text-zinc-600 dark:text-zinc-400">
                                            {ragDocs.map((d) => (
                                                <li key={d.id} className="flex items-center justify-between gap-1">
                                                    <span className="flex min-w-0 items-center gap-1">
                                                        <FileText className="h-3 w-3 flex-shrink-0" />
                                                        <span className="truncate">{d.originalName}</span>
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => void removeDoc(d.id)}
                                                        className="flex-shrink-0 text-red-500 hover:underline"
                                                    >
                                                        remove
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            {/* Message list — full-width stream + side-aligned user (ChatGPT-like) */}
                            <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
                                {messages.length === 1 && !isTyping && (
                                    <div className="px-4 pt-6 text-center">
                                        <p className="text-lg font-medium text-zinc-800 dark:text-zinc-100">SESA</p>
                                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                            How can I help you today?
                                        </p>
                                    </div>
                                )}
                                <div className="space-y-0 pb-2">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={
                                                msg.sender === 'user'
                                                    ? 'border-b border-transparent'
                                                    : 'border-b border-zinc-100/80 dark:border-zinc-800/80'
                                            }
                                        >
                                            <div
                                                className={
                                                    msg.sender === 'user'
                                                        ? 'mx-auto flex w-full max-w-3xl justify-end gap-3 px-4 py-3'
                                                        : 'mx-auto flex w-full max-w-3xl gap-3 px-4 py-3'
                                                }
                                            >
                                                {msg.sender === 'ai' && (
                                                    <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm bg-zinc-200/90 dark:bg-zinc-800">
                                                        <Bot className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
                                                    </div>
                                                )}
                                                {msg.sender === 'user' && (
                                                    <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm bg-zinc-300/80 dark:bg-zinc-700">
                                                        <User className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-200" />
                                                    </div>
                                                )}
                                                <div
                                                    className={
                                                        msg.sender === 'user'
                                                            ? 'min-w-0 max-w-[min(100%,20rem)] rounded-2xl bg-zinc-200 px-3.5 py-2.5 text-[15px] leading-7 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                                                            : 'min-w-0 flex-1 text-[15px] leading-7 text-zinc-800 dark:text-zinc-200'
                                                    }
                                                >
                                                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                                    <p
                                                        className={
                                                            msg.sender === 'user'
                                                                ? 'mt-1 text-right text-[10px] text-zinc-500 dark:text-zinc-500'
                                                                : 'mt-1 text-[10px] text-zinc-400 dark:text-zinc-500'
                                                        }
                                                    >
                                                        {formatTime(msg.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {isTyping && (
                                        <div className="border-b border-zinc-100/80 dark:border-zinc-800/80">
                                            <div className="mx-auto flex max-w-3xl gap-3 px-4 py-3">
                                                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm bg-zinc-200/90 dark:bg-zinc-800">
                                                    <Bot className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
                                                </div>
                                                <div className="flex items-center gap-1.5 py-1">
                                                    {[0, 1, 2].map((i) => (
                                                        <motion.span
                                                            key={i}
                                                            className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500"
                                                            animate={{ opacity: [0.35, 1, 0.35] }}
                                                            transition={{ duration: 1.1, delay: i * 0.15, repeat: Infinity }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Suggested starters — chip row */}
                            <AnimatePresence>
                                {showQuickActions && messages.length <= 1 && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="flex-shrink-0 border-t border-zinc-200/80 bg-zinc-50/95 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/90"
                                    >
                                        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">Suggestions</p>
                                        <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                                            {QUICK_ACTIONS.map((action) => (
                                                <button
                                                    key={action.label}
                                                    type="button"
                                                    onClick={() => sendMessage(action.query)}
                                                    className="rounded-full border border-zinc-200/90 bg-white px-2.5 py-1 text-left text-[11px] text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                                                >
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Composer — ChatGPT-style pill */}
                            <div className="flex-shrink-0 border-t border-zinc-200/90 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                                <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-zinc-200/90 bg-zinc-50/90 px-2 py-1.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80">
                                    <textarea
                                        ref={textareaRef}
                                        rows={1}
                                        value={inputValue}
                                        onChange={(e) => {
                                            setInputValue(e.target.value);
                                            e.target.style.height = '44px';
                                            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                                        }}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Message SESA…"
                                        className="max-h-40 min-h-[44px] w-full flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] leading-5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSend}
                                        disabled={!inputValue.trim() || isTyping}
                                        className="mb-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white transition hover:bg-zinc-800 disabled:opacity-30 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                                        title="Send"
                                    >
                                        {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </button>
                                </div>
                                <p className="mt-1.5 text-center text-[10px] text-zinc-400 dark:text-zinc-500">Enter to send · Shift+Enter for new line</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIHelper;
