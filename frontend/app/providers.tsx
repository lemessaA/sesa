'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import AppShell from './app-shell';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <React.StrictMode>
            <AuthProvider>
                <LanguageProvider>
                    <AppShell>{children}</AppShell>
                </LanguageProvider>
            </AuthProvider>
        </React.StrictMode>
    );
}
