import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Header: React.FC = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="bg-gray-800 text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-xl font-bold flex items-center gap-2">
                    <span>tickets.modex</span>
                </Link>
                <nav>
                    <ul className="flex gap-4 items-center">
                        <li><Link to="/" className="hover:text-gray-300">Shows</Link></li>

                        {isAuthenticated ? (
                            <>
                                {user?.role === 'admin' && (
                                    <li><Link to="/admin" className="text-yellow-400 hover:text-yellow-300">Admin</Link></li>
                                )}
                                <li>
                                    <span className="text-gray-400 mr-2">Hi, {user?.email}</span>
                                    <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition">Logout</button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li><Link to="/login" className="hover:text-gray-300">Login</Link></li>
                                <li><Link to="/register" className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition">Register</Link></li>
                            </>
                        )}
                    </ul>
                </nav>
            </div>
        </header>
    );
};
