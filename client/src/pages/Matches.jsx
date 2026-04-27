import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, MapPin, Calendar, ArrowRight, Activity, Star, Hand, Search } from 'lucide-react';
import axios from 'axios';

const MatchCard = ({ match, newItem }) => {
    const { item, score } = match;
    const isHighMatch = score >= 70;
    const [claimed, setClaimed] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [showVerify, setShowVerify] = useState(false);
    const [answers, setAnswers] = useState(item.verificationQuestions?.map(() => '') || []);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const headers = { 'x-auth-token': token };

    // LOSER claiming a FOUND item: claimerItemId = their lost item (newItem)
    const handleClaim = async () => {
        setClaiming(true);
        setError('');
        try {
            await axios.post(`http://localhost:5000/api/items/${item._id}/claim`, {
                claimerItemId: newItem._id
            }, { headers });

            // If the found item has verification questions, show them
            if (item.type === 'found' && item.verificationQuestions?.length > 0) {
                setShowVerify(true);
            } else {
                setClaimed(true);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Claim failed');
        } finally { setClaiming(false); }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setVerifying(true);
        setError('');
        try {
            const res = await axios.post(`http://localhost:5000/api/items/${item._id}/verify`,
                { answers }, { headers });
            if (res.data.success) {
                setClaimed(true);
                setShowVerify(false);
            } else {
                setError(res.data.message);
            }
        } catch { setError('Verification failed. Please try again.'); }
        finally { setVerifying(false); }
    };

    return (
        <>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className={`glass-card overflow-hidden h-full flex flex-col ${match.alreadyMatched ? 'border-green-500/30 ring-2 ring-green-500/30' : isHighMatch ? 'border-green-500/30 ring-1 ring-green-500/20' : ''}`}
            >
                {match.alreadyMatched ? (
                    <div className="bg-green-500 text-white text-[10px] font-black px-4 py-1.5 uppercase tracking-widest text-center flex items-center justify-center space-x-1">
                        <CheckCircle size={10} /><span>✓ Verified Match — Item Claimed Successfully</span>
                    </div>
                ) : isHighMatch && (
                    <div className="bg-green-500 text-white text-[10px] font-black px-4 py-1.5 uppercase tracking-widest text-center flex items-center justify-center space-x-1">
                        <Star size={10} /><span>High Confidence Match</span>
                    </div>
                )}

                <div className="h-40 relative overflow-hidden bg-white/5">
                    {item.images?.[0]
                        ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-5xl">
                            {item.category === 'Electronics' ? '🎧' : item.category === 'ID Cards' ? '🪪' :
                             item.category === 'Wallets & Purses' ? '👜' : item.category === 'Water Bottles' ? '💧' :
                             item.category === 'Books & Stationery' ? '📚' : item.category === 'Keys' ? '🔑' : '📦'}
                          </div>}
                    <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        item.type === 'found' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>{item.type} Item</div>
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black ${
                        match.alreadyMatched ? 'bg-green-500 text-white' : isHighMatch ? 'bg-green-500 text-white' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>{match.alreadyMatched ? '✓ Matched' : `${Math.round(score)}% match`}</div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-black mb-2 tracking-tight">{item.title}</h3>
                    <p className="text-lavender/50 text-xs mb-4 leading-relaxed line-clamp-2">{item.description}</p>
                    <div className="flex gap-4 text-[10px] text-lavender/40 font-bold uppercase tracking-widest mb-5">
                        <span className="flex items-center"><MapPin size={11} className="mr-1 text-electric-blue" />{item.location}</span>
                        <span className="flex items-center"><Calendar size={11} className="mr-1 text-electric-blue" />{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                    {item.user?.name && (
                        <p className="text-[10px] text-lavender/30 mb-4">Reported by <span className="font-bold text-lavender/50">{item.user.name}</span></p>
                    )}

                    <div className="mt-auto">


                        {error && <p className="text-red-400 text-[10px] font-bold bg-red-400/10 p-2 rounded-lg border border-red-400/20 text-center mb-3">{error}</p>}

                        {match.alreadyMatched ? (
                            <div className="w-full p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-center space-y-3">
                                <div className="text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2">
                                    <CheckCircle size={14} /><span>Verified Match ✓</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-lavender/60">Contact the finder at:</p>
                                    <p className="text-sm font-black text-white bg-green-500/20 py-2 px-4 rounded-lg inline-block select-all cursor-copy">{item.user?.email || "Email Hidden"}</p>
                                </div>
                                <p className="text-[8px] uppercase tracking-widest text-lavender/40 leading-tight">Mention you verified successfully on LostLink</p>
                            </div>
                        ) : claimed ? (
                            <div className="w-full p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-center space-y-3">
                                <div className="text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2">
                                    <CheckCircle size={14} /><span>Verification Successful! ✓</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-lavender/60">Please contact the finder to collect your item:</p>
                                    <p className="text-sm font-black text-white bg-green-500/20 py-2 px-4 rounded-lg inline-block select-all cursor-copy">{item.user?.email || "Email Hidden"}</p>
                                </div>
                                <p className="text-[8px] uppercase tracking-widest text-lavender/40 leading-tight">Tell them you successfully verified the ownership questions</p>
                            </div>
                        ) : newItem.type === 'lost' && item.type === 'found' ? (
                            <button onClick={handleClaim} disabled={claiming}
                                className="w-full btn-primary py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center space-x-2 group">
                                <CheckCircle size={14} />
                                <span>{claiming ? 'Submitting...' : 'Authenticate & Claim This'}</span>
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : newItem.type === 'found' && item.type === 'lost' ? (
                            <div className="w-full py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center space-x-2">
                                <CheckCircle size={14} /><span>Owner has been notified</span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </motion.div>

            {/* Verification Modal */}
            {showVerify && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-indigo-950/80 backdrop-blur-md">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="glass-card w-full max-w-md p-8 relative">
                        <h2 className="text-2xl font-black mb-2 tracking-tight italic">Ownership Challenge</h2>
                        <p className="text-lavender/40 text-xs mb-8 leading-relaxed">
                            The finder set security questions to verify you are the true owner of this item.
                        </p>
                        <form onSubmit={handleVerify} className="space-y-6">
                            {item.verificationQuestions.map((q, i) => (
                                <div key={i} className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-lavender/60">{q.question}</label>
                                    <input type="text" className="input-field py-3 text-sm" placeholder="Your answer..."
                                        value={answers[i]}
                                        onChange={(e) => { const a = [...answers]; a[i] = e.target.value; setAnswers(a); }}
                                        required />
                                </div>
                            ))}
                            {error && <p className="text-red-400 text-[10px] font-bold bg-red-400/10 p-3 rounded-lg border border-red-400/20 text-center">{error}</p>}
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowVerify(false)} className="btn-secondary flex-1 py-3 text-[10px] font-black uppercase tracking-widest">Cancel</button>
                                <button type="submit" disabled={verifying} className="btn-primary flex-[2] py-3 text-[10px] font-black uppercase tracking-widest">
                                    {verifying ? 'Verifying...' : 'Verify Ownership'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </>
    );
};

const Matches = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [context, setContext] = useState({ newItem: null, matches: [], mode: 'loser' });
    const [liveMatches, setLiveMatches] = useState(null);
    const [loadingMatches, setLoadingMatches] = useState(false);

    useEffect(() => {
        if (location.state?.newItem) {
            const saved = {
                newItem: location.state.newItem,
                matches: location.state.matches || [],
                mode: location.state.mode || (location.state.newItem.type === 'lost' ? 'loser' : 'finder')
            };
            setContext(saved);
            try { sessionStorage.setItem('matches-context', JSON.stringify(saved)); } catch {}
        } else {
            try {
                const stored = sessionStorage.getItem('matches-context');
                if (stored) setContext(JSON.parse(stored));
            } catch {}
        }
    }, [location.state]);

    useEffect(() => {
        const fetchMatch = async () => {
            if (!context.newItem?._id) return;
    
            setLoadingMatches(true);
    
            try {
                const token = localStorage.getItem('token');
    
                const res = await axios.get(
                    `http://localhost:5000/api/items/my-items`,
                    { headers: { 'x-auth-token': token } }
                );
    
                const allItems = res.data;
    
                // find current item
                const currentItem = allItems.find(i => i._id === context.newItem._id);
    
                if (currentItem && currentItem.matchId) {
                    // find matched item
                    const matchedItem = await axios.get(
                        `http://localhost:5000/api/items/${currentItem.matchId}`,
                        { headers: { 'x-auth-token': token } }
                    );
    
                    setLiveMatches([{
                        item: matchedItem.data,
                        score: currentItem.matchScore,
                        alreadyMatched: true
                    }]);
                } else {
                    setLiveMatches([]);
                }
    
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingMatches(false);
            }
        };
    
        fetchMatch();
    }, [context.newItem?._id]);

    const { newItem, mode } = context;
    const displayMatches = liveMatches || [];

    if (!newItem) {
        return (
            <div className="pt-32 px-6 max-w-lg mx-auto text-center">
                <div className="glass-card p-16">
                    <AlertCircle size={48} className="mx-auto mb-4 text-lavender/20" />
                    <h3 className="text-xl font-bold mb-2">No Report Context</h3>
                    <p className="text-lavender/50 mb-6 text-sm">Submit a report first to see AI matches here.</p>
                    <div className="flex gap-3 justify-center">
                        <Link to="/dashboard" className="btn-primary px-6 py-3 text-xs font-black uppercase tracking-widest">Go to Dashboard</Link>
                        <Link to="/activity" className="btn-secondary px-6 py-3 text-xs font-black uppercase tracking-widest">View Activity</Link>
                    </div>
                </div>
            </div>
        );
    }

    const isLoser = mode === 'loser' || newItem.type === 'lost';
    const oppositeLabel = isLoser ? 'found' : 'lost';

    return (
        <div className="pt-24 px-6 max-w-6xl mx-auto pb-12">
            <header className="mb-12 text-center">
                <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full mb-6 ${
                    isLoser ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                }`}>
                    {isLoser ? <Search size={18} /> : <Hand size={18} />}
                    <span className="text-sm font-bold">{isLoser ? 'Your Lost Item Report' : 'Your Found Item Report'}</span>
                </div>
                <h1 className="text-4xl font-black mb-4 tracking-tight">AI Verified Matches</h1>
                <p className="text-lavender/60">
                    {loadingMatches ? 'Scanning for matches...' : (() => {
                        const matchedCount = displayMatches.filter(m => m.alreadyMatched).length;
                        const pendingCount = displayMatches.filter(m => !m.alreadyMatched).length;
                        if (matchedCount > 0 && pendingCount === 0) {
                            return <>Your item "<span className="text-white font-bold">{newItem.title}</span>" has been <span className="text-green-400 font-bold">successfully matched</span>!</>;
                        } else if (matchedCount > 0 && pendingCount > 0) {
                            return <>Your item is matched, plus <span className="text-white font-bold">{pendingCount}</span> more potential {oppositeLabel} matches for "{newItem.title}".</>;
                        }
                        return <>Our algorithm found <span className="text-white font-bold">{displayMatches.length}</span> potential {oppositeLabel} item matches for "{newItem.title}".</>;
                    })()}
                </p>
                {isLoser && displayMatches.some(m => !m.alreadyMatched) && (
                    <p className="text-xs text-electric-blue/80 mt-3">Click "Authenticate & Claim" on a found item to answer the finder's verification questions and prove ownership.</p>
                )}
            </header>

            {loadingMatches ? (
                <div className="text-center py-16 text-lavender/40">
                    <div className="w-8 h-8 border-2 border-electric-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm">AI is scanning {oppositeLabel} items...</p>
                </div>
            ) : displayMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayMatches.map((match, i) => (
                        <MatchCard key={i} match={match} newItem={newItem} />
                    ))}
                </div>
            ) : (
                <div className="glass-card p-16 text-center max-w-lg mx-auto">
                    <AlertCircle size={48} className="mx-auto mb-4 text-lavender/20" />
                    <h3 className="text-xl font-bold mb-2">No AI Matches Yet</h3>
                    <p className="text-lavender/50 max-w-md mx-auto mb-8 text-sm">
                        Don't worry! Our AI keeps scanning. As soon as a matching {oppositeLabel} item is reported, you'll see it here.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to="/activity" className="btn-primary px-8 py-3 flex items-center justify-center space-x-2 text-xs font-black uppercase tracking-widest">
                            <Activity size={14} /><span>View Activity Feed</span>
                        </Link>
                        <Link to="/dashboard" className="btn-secondary px-8 py-3 text-xs font-black uppercase tracking-widest">Back to Dashboard</Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Matches;
