import React from 'react';
import { motion } from 'framer-motion';
import { Quote, RefreshCcw } from 'lucide-react';

const quotes = [
    { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela", emoji: "🌍" },
    { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King", emoji: "📚" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", emoji: "🦁" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", emoji: "✨" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", emoji: "🌟" },
    { text: "Stay hungry, stay foolish.", author: "Steve Jobs", emoji: "🍎" },
    { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden", emoji: "🎯" },
    { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn", emoji: "🌉" },
    { text: "Ambition is the path to success. Persistence is the vehicle you arrive in.", author: "Bill Bradley", emoji: "🏎️" },
    { text: "Curiosity is the wick in the candle of learning.", author: "William Arthur Ward", emoji: "🕯️" },
    { text: "Real knowledge is to know the extent of one's ignorance.", author: "Confucius", emoji: "🧐" },
    { text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", author: "Dr. Seuss", emoji: "✈️" },
    { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein", emoji: "💡" },
    { text: "Your talent determines what you can do. Your motivation determines how much you are willing to do.", author: "Lou Holtz", emoji: "🏃‍♂️" },
    { text: "Your attitude, not your aptitude, will determine your altitude.", author: "Zig Ziglar", emoji: "🏔️" },
    { text: "Learning is never done without errors and defeat.", author: "Vladimir Lenin", emoji: "🚩" },
    { text: "Discipline is doing what needs to be done, even if you don't want to do it.", author: "Unknown", emoji: "🛡️" },
    { text: "Curiosity is more important than knowledge.", author: "Albert Einstein", emoji: "🧩" },
    { text: "The secret of success is to do the common thing uncommonly well.", author: "John D. Rockefeller", emoji: "💎" },
    { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown", emoji: "💪" },
    { text: "Small progress is still progress.", author: "Unknown", emoji: "🐢" },
    { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt", emoji: "🌅" },
    { text: "Dream big and dare to fail.", author: "Norman Vaughan", emoji: "🚀" },
    { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan", emoji: "⚡" },
    { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch", emoji: "🔥" }
];

const QuoteSection: React.FC = () => {
    const [quoteIndex, setQuoteIndex] = React.useState(0);

    const nextQuote = () => {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * quotes.length);
        } while (newIndex === quoteIndex);
        setQuoteIndex(newIndex);
    };

    React.useEffect(() => {
        const interval = setInterval(() => {
            nextQuote();
        }, 8000);
        return () => clearInterval(interval);
    }, [quoteIndex]);

    const currentQuote = quotes[quoteIndex];

    return (
        <section className="py-12 md:py-20 bg-primary/5 dark:bg-dark-card/50 relative overflow-hidden">
            <div className="container mx-auto px-4 text-center">
                <motion.div
                    key={quoteIndex}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-3xl mx-auto space-y-4 md:space-y-6"
                >
                    <Quote className="w-10 h-10 md:w-12 md:h-12 text-primary mx-auto opacity-20" />
                    <h2 className="text-2xl md:text-3xl lg:text-5xl font-extrabold italic text-dark-bg dark:text-light leading-tight px-4">
                        "{currentQuote.text}"
                    </h2>
                    <div className="flex items-center justify-center space-x-2 md:space-x-4">
                        <span className="h-px w-4 md:w-8 bg-primary/30" />
                        <p className="text-base md:text-lg lg:text-xl font-medium text-primary">
                            {currentQuote.author} {currentQuote.emoji}
                        </p>
                        <span className="h-px w-4 md:w-8 bg-primary/30" />
                    </div>
                </motion.div>

                <motion.button
                    whileHover={{ rotate: 180 }}
                    onClick={nextQuote}
                    className="mt-8 md:mt-12 p-3 md:p-4 bg-white dark:bg-gray-800 rounded-full shadow-lg text-primary hover:text-secondary transition-all"
                >
                    <RefreshCcw className="w-5 h-5 md:w-6 md:h-6" />
                </motion.button>
            </div>

            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-10 left-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
                <div className="absolute bottom-10 right-10 w-32 h-32 bg-accent/5 rounded-full blur-2xl" />
            </div>
        </section>
    );
};

export default QuoteSection;
