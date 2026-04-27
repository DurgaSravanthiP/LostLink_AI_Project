import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, CreditCard, GraduationCap, Phone, Shield, ArrowRight } from 'lucide-react';

const Signup = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', studentId: '', department: '', year: '', phone: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const allowedDomains = ['srmap.edu.in', 'srmap.ac.in', 'university.edu'];
    const isCampusEmail = (email) => {
        const domain = email.split('@')[1]?.toLowerCase();
        return allowedDomains.some(d => domain === d || domain?.endsWith(`.${d}`));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isCampusEmail(formData.email || '')) {
            setError('Please use an approved campus email address.');
            return;
        }

        setLoading(true);
        try {
            await signup(formData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card max-w-3xl w-full p-6 relative overflow-hidden"
            >
                <div className="relative z-10">
                    <div className="text-center mb-4">
                        <div className="w-12 h-12 bg-electric-blue/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <UserPlus size={24} className="text-electric-blue" />
                        </div>
                        <h2 className="text-2xl font-black mb-1">Create Account</h2>
                        <p className="text-lavender/40 text-sm">Join the campus lost and found community</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="relative group">
                                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-lavender/30 group-focus-within:text-electric-blue transition-colors" size={18} />
                                <input className="input-field pl-12" placeholder="Full Name" required onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-lavender/30 group-focus-within:text-electric-blue transition-colors" size={18} />
                                <input type="email" className="input-field pl-12" placeholder="Campus Email" required onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="relative group">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-lavender/30 group-focus-within:text-electric-blue transition-colors" size={18} />
                                <input className="input-field pl-12" placeholder="Student ID" required onChange={e => setFormData({...formData, studentId: e.target.value})} />
                            </div>
                            <div className="relative group">
                                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-lavender/30 group-focus-within:text-electric-blue transition-colors" size={18} />
                                <input className="input-field pl-12" placeholder="Department" onChange={e => setFormData({...formData, department: e.target.value})} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="relative group">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-lavender/30 group-focus-within:text-electric-blue transition-colors" size={18} />
                                <input className="input-field pl-12" placeholder="Year (e.g., 3rd)" onChange={e => setFormData({...formData, year: e.target.value})} />
                            </div>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-lavender/30 group-focus-within:text-electric-blue transition-colors" size={18} />
                                <input className="input-field pl-12" placeholder="Phone Number" onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </div>
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-lavender/30 group-focus-within:text-electric-blue transition-colors" size={18} />
                            <input type="password" className="input-field pl-12" placeholder="Create Password" required onChange={e => setFormData({...formData, password: e.target.value})} />
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center">
                                {error}
                            </motion.div>
                        )}

                        <button type="submit" disabled={loading} className="w-full btn-primary py-4 flex items-center justify-center space-x-2 font-bold group">
                            <span>{loading ? 'Joining Cluster...' : 'Join LostLink'}</span>
                            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <p className="mt-4 text-center text-lavender/40 text-sm">
                        Already have an account? <Link to="/login" className="text-electric-blue hover:text-white transition-colors font-bold ml-1">Log in</Link>
                    </p>
                </div>
                
                {/* Decorative glow */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-electric-blue/10 blur-[100px] rounded-full"></div>
            </motion.div>
        </div>
    );
};

export default Signup;
