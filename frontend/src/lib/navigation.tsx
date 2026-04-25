'use client';
/**
 * Navigation compatibility layer.
 * Provides react-router-dom compatible APIs using Next.js navigation primitives.
 * This allows existing components to keep their original API calls unchanged.
 */
import React, { useEffect } from 'react';
import { useRouter as useNextRouter, useParams as useNextParams, useSearchParams as useNextSearchParams, usePathname as useNextPathname } from 'next/navigation';
import NextLink from 'next/link';

// â”€â”€â”€ useNavigate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Returns a function compatible with react-router-dom's useNavigate()
export function useNavigate() {
    const router = useNextRouter();
    return (to: string | number, options?: { replace?: boolean; state?: any }) => {
        if (typeof to === 'number') {
            if (to === -1) router.back();
            return;
        }
        if (options?.replace) {
            router.replace(to);
        } else {
            router.push(to);
        }
    };
}

// â”€â”€â”€ useParams â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
    return useNextParams() as T;
}

// â”€â”€â”€ useSearchParams â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function useSearchParams(): [URLSearchParams, (params: URLSearchParams) => void] {
    const searchParams = useNextSearchParams();
    const router = useNextRouter();
    const pathname = useNextPathname();

    const setSearchParams = (newParams: URLSearchParams) => {
        const search = newParams.toString();
        router.replace(search ? `${pathname}?${search}` : pathname);
    };

    // Return a tuple like react-router-dom
    return [searchParams as unknown as URLSearchParams, setSearchParams];
}

// â”€â”€â”€ useLocation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function useLocation() {
    const pathname = useNextPathname();
    const searchParams = useNextSearchParams();
    return {
        pathname: pathname || '/',
        search: searchParams?.toString() ? `?${searchParams.toString()}` : '',
        hash: typeof window !== 'undefined' ? window.location.hash : '',
    };
}

// â”€â”€â”€ Link â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Wraps Next.js Link to accept `to` prop (react-router-dom API)
interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
    to: string;
    children: React.ReactNode;
    replace?: boolean;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
    ({ to, children, replace, ...rest }, ref) => {
        return (
            <NextLink href={to} replace={replace} ref={ref} {...rest}>
                {children}
            </NextLink>
        );
    }
);
Link.displayName = 'Link';

// â”€â”€â”€ NavLink â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Wraps Next.js Link to replicate react-router-dom's NavLink (active class support)
interface NavLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'href'> {
    to: string;
    children: React.ReactNode | ((props: { isActive: boolean }) => React.ReactNode);
    className?: string | ((props: { isActive: boolean }) => string);
    end?: boolean;
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
    ({ to, children, className, end, ...rest }, ref) => {
        const pathname = useNextPathname() || '/';
        const isActive = end ? pathname === to : pathname.startsWith(to);

        const computedClassName = typeof className === 'function' ? className({ isActive }) : className;
        const renderedChildren = typeof children === 'function' ? children({ isActive }) : children;

        return (
            <NextLink href={to} ref={ref} className={computedClassName || undefined} {...rest}>
                {renderedChildren}
            </NextLink>
        );
    }
);
NavLink.displayName = 'NavLink';

// â”€â”€â”€ Navigate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Component that performs a redirect (equivalent to react-router-dom's <Navigate>)
interface NavigateProps {
    to: string;
    replace?: boolean;
}

export const Navigate: React.FC<NavigateProps> = ({ to, replace = false }) => {
    const router = useNextRouter();
    useEffect(() => {
        if (replace) {
            router.replace(to);
        } else {
            router.push(to);
        }
    }, [to, replace, router]);
    return null;
};

// â”€â”€â”€ BrowserRouter (no-op wrapper for compatibility) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// In Next.js, routing is handled by the framework. This is a pass-through wrapper.
export const BrowserRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <>{children}</>;
};

// Re-export for compatibility
export { useNextPathname as usePathname };
