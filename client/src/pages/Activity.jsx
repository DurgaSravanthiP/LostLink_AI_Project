import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity as ActivityIcon, Search, Package, CheckCircle, Clock, AlertCircle, MapPin, Tag, Calendar, ArrowRight, X, Hand, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const statusConfig = {
    active: { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', icon: Clock, label: 'Active' },
    matched: { color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: CheckCircle, label: 'Matched' },
};

const categoryEmoji = {
    'Electronics': '🎧', 'Wallets & Purses': '👜', 'ID Cards': '🪪',
    'Keys': '🔑', 'Books & Stationery': '📚', 'Clothing': '👕',
    'Water Bottles': '💧', 'Others': '📦',
};

const levenshteinDistance = (a, b) => {
    const matrix = Array.from({ length: b.length + 1 }, () => []);
    for (let i = 0; i <= b.length; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i += 1) {
        for (let j = 1; j <= a.length; j += 1) {
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1, matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + (a[j - 1] === b[i - 1] ? 0 : 1)
            );
        }
    }
    return matrix[b.length][a.length];
};

const fuzzyIncludes = (text, query) => {
    if (!query) return true;
    const nText = (text || '').toLowerCase();
    const nQuery = query.toLowerCase().trim();
    if (!nQuery) return true;
    if (nText.includes(nQuery)) return true;
    const tokens = nText.split(/\W+/).filter(Boolean);
    const maxDist = Math.max(1, Math.round(nQuery.length * 0.34));
    return tokens.some(t => levenshteinDistance(t, nQuery) <= maxDist);
};

