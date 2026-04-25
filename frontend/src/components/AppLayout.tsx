import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AppLayoutProps {
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const [isMobileOpen, setMobileOpen] = useState(false);
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-[#0a192f] text-slate-300 flex">
            <Sidebar isMobileOpen={isMobileOpen} setMobileOpen={setMobileOpen} />
            
            <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
                {/* Top Header */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl">
                    <div className="flex items-center gap-4 text-white hover:text-cyan-400 lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">
                        <button
                            type="button"
                            className="-m-2.5 p-2.5 rounded-lg"
                            onClick={() => setMobileOpen(true)}
                        >
                            <span className="sr-only">Open sidebar</span>
                            <Menu className="h-6 w-6" aria-hidden="true" />
                        </button>
                        <span className="font-bold text-lg tracking-tight">SESA<span className="text-cyan-500">.</span></span>
                    </div>

                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center justify-end">
                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            <button type="button" className="-m-2.5 p-2.5 text-slate-400 hover:text-white transition-colors">
                                <span className="sr-only">View notifications</span>
                                <Bell className="h-5 w-5" aria-hidden="true" />
                            </button>
                            
                            {/* Separator */}
                            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-800" aria-hidden="true" />
                            
                            <div className="hidden lg:flex lg:items-center">
                                <span className="text-sm font-semibold leading-6 text-white" aria-hidden="true">
                                    {user?.name}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden relative">
                    <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden>
                        <div className="absolute -left-20 top-[-120px] h-72 w-72 rounded-full bg-cyan-500/25 blur-[90px]" />
                        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-blue-500/20 blur-[120px]" />
                    </div>
                    <div className="relative z-10 w-full h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
