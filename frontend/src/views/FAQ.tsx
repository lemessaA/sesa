import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, CreditCard, User } from 'lucide-react';

const faqs = [
    {
        category: 'Getting Started',
        icon: User,
        questions: [
            {
                q: "How do I create an account?",
                a: "You can sign up as a student, instructor, or admin. Choose the appropriate portal on the home page and provide your details."
            },
            {
                q: "Can I be both a student and an instructor?",
                a: "Currently, accounts are role-specific. If you want to teach and learn, you'll need separate accounts for each role."
            }
        ]
    },
    {
        category: 'Courses & Learning',
        icon: BookOpen,
        questions: [
            {
                q: "Are the courses free?",
                a: "Some courses have free introductory parts. Full access usually requires admin approval and potentially a payment verification."
            },
            {
                q: "How do I watch the free parts?",
                a: "In the course catalog, click on any course. You can watch the 'Part 1' preview without enrolling."
            },
            {
                q: "How is my progress tracked?",
                a: "We track how many times you've watched a lesson and the total minutes spent learning to help you stay on track."
            }
        ]
    },
    {
        category: 'Payments & Access',
        icon: CreditCard,
        questions: [
            {
                q: "Why is my enrollment pending?",
                a: "All enrollments must be verified by an admin. Once you pay or qualify, an admin will approve your access, and you'll receive a notification."
            },
            {
                q: "What payment methods do you accept?",
                a: "We currently process payments manually. Please follow the instructions on the enrollment page to submit your payment details for verification."
            }
        ]
    }
];

const FAQ: React.FC = () => {
    const [openIndex, setOpenIndex] = React.useState<string | null>(null);

    return (
        <div className="min-h-screen bg-slate-950 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center justify-center p-3 bg-cyan-500/10 rounded-2xl mb-4 border border-cyan-500/20">
                        <HelpCircle className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl tracking-tight">
                        Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Questions</span>
                    </h1>
                    <p className="mt-4 text-xl text-slate-400">
                        Everything you need to know about SESA Academy.
                    </p>
                </motion.div>

                <div className="space-y-12">
                    {faqs.map((category, catIndex) => (
                        <div key={catIndex}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                                    <category.icon className="w-5 h-5 text-cyan-400" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-200 uppercase tracking-widest">{category.category}</h2>
                            </div>

                            <div className="grid gap-4">
                                {category.questions.map((faq, index) => {
                                    const id = `${catIndex}-${index}`;
                                    const isOpen = openIndex === id;

                                    return (
                                        <motion.div
                                            key={index}
                                            layout
                                            className={`rounded-2xl border transition-all duration-300 ${isOpen ? 'bg-slate-900 border-cyan-500/30' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                                                }`}
                                        >
                                            <button
                                                onClick={() => setOpenIndex(isOpen ? null : id)}
                                                className="w-full px-6 py-5 text-left flex justify-between items-center group"
                                            >
                                                <span className={`font-semibold text-lg transition-colors ${isOpen ? 'text-cyan-300' : 'text-slate-300 group-hover:text-white'}`}>
                                                    {faq.q}
                                                </span>
                                                {isOpen ? (
                                                    <ChevronUp className="w-5 h-5 text-cyan-400" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-slate-500 group-hover:text-slate-300" />
                                                )}
                                            </button>

                                            {isOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="px-6 pb-6"
                                                >
                                                    <p className="text-slate-400 leading-relaxed border-t border-slate-800 pt-4">
                                                        {faq.a}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="mt-20 p-8 rounded-3xl bg-gradient-to-br from-cyan-900/20 to-slate-900 border border-cyan-500/20 text-center"
                >
                    <h3 className="text-2xl font-bold text-white mb-2">Still have questions?</h3>
                    <p className="text-slate-400 mb-6">We're here to help you on your educational journey.</p>
                    <a
                        href="mailto:support@sesa.com"
                        className="inline-flex items-center px-6 py-3 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all transform hover:scale-105"
                    >
                        Contact Support
                    </a>
                </motion.div>
            </div>
        </div>
    );
};

export default FAQ;
