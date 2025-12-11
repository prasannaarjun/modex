import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const Auth = ({ mode }: { mode: 'login' | 'register' }) => {
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'user' | 'admin'>('user');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === 'login') {
                await login({ email, password });
                toast.success('Welcome back!');
                navigate('/');
            } else {
                await register({ email, password, role });
                toast.success('Registration successful! Please login.');
                navigate('/login');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Authentication failed';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                {mode === 'login' ? 'Login to Modex' : 'Create an Account'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        placeholder="you@example.com"
                    />
                </div>

                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        placeholder="******"
                    />
                </div>

                {mode === 'register' && (
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="admin-role"
                            checked={role === 'admin'}
                            onChange={e => setRole(e.target.checked ? 'admin' : 'user')}
                            className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="admin-role" className="text-sm text-gray-600">Register as Admin (Demo only)</label>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-50 font-semibold"
                >
                    {loading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Register')}
                </button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-600">
                {mode === 'login' ? (
                    <>Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Register here</Link></>
                ) : (
                    <>Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login here</Link></>
                )}
            </p>
        </div>
    );
};
