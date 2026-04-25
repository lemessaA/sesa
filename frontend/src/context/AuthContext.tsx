import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        token: null,
    });
    const [isLoading, setIsLoading] = useState(true);

    // Load auth state from localStorage on mount
    useEffect(() => {
        const loadAuthState = () => {
            try {
                const token = localStorage.getItem('token');
                const userStr = localStorage.getItem('user');
                
                if (token && userStr) {
                    const user = JSON.parse(userStr);
                    setAuthState({ user, token });
                }
            } catch (err) {
                console.error('Error loading auth state:', err);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } finally {
                setIsLoading(false);
            }
        };

        loadAuthState();
    }, []);

    // Listen for 401 events from the API interceptor (session expired / revoked)
    // This avoids a hard page reload â€” state clears and React Router handles redirect.
    useEffect(() => {
        const handleUnauthorized = () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setAuthState({ user: null, token: null });
        };
        window.addEventListener('sesa:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('sesa:unauthorized', handleUnauthorized);
    }, []);

    const login = (token: string, user: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setAuthState({ user, token });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthState({ user: null, token: null });
    };

    const isAuthenticated = !!authState.token && !!authState.user;

    return (
        <AuthContext.Provider value={{ ...authState, login, logout, isAuthenticated, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
