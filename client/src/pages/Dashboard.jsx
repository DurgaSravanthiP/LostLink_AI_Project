import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PlusCircle, Search, HelpCircle, Bell, ArrowRight, MapPin, Calendar,
    Tag, X, Eye, Hand, CheckCircle2, Clock, Zap, Star, Package,
    TrendingUp, Activity, Sparkles, AlertCircle, Shield
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, subtitle, color = 'text-electric-blue', count, linkTo, linkLabel }) => (
    <div className="flex items-end justify-between mb-6">
        <div>
            <div className={`flex items-center gap-2 mb-1 ${color}`}>
                <Icon size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{subtitle}</span>
                {count !== undefined && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-white/10`}>{count}</span>
                )}
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">{title}</h2>
        </div>
        {linkTo && (
            <Link to={linkTo} className="text-[10px] font-black uppercase tracking-widest text-lavender/40 hover:text-electric-blue transition-colors flex items-center gap-1">
                {linkLabel} <ArrowRight size={12} />
            </Link>
        )}
    </div>
);

// ─── My Item Card (Lost/Found) ────────────────────────────────────────────────
const MyItemCard = ({ item }) => {
    const statusStyles = {
        active: 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400',
        matched: 'bg-green-400/10 border-green-400/20 text-green-400',
        recovered: 'bg-blue-400/10 border-blue-400/20 text-blue-400',
        returned: 'bg-purple-400/10 border-purple-400/20 text-purple-400',
    };
    const statusIcons = { active: Clock, matched: CheckCircle2, recovered: CheckCircle2, returned: CheckCircle2 };
    const StatusIcon = statusIcons[item.status] || Clock;
    const categoryEmoji = { 'Electronics': '🎧', 'Wallets & Purses': '👜', 'ID Cards': '🪪', 'Keys': '🔑', 'Books & Stationery': '📚', 'Clothing': '👕', 'Water Bottles': '💧', 'Others': '📦' };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="glass-card overflow-hidden group relative"
        >
            <div className={`relative h-36 flex items-center justify-center overflow-hidden ${item.type === 'lost' ? 'bg-red-500/5' : 'bg-green-500/5'}`}>
                {item.images?.[0]
                    ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    : <span className="text-5xl">{categoryEmoji[item.category] || '📦'}</span>}
                <div className="absolute top-2 right-2">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        item.status === 'matched' ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400' : 
                        statusStyles[item.status] || statusStyles.active
                    }`}>
                        <StatusIcon size={9} />{item.status === 'matched' ? 'Pending Verify' : item.status}
                    </span>
                </div>
                {item.status === 'matched' && (
                    <div className="absolute inset-0 bg-yellow-400/5 flex items-center justify-center">
                        <div className="bg-yellow-400/20 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2 border border-yellow-400/30">
                            <Zap size={12} className="text-yellow-400" />
                            <span className="text-[10px] font-black text-yellow-300">AI MATCH FOUND</span>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4">
                <h4 className="font-black text-sm mb-1 truncate">{item.title}</h4>
                <div className="flex items-center gap-1 text-[10px] text-lavender/40 mb-3">
                    <MapPin size={10} className="text-electric-blue" />
                    <span className="truncate">{item.location}</span>
                </div>
                <Link
                    to={item.type === 'lost' ? '/matches' : '/my-items'}
                    state={item.type === 'lost' ? { newItem: item, matches: [], mode: 'loser' } : undefined}
                    className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all ${
                        item.type === 'lost'
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                            : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20'
                    }`}
                >
                    {item.type === 'lost' ? <><Search size={10} />View Matches</> : <><Eye size={10} />View Details</>}
                </Link>
            </div>
        </motion.div>
    );
};

// ─── Others Lost Item Card ────────────────────────────────────────────────────
const OthersItemCard = ({ item, onIFoundThis }) => {
    const categoryEmoji = { 'Electronics': '🎧', 'Wallets & Purses': '👜', 'ID Cards': '🪪', 'Keys': '🔑', 'Books & Stationery': '📚', 'Clothing': '👕', 'Water Bottles': '💧', 'Others': '📦' };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="glass-card overflow-hidden group"
        >
            <div className="relative h-36 flex items-center justify-center overflow-hidden bg-white/[0.02]">
                {item.images?.[0]
                    ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    : <span className="text-5xl">{categoryEmoji[item.category] || '📦'}</span>}
                <div className="absolute top-2 left-2 bg-red-500/20 text-red-300 border border-red-500/20 text-[9px] font-black px-2 py-0.5 rounded-full">
                    🔴 Lost
                </div>
            </div>
            <div className="p-4">
                <h4 className="font-black text-sm mb-1 truncate">{item.title}</h4>
                <p className="text-lavender/40 text-[10px] mb-1 truncate">{item.description}</p>
                <div className="flex items-center gap-1 text-[10px] text-lavender/40 mb-3">
                    <MapPin size={10} className="text-electric-blue" />
                    <span className="truncate">{item.location}</span>
                    <span className="text-lavender/20 mx-1">·</span>
                    <span>{item.user?.name}</span>
                </div>
                <button
                    onClick={() => onIFoundThis(item)}
                    className="w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 bg-electric-blue/10 hover:bg-electric-blue/20 text-electric-blue border border-electric-blue/20 transition-all group/btn"
                >
                    <Hand size={10} />
                    I Found This!
                    <ArrowRight size={10} className="group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
            </div>
        </motion.div>
    );
};

// ─── AI Match Card ────────────────────────────────────────────────────────────
const AIMatchCard = ({ notification }) => {
    const { item, totalMatches, topMatches } = notification;
    const topMatch = topMatches?.[0];
    const score = topMatch?.score || 0;
    const isHighMatch = score >= 60;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -2 }}
            className={`glass-card p-5 relative overflow-hidden border ${isHighMatch ? 'border-green-500/30' : 'border-yellow-500/20'}`}
        >
            {/* Glow bg */}
            <div className={`absolute inset-0 opacity-5 ${isHighMatch ? 'bg-green-500' : 'bg-yellow-400'}`}></div>

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isHighMatch ? 'bg-green-500/20' : 'bg-yellow-400/10'}`}>
                            <Sparkles size={14} className={isHighMatch ? 'text-green-400' : 'text-yellow-400'} />
                        </div>
                        <div>
                            <div className={`text-[9px] font-black uppercase tracking-widest ${isHighMatch ? 'text-green-400' : 'text-yellow-400'}`}>
                                Potential AI Match
                            </div>
                            <div className="text-xs font-bold text-white truncate max-w-[140px]">{item.title}</div>
                            <div className="text-[10px] text-lavender/40 mt-1">
                                AI has found a similar report
                            </div>
                        </div>
                    </div>
                    {/* Match score ring */}
                    <div className="text-center">
                        <div className={`text-xl font-black ${isHighMatch ? 'text-green-400' : 'text-yellow-400'}`}>{score}%</div>
                        <div className="text-[9px] text-lavender/40">match</div>
                    </div>
                </div>

                {/* Score bar */}
                <div className="h-1 bg-white/5 rounded-full mb-3 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${isHighMatch ? 'bg-green-500' : 'bg-yellow-400'}`}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-lavender/40">{totalMatches} potential match{totalMatches > 1 ? 'es' : ''}</span>
                    <Link
                        to="/matches"
                        state={{ item }}
                        className="text-[10px] font-black px-4 py-2 rounded-lg bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/20 transition-all flex items-center gap-1"
                    >
                        Verify Details <ArrowRight size={10} />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

// ─── I Found This Modal ───────────────────────────────────────────────────────
const IFoundThisModal = ({ lostItem, isOpen, onClose }) => {
    const navigate = useNavigate();
    const [myFoundItems, setMyFoundItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(null);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setSuccess(false); setError('');
        const fetch = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/items/my-found-items', { headers: { 'x-auth-token': token } });
                setMyFoundItems(res.data);
            } catch { setMyFoundItems([]); }
            finally { setLoading(false); }
        };
        fetch();
    }, [isOpen]);

    const handleSelect = async (foundItem) => {
        setSubmitting(foundItem._id); setError('');
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/items/${lostItem._id}/claim`, { claimerItemId: foundItem._id }, { headers: { 'x-auth-token': token } });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit.');
        } finally { setSubmitting(null); }
    };

    if (!isOpen || !lostItem) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} className="glass-card w-full max-w-lg max-h-[85vh] overflow-y-auto">
                <div className="p-6 border-b border-white/5 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight mb-1">🎉 I Found This!</h2>
                        <p className="text-lavender/40 text-xs">Notify owner of "<span className="text-white font-bold">{lostItem.title}</span>"</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"><X size={18} /></button>
                </div>
                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32} className="text-green-400" /></div>
                            <h3 className="text-xl font-black mb-2">Owner Notified!</h3>
                            <p className="text-lavender/50 text-sm mb-6">They'll see your found report and verify ownership.</p>
                            <button onClick={onClose} className="btn-primary px-8 py-3 text-xs font-black uppercase tracking-widest">Done</button>
                        </div>
                    ) : loading ? (
                        <div className="text-center py-12 text-lavender/40 text-sm">Loading your found reports...</div>
                    ) : myFoundItems.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle size={32} className="text-yellow-400" /></div>
                            <h3 className="text-lg font-black mb-2">No Found Reports Yet</h3>
                            <p className="text-lavender/50 text-sm mb-6">First report the item you found so the owner can verify ownership.</p>
                            <button onClick={() => { onClose(); navigate('/report-found'); }} className="btn-primary px-8 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 mx-auto">
                                Report Found Item <ArrowRight size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-xs text-lavender/50 leading-relaxed mb-4">Select which found report matches this lost item.</p>
                            {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-center font-bold">{error}</p>}
                            {myFoundItems.map(fi => (
                                <motion.button key={fi._id} whileHover={{ scale: 1.01 }} disabled={!!submitting} onClick={() => handleSelect(fi)}
                                    className="w-full text-left glass-card p-4 flex items-center gap-4 hover:bg-white/[0.04] transition-all border border-white/5 hover:border-electric-blue/30 disabled:opacity-50">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-green-500/10 text-xl">
                                        {fi.images?.[0] ? <img src={fi.images[0]} className="w-full h-full object-cover rounded-xl" alt="" /> : '📦'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm truncate">{fi.title}</h4>
                                        <p className="text-[10px] text-lavender/40 truncate">{fi.location}</p>
                                    </div>
                                    <div className="shrink-0">
                                        {submitting === fi._id ? <span className="text-[10px] text-electric-blue animate-pulse">Sending...</span> : <ArrowRight size={16} className="text-electric-blue" />}
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ icon: Icon, message, linkTo, linkLabel }) => (
    <div className="glass-card p-8 text-center border-dashed border-white/10 col-span-full">
        <Icon size={28} className="mx-auto mb-3 text-lavender/20" />
        <p className="text-lavender/40 text-xs mb-4">{message}</p>
        {linkTo && <Link to={linkTo} className="btn-primary px-6 py-2 text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1">{linkLabel} <ArrowRight size={10} /></Link>}
    </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [myLostItems, setMyLostItems] = useState([]);
    const [myFoundItems, setMyFoundItems] = useState([]);
    const [othersLostItems, setOthersLostItems] = useState([]);
    const [aiMatches, setAiMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [foundThisItem, setFoundThisItem] = useState(null);

    useEffect(() => {
        const fetchAll = async () => {
            if (!user) return;
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            try {
                const [myRes, publicRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/items/my-items', config),
                    axios.get('http://localhost:5000/api/items/public-lost', config),
                ]);
                const all = myRes.data;
                setMyLostItems(all.filter(i => i.type === 'lost'));
                setMyFoundItems(all.filter(i => i.type === 'found'));
                
                // ⭐ NEW: Extract AI matched items
                const matchedItems = all.filter(i => i.status === 'matched' && i.matchId);
                setAiMatches(matchedItems);
                
                // Filter out user's own items from public feed (Help Others)
                setOthersLostItems(publicRes.data.filter(i => {
                    const reporterId = i.user?._id || i.user;
                    return reporterId !== user.id && reporterId !== user._id;
                }));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [user]);

    if (loading) {
        return (
            <div className="pt-24 px-6 max-w-7xl mx-auto pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {[1,2,3,4].map(i => <div key={i} className="glass-card h-28 animate-pulse" />)}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="glass-card h-52 animate-pulse" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="pt-24 px-6 max-w-7xl mx-auto pb-20">
            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <header className="mb-10 relative overflow-hidden p-8 rounded-[2rem] bg-gradient-to-br from-indigo-900/40 to-indigo-800/10 border border-white/5">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl font-black mb-3 tracking-tight">
                            Welcome back, <span className="text-electric-blue">{user?.name?.split(' ')[0] || 'Explorer'}</span>! 👋
                        </motion.h1>
                        <p className="text-lavender/60 max-w-md leading-relaxed text-sm">
                            Your campus lost & found hub. Helping SRM reunite items every day.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="glass-card p-5 text-center min-w-[90px]">
                            <div className="text-2xl font-black text-red-400">{myLostItems.length}</div>
                            <div className="text-[9px] uppercase tracking-widest text-lavender/40 font-bold">Lost</div>
                        </div>
                        <div className="glass-card p-5 text-center min-w-[90px]">
                            <div className="text-2xl font-black text-green-400">{myFoundItems.length}</div>
                            <div className="text-[9px] uppercase tracking-widest text-lavender/40 font-bold">Found</div>
                        </div>
                        <div className="glass-card p-5 text-center min-w-[90px]">
                            <div className="text-2xl font-black text-electric-blue">{user?.reputationScore || 0}</div>
                            <div className="text-[9px] uppercase tracking-widest text-lavender/40 font-bold">Rep</div>
                        </div>
                        <div className="glass-card p-5 text-center min-w-[90px]">
                            <div className="text-2xl font-black text-yellow-400">{aiMatches.length}</div>
                            <div className="text-[9px] uppercase tracking-widest text-lavender/40 font-bold">Matches</div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-electric-blue/10 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none"></div>
            </header>

            {/* ── Quick Actions (Compact) ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {[
                    { icon: Search, label: 'Lost?', to: '/report-lost', color: 'from-red-500/10 to-transparent border-red-500/20', iconColor: 'text-red-400 bg-red-500/10' },
                    { icon: PlusCircle, label: 'Found?', to: '/report-found', color: 'from-green-500/10 to-transparent border-green-500/20', iconColor: 'text-green-400 bg-green-500/10' },
                    { icon: Activity, label: 'Feed', to: '/activity', color: 'from-electric-blue/10 to-transparent border-electric-blue/20', iconColor: 'text-electric-blue bg-electric-blue/10' },
                    { icon: HelpCircle, label: 'Reports', to: '/my-items', color: 'from-lavender/5 to-transparent border-white/5', iconColor: 'text-lavender bg-white/5' },
                ].map(({ icon: Icon, label, to, color, iconColor }) => (
                    <Link key={to} to={to} className={`glass-card p-3 bg-gradient-to-br ${color} hover:scale-[1.02] active:scale-95 transition-all group flex items-center gap-3`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor} group-hover:scale-110 transition-transform shrink-0`}>
                            <Icon size={16} />
                        </div>
                        <div className="font-black text-[10px] uppercase tracking-widest">{label}</div>
                    </Link>
                ))}
            </div>

            {/* ── Tab System ─────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2 mb-10 p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-fit">
                {[
                    { id: 'all', label: 'Overview', icon: Zap },
                    { id: 'lost', label: 'My Lost Items', icon: Search, count: myLostItems.length },
                    { id: 'found', label: 'My Found Items', icon: PlusCircle, count: myFoundItems.length },
                    { id: 'community', label: 'Activity Feed', icon: Activity, count: othersLostItems.length },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                            activeTab === tab.id 
                            ? 'bg-electric-blue text-white shadow-lg shadow-blue-500/20' 
                            : 'text-lavender/40 hover:text-lavender hover:bg-white/5'
                        }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${activeTab === tab.id ? 'bg-white/20' : 'bg-white/5'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── MAIN CONTENT (Filtered) ───────────────────────────────────── */}
            <div className="space-y-12">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-12"
                    >
                        {/* Section 4: AI Matches (Always show if relevant, or show in 'all') */}
                        {(activeTab === 'all' || activeTab === 'lost') && aiMatches.length > 0 && (
                            <section className="max-w-4xl">
                                <SectionHeader
                                    icon={Sparkles}
                                    title="AI Matches Found"
                                    subtitle="Smart Matching"
                                    color="text-yellow-400"
                                    count={aiMatches.length}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {aiMatches.map((item, i) => (
                                        <AIMatchCard
                                            key={i}
                                            notification={{
                                                item: item,
                                                totalMatches: 1,
                                                topMatches: [{ score: item.matchScore }]
                                            }}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Section 1: My Lost Items */}
                        {(activeTab === 'all' || activeTab === 'lost') && (
                            <section>
                                <SectionHeader
                                    icon={Search}
                                    title="My Lost Items"
                                    subtitle="Your Reports"
                                    color="text-red-400"
                                    count={myLostItems.length}
                                    linkTo="/my-items"
                                    linkLabel="View All"
                                />
                                {myLostItems.length === 0 ? (
                                    <EmptyState icon={Search} message="You haven't reported any lost items yet." linkTo="/report-lost" linkLabel="Report Lost Item" />
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                        {myLostItems.map(item => <MyItemCard key={item._id} item={item} />)}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Section 2: My Found Items */}
                        {(activeTab === 'all' || activeTab === 'found') && (
                            <section>
                                <SectionHeader
                                    icon={PlusCircle}
                                    title="My Found Items"
                                    subtitle="Items I Found"
                                    color="text-green-400"
                                    count={myFoundItems.length}
                                    linkTo="/my-items"
                                    linkLabel="View All"
                                />
                                {myFoundItems.length === 0 ? (
                                    <EmptyState icon={Package} message="You haven't reported any found items yet." linkTo="/report-found" linkLabel="Report Found Item" />
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                        {myFoundItems.map(item => <MyItemCard key={item._id} item={item} />)}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Section 3: Others Lost Items */}
                        {(activeTab === 'all' || activeTab === 'community') && (
                            <section>
                                <SectionHeader
                                    icon={Hand}
                                    title="Lost Items on Campus"
                                    subtitle="Help Others"
                                    color="text-lavender"
                                    count={othersLostItems.length}
                                    linkTo="/activity"
                                    linkLabel="Full Feed"
                                />
                                {othersLostItems.length === 0 ? (
                                    <EmptyState icon={Package} message="No lost items from others right now." />
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {othersLostItems.slice(0, 12).map(item => (
                                            <OthersItemCard key={item._id} item={item} onIFoundThis={setFoundThisItem} />
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {activeTab === 'all' && (
                            <section className="max-w-md">
                                <div className="glass-card p-5 mt-4 border-electric-blue/10">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-9 h-9 bg-electric-blue/20 rounded-xl flex items-center justify-center">
                                            <Shield size={16} className="text-electric-blue" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-lavender/40">Reputation Score</div>
                                            <div className="text-lg font-black text-electric-blue">{user?.reputationScore || 0} pts</div>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min((user?.reputationScore || 0) * 2, 100)}%` }}
                                            transition={{ delay: 0.5, duration: 1 }}
                                            className="h-full bg-gradient-to-r from-electric-blue to-purple-500 rounded-full"
                                        />
                                    </div>
                                    <p className="text-[9px] text-lavender/30 mt-2">Earn +10 pts each time you help someone recover their item!</p>
                                </div>
                            </section>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* I Found This Modal */}
            <IFoundThisModal lostItem={foundThisItem} isOpen={!!foundThisItem} onClose={() => setFoundThisItem(null)} />
        </div>
    );
};

export default Dashboard;