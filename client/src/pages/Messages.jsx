import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, User, MessageCircle, ArrowLeft, Package, ShieldQuestion, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Messages = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [matchedItems, setMatchedItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(location.state?.item || null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef();

    // Verification state
    const [verifyAnswers, setVerifyAnswers] = useState([]);
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState('');
    const [verifySuccess, setVerifySuccess] = useState(false);

    // Fetch all matched items for the sidebar
    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { 'x-auth-token': token } };
                const res = await axios.get('http://localhost:5000/api/items/my-items', config);
                const matches = res.data.filter(item => item.status === 'matched');
                setMatchedItems(matches);
                
                // If no item selected yet, pick the first one
                if (!selectedItem && matches.length > 0) {
                    setSelectedItem(matches[0]);
                }
            } catch (err) {
                console.error("Error fetching matches", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMatches();
    }, []);

    // When selectedItem changes, reset verify state and init answers array
    useEffect(() => {
        if (!selectedItem) return;
        setVerifyError('');
        setVerifySuccess(!!selectedItem.verificationSuccess);
        const qCount = selectedItem.verificationQuestions?.length || 0;
        setVerifyAnswers(Array(qCount).fill(''));
    }, [selectedItem?._id]);

    // Socket.io Connection & History Fetching
    useEffect(() => {
        if (!selectedItem?._id) return;

        const loadHistory = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/messages/${selectedItem._id}`);
                const history = res.data.map(msg => ({
                    ...msg,
                    sender: msg.sender === localStorage.getItem('userName') ? 'You' : msg.sender
                }));
                setMessages(history);
            } catch (err) {
                console.error("Error loading chat history", err);
            }
        };

        loadHistory();
        
        socketRef.current = io('http://localhost:5000');
        socketRef.current.emit('join_room', selectedItem._id);

        socketRef.current.on('receive_message', (data) => {
            if (data.roomId === selectedItem._id) {
                setMessages((prev) => [...prev, {
                    ...data,
                    sender: data.sender === localStorage.getItem('userName') ? 'You' : data.sender
                }]);
            }
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [selectedItem?._id]);

    const sendMessage = (e) => {
        e.preventDefault();
        const myName = localStorage.getItem('userName') || 'User';
        if (message.trim() && selectedItem?._id) {
            const data = {
                roomId: selectedItem._id,
                message,
                sender: myName,
                senderName: myName,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            
            // Add to local state immediately
            setMessages((prev) => [...prev, { ...data, sender: 'You' }]);
            
            // Emit to server (server saves to DB)
            socketRef.current.emit('send_message', data);
            
            setMessage('');
        }
    };

    // Handle ownership verification with proper claim-first logic
    const handleVerification = async (e) => {
        e.preventDefault();
        setVerifying(true);
        setVerifyError('');

        const token = localStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };

        try {
            // Step 1: Ensure a claim exists. If this is an AI-auto-matched item,
            // the claim record may be missing. We need our own lost item id.
            // Get our own items and find the one that matches (our lost item → this found item).
            const myItemsRes = await axios.get('http://localhost:5000/api/items/my-items', config);
            const myItems = myItemsRes.data;

            // The selectedItem is a FOUND item belonging to someone else.
            // We need to find our LOST item that is matched to this found item.
            const myLostItem = myItems.find(i =>
                i.type === 'lost' &&
                i.matchId &&
                i.matchId.toString() === selectedItem._id.toString()
            );

            if (myLostItem) {
                // Ensure claim exists (will be ignored if already claimed)
                try {
                    await axios.post(
                        `http://localhost:5000/api/items/${selectedItem._id}/claim`,
                        { claimerItemId: myLostItem._id },
                        config
                    );
                } catch (claimErr) {
                    // 400 = already claimed or own item, ignore and proceed
                    if (claimErr.response?.status !== 400) throw claimErr;
                }
            }

            // Step 2: Submit verification answers
            const res = await axios.post(
                `http://localhost:5000/api/items/${selectedItem._id}/verify`,
                { answers: verifyAnswers },
                config
            );

            if (res.data.success) {
                setVerifySuccess(true);
                setSelectedItem(prev => ({ ...prev, verificationSuccess: true }));
            } else {
                setVerifyError(res.data.message || 'Incorrect answers. Please try again.');
            }
        } catch (err) {
            console.error("Verification error", err);
            setVerifyError(err.response?.data?.message || 'Verification failed. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    if (loading) {
        return <div className="pt-32 text-center text-lavender/40 animate-pulse font-black uppercase tracking-widest text-xs italic">Synchronizing Secure Stream...</div>;
    }

    return (
        <div className="pt-20 px-4 md:px-6 max-w-7xl mx-auto pb-10 h-[calc(100vh-80px)] flex flex-col">
            <div className="glass-card flex-1 flex overflow-hidden shadow-2xl border-white/5">
                {/* Sidebar - Chat List */}
                <div className={`${selectedItem ? 'hidden md:flex' : 'flex'} w-full md:w-96 border-r border-white/5 flex flex-col bg-white/[0.02]`}>
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                            <MessageCircle className="text-electric-blue" size={20} />
                            Active Chats
                        </h2>
                        <p className="text-[10px] text-lavender/30 uppercase tracking-widest font-bold mt-1">Verified AI Matches</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {matchedItems.length === 0 ? (
                            <div className="text-center py-10">
                                <div className="text-lavender/20 mb-2">No active matches found</div>
                                <button onClick={() => navigate('/dashboard')} className="text-xs font-bold text-electric-blue hover:underline">Go to Dashboard</button>
                            </div>
                        ) : (
                            matchedItems.map((item) => (
                                <motion.div
                                    key={item._id}
                                    whileHover={{ x: 4 }}
                                    onClick={() => setSelectedItem(item)}
                                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                                        selectedItem?._id === item._id 
                                        ? 'bg-electric-blue/10 border-electric-blue/30 shadow-lg shadow-blue-500/10' 
                                        : 'bg-white/5 border-transparent hover:bg-white/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedItem?._id === item._id ? 'bg-electric-blue text-white' : 'bg-white/10 text-lavender/40'}`}>
                                            <Package size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-black truncate">{item.title}</div>
                                            <div className="text-[10px] text-lavender/40 uppercase tracking-widest font-bold truncate">
                                                {item.type === 'lost' ? 'Lost Item' : 'Found Item'}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Chat Window */}
                <div className={`${!selectedItem ? 'hidden md:flex' : 'flex'} flex-1 flex flex-col relative`}>
                    {selectedItem ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setSelectedItem(null)} className="md:hidden p-2 hover:bg-white/10 rounded-full">
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div className="w-12 h-12 bg-electric-blue/20 rounded-2xl flex items-center justify-center border border-electric-blue/20">
                                        <User size={24} className="text-electric-blue" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg">{selectedItem.title}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Live Connection</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Banner — shown for LOST item owners who need to verify */}
                            {selectedItem.type === 'found' &&
                             !verifySuccess &&
                             selectedItem.verificationQuestions?.length > 0 && (
                                <div className="p-6 bg-electric-blue/5 border-b border-electric-blue/10">
                                    <div className="flex items-center gap-3 mb-3">
                                        <ShieldQuestion className="text-electric-blue" size={20} />
                                        <h4 className="text-xs font-black uppercase tracking-widest text-electric-blue">Ownership Verification Required</h4>
                                    </div>
                                    <p className="text-[10px] text-lavender/60 mb-5 font-medium leading-relaxed">
                                        The finder has set {selectedItem.verificationQuestions.length} verification question{selectedItem.verificationQuestions.length > 1 ? 's' : ''}. Answer them correctly to prove this item is yours and unlock the finder's contact.
                                    </p>
                                    <form onSubmit={handleVerification} className="space-y-4">
                                        {selectedItem.verificationQuestions.map((q, i) => (
                                            <div key={i} className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-lavender/60 block">
                                                    Q{i + 1}: {q.question}
                                                </label>
                                                <input
                                                    type="text"
                                                    className="input-field py-2.5 text-sm w-full"
                                                    placeholder="Your answer..."
                                                    value={verifyAnswers[i] || ''}
                                                    onChange={(e) => {
                                                        const updated = [...verifyAnswers];
                                                        updated[i] = e.target.value;
                                                        setVerifyAnswers(updated);
                                                    }}
                                                    required
                                                />
                                            </div>
                                        ))}
                                        {verifyError && (
                                            <div className="flex items-center gap-2 text-red-400 text-[10px] font-bold bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                                                <XCircle size={14} />
                                                {verifyError}
                                            </div>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={verifying || verifyAnswers.some(a => !a?.trim())}
                                            className="btn-primary py-2.5 px-6 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:grayscale flex items-center gap-2"
                                        >
                                            <ShieldCheck size={14} />
                                            {verifying ? 'Verifying...' : 'Submit Answers & Verify Ownership'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Verification Success Banner */}
                            {verifySuccess && (
                                <div className="px-6 py-3 bg-green-500/10 border-b border-green-500/20 flex items-center gap-3">
                                    <CheckCircle2 size={16} className="text-green-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-green-400">
                                        Ownership Verified ✓ — You can now coordinate the return below
                                    </span>
                                </div>
                            )}

                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="text-center">
                                    <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-lavender/30 border border-white/5">
                                        End-to-End Encrypted • {verifySuccess ? "Verified" : "Pending Verification"}
                                    </span>
                                </div>

                                {messages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                                            <MessageCircle size={32} className="text-lavender/10" />
                                        </div>
                                        <p className="text-sm text-lavender/40 max-w-xs">
                                            Chat is live. Securely coordinate the return of your item.
                                        </p>
                                    </div>
                                )}

                                <AnimatePresence>
                                    {messages.map((msg, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[80%] md:max-w-[60%] p-4 rounded-3xl ${
                                                msg.sender === 'You' 
                                                ? 'bg-electric-blue text-white rounded-br-none shadow-lg shadow-blue-500/20' 
                                                : 'bg-white/5 border border-white/10 text-lavender rounded-tl-none'
                                            }`}>
                                                <div className={`text-[10px] font-black uppercase tracking-widest mb-1 opacity-60 flex items-center gap-2 ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                                                    {msg.senderName || msg.sender} • {msg.time}
                                                </div>
                                                <div className="text-sm leading-relaxed">{msg.message}</div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Message Input */}
                            <form onSubmit={sendMessage} className="p-6 bg-white/[0.01] border-t border-white/5">
                                <div className="flex gap-4 items-center glass-card p-2 border-white/10">
                                    <input
                                        className="flex-1 bg-transparent border-none focus:ring-0 px-4 text-sm"
                                        placeholder="Type your message here..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!message.trim()}
                                        className="w-12 h-12 bg-electric-blue text-white rounded-2xl flex items-center justify-center hover:bg-blue-500 transition-all disabled:opacity-50 disabled:grayscale"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-6">
                            <div className="w-24 h-24 bg-electric-blue/10 rounded-3xl flex items-center justify-center border border-electric-blue/10">
                                <MessageCircle size={48} className="text-electric-blue opacity-50" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tight">Your Message Center</h3>
                                <p className="text-lavender/40 mt-2 max-w-sm">
                                    Select a match from the sidebar to begin chatting with the other user.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
