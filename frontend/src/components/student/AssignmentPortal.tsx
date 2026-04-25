import React, { useState } from 'react';
import { FileUp, Link as LinkIcon, Send, Clock } from 'lucide-react';

interface Assignment {
    _id: string;
    title: string;
    description: string;
    resourceUrls?: string[];
    deadline?: string;
    maxScore: number;
}

interface AssignmentPortalProps {
    assignment: Assignment;
    onSubmit: (data: { textResponse?: string; file?: File }) => void;
    isSubmitting: boolean;
}

const AssignmentPortal: React.FC<AssignmentPortalProps> = ({ assignment, onSubmit, isSubmitting }) => {
    const [textResponse, setTextResponse] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ textResponse, file: file || undefined });
    };

    return (
        <div className="bg-[#112240] rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-700 bg-slate-900/40">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">{assignment.title}</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">{assignment.description}</p>
                    </div>
                    <div className="text-right">
                        <span className="block text-xs font-bold text-blue-400 uppercase tracking-widest">Max Score</span>
                        <span className="text-2xl font-black text-white">{assignment.maxScore}</span>
                    </div>
                </div>
                
                {assignment.deadline && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-amber-400 font-medium bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/20 w-fit">
                        <Clock className="h-3.5 w-3.5" />
                        Due: {new Date(assignment.deadline).toLocaleString()}
                    </div>
                )}
            </div>

            <div className="p-6 space-y-6">
                {/* Resources */}
                {assignment.resourceUrls && assignment.resourceUrls.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" /> Helpful Resources
                        </h4>
                        <div className="grid gap-2">
                            {assignment.resourceUrls.map((url, i) => (
                                <a 
                                    key={i} 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 text-sm text-blue-400 hover:bg-slate-700 transition-all truncate"
                                >
                                    {url}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Submission Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-slate-200">Your Response</h4>
                        <textarea
                            value={textResponse}
                            onChange={(e) => setTextResponse(e.target.value)}
                            placeholder="Type your answer here..."
                            className="w-full h-40 p-4 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-slate-200">Attachment (Project File)</h4>
                        <div className="relative group">
                            <input
                                type="file"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 bg-slate-900/30 group-hover:border-slate-500'}`}>
                                <FileUp className={`h-8 w-8 mb-3 ${file ? 'text-emerald-400' : 'text-slate-500'}`} />
                                <span className={`text-sm font-medium ${file ? 'text-emerald-200' : 'text-slate-400'}`}>
                                    {file ? file.name : 'Drag and drop or click to upload project file'}
                                </span>
                                <span className="text-[10px] text-slate-500 mt-1">PDF, ZIP, or Documentation (Max 20MB)</span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || (!textResponse && !file)}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest text-sm hover:shadow-xl hover:shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? (
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send className="h-5 w-5" /> Submit Assignment
                            </>
                        )}
                    </button>
                    <p className="text-[10px] text-center text-slate-500">
                        * Once submitted, your work will be reviewed and graded by our teaching assistants.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default AssignmentPortal;