/* ── "I Found This" Modal ─────────────────────────────────── */
const IFoundThisModal = ({ lostItem, isOpen, onClose }) => {
    const [myFoundItems, setMyFoundItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(null);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!isOpen) return;
        setSuccess(false);
        setError('');
        const fetch = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/items/my-found-items', {
                    headers: { 'x-auth-token': token }
                });
                setMyFoundItems(res.data);
            } catch { setMyFoundItems([]); }
            finally { setLoading(false); }
        };
        fetch();
    }, [isOpen]);

    const handleSelect = async (foundItem) => {
        setSubmitting(foundItem._id);
        setError('');
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/items/${lostItem._id}/claim`, {
                claimerItemId: foundItem._id
            }, { headers: { 'x-auth-token': token } });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit notification.');
        } finally { setSubmitting(null); }
    };

    if (!isOpen || !lostItem) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-card w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight mb-1">🎉 I Found This!</h2>
                        <p className="text-lavender/40 text-xs">Notify the owner of "<span className="text-white font-bold">{lostItem.title}</span>"</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} className="text-green-400" />
                            </div>
                            <h3 className="text-xl font-black mb-2">Owner Notified!</h3>
                            <p className="text-lavender/50 text-sm mb-6">The owner will see your found report and can verify ownership through your security questions.</p>
                            <button onClick={onClose} className="btn-primary px-8 py-3 text-xs font-black uppercase tracking-widest">Done</button>
                        </div>
                    ) : loading ? (
                        <div className="text-center py-12 text-lavender/40 text-sm">Loading your found reports...</div>
                    ) : myFoundItems.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={32} className="text-yellow-400" />
                            </div>
                            <h3 className="text-lg font-black mb-2">No Found Reports Yet</h3>
                            <p className="text-lavender/50 text-sm mb-6">You need to first report the item you found. This lets the owner verify ownership through your security questions.</p>
                            <button
                                onClick={() => { onClose(); navigate('/report-found'); }}
                                className="btn-primary px-8 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 mx-auto"
                            >
                                Report Found Item <ArrowRight size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-xs text-lavender/50 leading-relaxed mb-4">Select which of your found reports matches this lost item. The owner will be notified and must answer your verification questions.</p>
                            {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-center font-bold">{error}</p>}
                            {myFoundItems.map(fi => (
                                <motion.button
                                    key={fi._id}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    disabled={!!submitting}
                                    onClick={() => handleSelect(fi)}
                                    className="w-full text-left glass-card p-4 flex items-center gap-4 hover:bg-white/[0.04] transition-all border border-white/5 hover:border-electric-blue/30 disabled:opacity-50"
                                >
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-2xl ${fi.images?.[0] ? '' : 'bg-green-500/10'}`}>
                                        {fi.images?.[0] ? <img src={fi.images[0]} className="w-full h-full object-cover rounded-xl" alt="" /> : (categoryEmoji[fi.category] || '📦')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm truncate">{fi.title}</h4>
                                        <p className="text-[10px] text-lavender/40 truncate">{fi.location} · {new Date(fi.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="shrink-0">
                                        {submitting === fi._id
                                            ? <span className="text-[10px] text-electric-blue font-bold animate-pulse">Sending...</span>
                                            : <ArrowRight size={16} className="text-electric-blue" />}
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

/* ── Item Card (for lost items in feed) ───────────────────── */
const ItemCard = ({ item, onIFoundThis, onViewDetails, isOwner }) => {
    const status = statusConfig[item.status] || statusConfig.active;
    const StatusIcon = status.icon;
    const emoji = categoryEmoji[item.category] || '📦';

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => onViewDetails(item)}
            className="glass-card overflow-hidden hover:bg-white/[0.04] transition-all cursor-pointer"
        >
            <div className={`relative h-52 flex items-center justify-center ${item.type === 'lost' ? 'bg-red-500/5' : 'bg-green-500/5'}`}>
                {item.images?.length > 0
                    ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                    : <span className="text-6xl">{emoji}</span>}
                <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-red-500/20 text-red-400">🔴 Lost</span>
                </div>
                <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${status.color} flex items-center`}>
                        <StatusIcon size={10} className="mr-1" />{status.label}
                    </span>
                </div>
            </div>

            <div className="p-5">
                <h3 className="text-base font-black tracking-tight mb-2">{item.title}</h3>
                <p className="text-lavender/50 text-xs mb-3 leading-relaxed line-clamp-2">{item.description}</p>
                <div className="flex flex-wrap gap-2 text-[10px] text-lavender/40 font-bold uppercase tracking-widest mb-4">
                    <span className="flex items-center"><Tag size={11} className="mr-1 text-electric-blue" />{item.category}</span>
                    <span className="flex items-center"><MapPin size={11} className="mr-1 text-electric-blue" />{item.location}</span>
                    <span className="flex items-center"><Calendar size={11} className="mr-1 text-electric-blue" />{new Date(item.date).toLocaleDateString()}</span>
                </div>
                {item.user?.name && (
                    <p className="text-[10px] text-lavender/30 mb-4">Reported by <span className="text-lavender/60 font-bold">{item.user.name}</span></p>
                )}

                {isOwner ? (
                    <Link to="/my-items" onClick={(e) => e.stopPropagation()}
                        className="btn-secondary py-2 w-full text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2">
                        <ExternalLink size={12} /><span>View in My Reports</span>
                    </Link>
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); onIFoundThis(item); }}
                        className="btn-primary py-2.5 w-full text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 group"
                    >
                        <Hand size={13} />
                        <span>I Found This!</span>
                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                )}
            </div>
        </motion.div>
    );
};

/* ── Detail Modal ─────────────────────────────────────────── */
const ItemDetailModal = ({ item, isOpen, onClose, onIFoundThis, isOwner }) => {
    if (!isOpen || !item) return null;
    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6"
            >
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10"
                >
                    <div className="sticky top-0 flex justify-end p-4 border-b border-white/5 bg-indigo-950/50 backdrop-blur-md z-10">
                        <button onClick={onClose} className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"><X size={20} /></button>
                    </div>
                    <div className="relative h-64 overflow-hidden">
                        <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1590370221379-33b6838a6a6d?w=800&q=80'} alt={item.title} className="w-full h-full object-cover" />
                        <div className="absolute top-4 left-4 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md bg-red-500/30 text-red-200 border border-red-500/50">Lost Item</div>
                    </div>
                    <div className="p-8 space-y-6">
                        <div>
                            <h1 className="text-4xl font-black mb-2">{item.title}</h1>
                            <p className="text-lavender/60 text-lg"><span className="text-red-400 font-bold">LOST</span> on campus</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <p className="text-lavender leading-relaxed">{item.description}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[['Location', <MapPin size={15} className="mr-2 text-electric-blue shrink-0 mt-0.5" />, item.location],
                              ['Date', <Calendar size={15} className="mr-2 text-electric-blue shrink-0 mt-0.5" />, new Date(item.date).toLocaleDateString()],
                              ['Category', <Tag size={15} className="mr-2 text-electric-blue shrink-0 mt-0.5" />, item.category || 'General']
                            ].map(([label, icon, val]) => (
                                <div key={label} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <div className="text-[10px] text-lavender/40 uppercase font-bold tracking-widest mb-2">{label}</div>
                                    <div className="flex items-start text-sm">{icon}<span className="text-lavender font-semibold">{val}</span></div>
                                </div>
                            ))}
                        </div>
                        {isOwner ? (
                            <Link to="/my-items"
                                className="w-full block py-4 bg-white/5 border border-white/10 rounded-xl font-black uppercase tracking-widest text-lavender text-center hover:bg-white/10 transition-all"
                            >View in My Reports</Link>
                        ) : (
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => { onIFoundThis(item); onClose(); }}
                                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-black uppercase tracking-widest text-white hover:shadow-lg hover:shadow-green-500/40 transition-all flex items-center justify-center gap-3"
                            >
                                <Hand size={20} /> I Found This! →
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

/* ── Main Activity Page ───────────────────────────────────── */
const Activity = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [foundThisItem, setFoundThisItem] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/items/public-lost', {
                    headers: { 'x-auth-token': token }
                });
                setItems(res.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchAll();
    }, []);

    const filtered = items.filter(item => {
        const matchesCat = selectedCategory === 'All Categories' || item.category === selectedCategory;
        const matchesSearch = fuzzyIncludes(item.title, searchQuery) || fuzzyIncludes(item.description, searchQuery) || fuzzyIncludes(item.location, searchQuery);
        return matchesCat && matchesSearch;
    });

    const categoriesList = ['All Categories', ...Object.keys(categoryEmoji)];

    return (
        <div className="pt-24 px-6 max-w-6xl mx-auto pb-20">
            <div className="mb-10">
                <div className="flex items-center space-x-3 mb-3">
                    <ActivityIcon size={24} className="text-electric-blue" />
                    <h1 className="text-4xl font-black tracking-tight">Activity Feed</h1>
                </div>
                <p className="text-lavender/40 text-sm">Lost items reported on campus. If you found any of these, click <span className="text-green-400 font-bold">"I Found This!"</span> to notify the owner.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="glass-card p-5 text-center">
                    <div className="text-3xl font-black text-electric-blue mb-1">{items.length}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-lavender/40">Active Lost Reports</div>
                </div>
                <div className="glass-card p-5 text-center">
                    <div className="text-3xl font-black text-green-400 mb-1">
                        <Hand size={28} className="inline" />
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-lavender/40">Help Reunite Items!</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
                <div className="md:col-span-6 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-lavender/30 group-focus-within:text-electric-blue transition-colors" size={18} />
                    <input type="text" placeholder="Search items, locations, or descriptions..."
                        className="input-field pl-12 py-3.5 text-sm" value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="md:col-span-3">
                    <select className="input-field py-3.5 text-sm appearance-none" value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}>
                        {categoriesList.map(c => <option key={c} value={c} className="text-inherit">{c}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-lavender/40">Loading activity feed...</div>
            ) : filtered.length === 0 ? (
                <div className="glass-card p-16 text-center">
                    <Package size={48} className="mx-auto mb-4 text-lavender/20" />
                    <h3 className="text-xl font-bold mb-2">No Lost Reports Yet</h3>
                    <p className="text-lavender/40 mb-6 text-sm">Be the first to report a lost or found item on campus!</p>
                    <Link to="/report-lost" className="btn-primary px-8">Report Now</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((item) => (
                        <ItemCard
                            key={item._id} item={item}
                            isOwner={user?.id === item.user?._id}
                            onViewDetails={(it) => { setSelectedItem(it); setIsDetailOpen(true); }}
                            onIFoundThis={(it) => setFoundThisItem(it)}
                        />
                    ))}
                </div>
            )}

            <ItemDetailModal
                item={selectedItem} isOpen={isDetailOpen}
                isOwner={user?.id === selectedItem?.user?._id}
                onClose={() => setIsDetailOpen(false)}
                onIFoundThis={(it) => setFoundThisItem(it)}
            />

            <IFoundThisModal
                lostItem={foundThisItem}
                isOpen={!!foundThisItem}
                onClose={() => setFoundThisItem(null)}
            />
        </div>
    );
};

export default Activity;
