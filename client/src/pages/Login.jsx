import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(formData.email, formData.password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card max-w-2xl w-full p-6 relative overflow-hidden"
            >
                <div className="relative z-10">
                    <div className="text-center mb-4">
                        <div className="w-12 h-12 bg-electric-blue/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <ShieldCheck size={24} className="text-electric-blue" />
                        </div>
                        <h2 className="text-2xl font-black mb-1 italic tracking-tight uppercase">Welcome Back</h2>
                        <p className="text-lavender/40 text-sm font-medium tracking-wide">Reconnect with your lost items</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-lavender/30 group-focus-within:text-electric-blue transition-colors" size={18} />
                                <input 
                                    type="email" 
                                    className="input-field pl-12" 
                                    placeholder="Campus Email" 
                                    required 
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})} 
                                />
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-lavender/30 group-focus-within:text-electric-blue transition-colors" size={18} />
                                <input 
                                    type="password" 
                                    className="input-field pl-12" 
                                    placeholder="Password" 
                                    required 
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})} 
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-bold">
                                {error}
                            </motion.div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full btn-primary py-4 flex items-center justify-center space-x-2 font-black uppercase tracking-[0.2em] group"
                        >
                            <span>{loading ? 'Verifying...' : 'Authenticate'}</span>
                            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div className="mt-4 pt-4 border-t border-white/5 text-center">
                        <p className="text-lavender/40 text-sm">
                            Don't have an account? <Link to="/signup" className="text-electric-blue hover:text-white transition-colors font-black uppercase tracking-widest ml-1 text-xs">Sign up now</Link>
                        </p>
                    </div>
                </div>
                
                {/* Decorative glow */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-electric-blue/5 blur-[100px] rounded-full"></div>
            </motion.div>
        </div>
    );
};

export default Login;
