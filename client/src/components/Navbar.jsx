import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, PlusCircle, MessageCircle, User, LogOut, Bell, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const location = useLocation();

    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between glass-card px-8 py-4 shadow-2xl backdrop-blur-2xl bg-indigo-950/40 border-white/5">
                <Link to="/" className="flex items-center space-x-2 group">
                    <div className="w-10 h-10 bg-electric-blue rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Search className="text-white w-6 h-6" />
                    </div>
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-lavender">
                        LostLink
                    </span>
                </Link>

                {/* All nav items aligned to the right end */}
                <div className="hidden md:flex items-center space-x-3">
                    {user ? (
                        <>
                            {[
                                { name: 'Dashboard', path: '/dashboard' },
                                { name: 'Matches', path: '/matches' },
                                { name: 'Activity', path: '/activity' },
                            ].map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                                        location.pathname === item.path
                                            ? 'bg-electric-blue text-white shadow-lg shadow-blue-500/30'
                                            : 'text-lavender/60 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                            <button onClick={toggleTheme} className="p-2.5 hover:bg-white/10 text-lavender/60 hover:text-white rounded-full transition-all">
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <div className="w-px h-6 bg-white/10 mx-2"></div>
                            <Link to="/profile" className="flex items-center space-x-2 px-4 py-2.5 rounded-full hover:bg-white/10 transition-all text-xs font-black uppercase tracking-widest text-lavender/60 hover:text-white">
                                <User size={16} />
                                <span className="hidden sm:inline">{user.name}</span>
                            </Link>
                            <button onClick={() => { logout(); navigate('/'); }} className="p-2.5 hover:bg-red-500/20 text-lavender/40 hover:text-red-400 rounded-full transition-all">
                                <LogOut size={18} />
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest text-lavender/70 hover:text-white hover:bg-white/10 transition-all">
                                Home
                            </Link>
                            <a href="/#how-it-works" className="px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest text-lavender/70 hover:text-white hover:bg-white/10 transition-all">
                                Process
                            </a>
                            <button onClick={toggleTheme} className="p-2.5 hover:bg-white/10 text-lavender/60 hover:text-white rounded-full transition-all mx-1">
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <div className="w-px h-6 bg-white/10 mx-1"></div>
                            <Link to="/login" className="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest bg-electric-blue text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all">
                                Login
                            </Link>
                            <Link to="/signup" className="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest bg-electric-blue text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
