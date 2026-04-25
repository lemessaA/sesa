import type { Metadata } from 'next';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'SESA TECHNOLOGY â€” Safe Educational & Skill Academy',
    description: 'SESA TECHNOLOGY â€” Safe Educational & Skill Academy. Technology, ICT, software, and learning for students and educators.',
    icons: {
        icon: '/sesa-technology-logo.png',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
            </head>
            <body className="bg-gray-50 dark:bg-dark-bg selection:bg-primary selection:text-white">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}

// Import Providers as a client component
import Providers from './providers';
