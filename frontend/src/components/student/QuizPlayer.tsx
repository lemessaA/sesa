import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronRight, ChevronLeft, Send, Sparkles } from 'lucide-react';

interface Question {
    text: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

interface Quiz {
    _id: string;
    title: string;
    description?: string;
    questions: Question[];
    timeLimit: number;
}

interface QuizPlayerProps {
    quiz: Quiz;
    onComplete: (score: number) => void;
    onClose: () => void;
}

const QuizPlayer: React.FC<QuizPlayerProps> = ({ quiz, onComplete, onClose }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<number[]>(new Array(quiz.questions.length).fill(-1));
    const [timeLeft, setTimeLeft] = useState(quiz.timeLimit * 60);
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleAnswer = (optionIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = optionIndex;
        setAnswers(newAnswers);
    };

    const handleSubmit = () => {
        let correctCount = 0;
        answers.forEach((ans, idx) => {
            if (ans === quiz.questions[idx].correctAnswer) correctCount++;
        });
        const finalScore = Math.round((correctCount / quiz.questions.length) * 100);
        setScore(finalScore);
        setShowResults(true);
        onComplete(finalScore);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (showResults) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center bg-[#112240] rounded-2xl border border-slate-700 shadow-2xl"
            >
                <div className={`inline-flex p-4 rounded-full mb-6 ${score >= 70 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    <Sparkles className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h2>
                <p className="text-slate-300 mb-6">Your Score: <span className={`text-2xl font-black ${score >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>{score}%</span></p>
                
                <div className="space-y-4 max-h-60 overflow-y-auto mb-8 text-left">
                    {quiz.questions.map((q, i) => (
                        <div key={i} className={`p-4 rounded-xl border ${answers[i] === q.correctAnswer ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
                            <p className="text-sm font-medium text-white mb-1">{i + 1}. {q.text}</p>
                            <p className="text-xs text-slate-400">
                                {answers[i] === q.correctAnswer ? 'âœ… Correct' : `âŒ Incorrect (Correct: ${q.options[q.correctAnswer]})`}
                            </p>
                            {q.explanation && <p className="mt-2 text-xs text-blue-300 italic">Info: {q.explanation}</p>}
                        </div>
                    ))}
                </div>

                <button 
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                >
                    Return to Course
                </button>
            </motion.div>
        );
    }

    return (
        <div className="bg-[#112240] rounded-2xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col h-[600px]">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 bg-slate-900/40 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-white text-lg">{quiz.title}</h3>
                    <p className="text-xs text-slate-400">Question {currentQuestion + 1} of {quiz.questions.length}</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${timeLeft < 60 ? 'border-rose-500/50 bg-rose-500/10 text-rose-400 animate-pulse' : 'border-slate-600 bg-slate-800 text-slate-300'}`}>
                    <Clock className="h-4 w-4" />
                    <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-slate-800 w-full">
                <motion.div 
                    className="h-full bg-blue-500" 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
                />
            </div>

            {/* Question Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <h4 className="text-xl font-medium text-white leading-relaxed">
                            {quiz.questions[currentQuestion].text}
                        </h4>

                        <div className="grid gap-3">
                            {quiz.questions[currentQuestion].options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    className={`group flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                                        answers[currentQuestion] === idx 
                                        ? 'border-blue-500 bg-blue-500/10 text-white' 
                                        : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                                    }`}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                        answers[currentQuestion] === idx ? 'border-blue-400 bg-blue-400' : 'border-slate-600'
                                    }`}>
                                        {answers[currentQuestion] === idx && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                    </div>
                                    <span className="font-medium">{option}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700 bg-slate-900/40 flex items-center justify-between">
                <button
                    onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestion === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                >
                    <ChevronLeft className="h-4 w-4" /> Previous
                </button>

                {currentQuestion === quiz.questions.length - 1 ? (
                    <button
                        onClick={handleSubmit}
                        disabled={answers.includes(-1)}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                    >
                        Submit Quiz <Send className="h-4 w-4" />
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentQuestion(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all"
                    >
                        Next <ChevronRight className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizPlayer;
