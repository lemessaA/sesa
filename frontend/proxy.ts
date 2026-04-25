import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Redirect /login routes to /auth (same as original React Router)
    if (pathname === '/login') {
        return NextResponse.redirect(new URL('/auth', request.url));
    }
    if (pathname === '/login/student') {
        return NextResponse.redirect(new URL('/auth?role=student', request.url));
    }
    if (pathname === '/login/instructor') {
        return NextResponse.redirect(new URL('/auth?role=instructor', request.url));
    }
    if (pathname === '/login/admin') {
        return NextResponse.redirect(new URL('/auth?role=admin', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/login', '/login/:path*'],
};
