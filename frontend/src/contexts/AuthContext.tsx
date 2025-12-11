import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import type { LoginRequest, LoginResponse, RegisterRequest } from '../api/types';

interface User {
    email?: string;
    role?: 'admin' | 'user';
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        // On mount, check if we have a token and maybe validate it?
        // Since we don't have a /me endpoint that is explicitly documented to return user details 
        // (Wait, user instructions said "Use token payload or /api/auth/me if available"),
        // check spec: No /api/auth/me.
        // So we rely on stored user info or just the token.
        // If we only store token, we might not know the role on refresh unless we decode JWT or store user too.
        // I will store user in localStorage too for simplicity, or decode JWT.
        // Spec example token is `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`.
        // I'll try to persist user object as well.
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, [token]);

    const login = async (data: LoginRequest) => {
        const res = await api.post<LoginResponse>('/api/auth/login', data);
        const { token: newToken, user: newUser } = res.data;

        if (newToken) {
            setToken(newToken);
            localStorage.setItem('token', newToken);
        }

        if (newUser) {
            setUser(newUser);
            localStorage.setItem('user', JSON.stringify(newUser));
        }
    };

    const register = async (data: RegisterRequest) => {
        await api.post('/api/auth/register', data);
        // Register doesn't auto login in this spec (returns 201 User created).
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
