'use client';

import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import GlobalPopup from '@/components/GlobalPopup';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import SafeEduConcierge from '@/components/SafeEduConcierge';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || '/';
    const { isAuthenticated, isLoading } = useAuth();

    const isAppContent = ['/dashboard', '/student', '/instructor', '/admin', '/payment', '/courses', '/live'].some(
        (path) => pathname.startsWith(path)
    );
    const showPublicChrome = isAuthenticated && !isAppContent;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300 flex flex-col">
            {showPublicChrome && <Navbar />}
            {isAuthenticated && <GlobalPopup />}
            <main className="flex-grow">{children}</main>
            {showPublicChrome && <Footer />}
            {showPublicChrome && <BackToTop />}
            {isAuthenticated && <SafeEduConcierge />}

            {/* Toast Notifications */}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
        </div>
    );
}
