import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Tag, ArrowRight, Package, Info, CheckCircle2, ShieldQuestion, Camera, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

const categories = [
    'Electronics', 'Wallets & Purses', 'ID Cards', 'Keys', 'Books & Stationery', 'Clothing', 'Water Bottles', 'Others'
];

// Mapping MobileNet classes to our campus categories
const classMap = {
    'laptop': 'Electronics',
    'computer': 'Electronics',
    'notebook': 'Books & Stationery',
    'wallet': 'Wallets & Purses',
    'purse': 'Wallets & Purses',
    'bag': 'Wallets & Purses',
    'keys': 'Keys',
    'bottle': 'Water Bottles',
    'phone': 'Electronics',
    'mobile': 'Electronics',
    'digital clock': 'Electronics',
    'mouse': 'Electronics',
    'book': 'Books & Stationery'
};

const ReportItem = ({ type }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        category: categories[0],
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        location: '',
        color: '',
        verificationQuestions: [{ question: '', answer: '' }],
        images: []
    });
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    
    // AI State
    const [model, setModel] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null);

    // Initialize TensorFlow.js and MobileNet
    useEffect(() => {
        const loadModel = async () => {
            try {
                await tf.ready();
                const m = await mobilenet.load();
                setModel(m);
            } catch (err) {
                console.error("AI Model failed to load:", err);
            }
        };
        loadModel();
    }, []);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const url = event.target.result;
            setFormData(prev => ({ ...prev, images: [url] }));
            
            // Run AI Classification
            if (model) {
                setIsAiLoading(true);
                setAiSuggestion(null);
                
                // Create temp image element for model
                const img = new Image();
                img.src = url;
                img.onload = async () => {
                    const predictions = await model.classify(img);
                    if (predictions && predictions.length > 0) {
                        const top = predictions[0].className.toLowerCase();
                        let foundCategory = null;
                        
                        // Check if any keyword in prediction matches our classMap
                        for (const [key, val] of Object.entries(classMap)) {
                            if (top.includes(key)) {
                                foundCategory = val;
                                break;
                            }
                        }
                        
                        if (foundCategory) {
                             setAiSuggestion({ label: top, category: foundCategory });
                             setFormData(prev => ({ ...prev, category: foundCategory }));
                        }
                    }
                    setIsAiLoading(false);
                };
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData, type };
            if (type !== 'found') {
                payload.verificationQuestions = [];
            } else {
                payload.verificationQuestions = formData.verificationQuestions
                    .filter(q => q.question?.trim() && q.answer?.trim())
                    .map(q => ({ question: q.question.trim(), answer: q.answer.trim() }));
            }

            const res = await axios.post('http://localhost:5000/api/items/report', payload);
            navigate('/matches', { state: { newItem: res.data.item, matches: res.data.matches } });
        } catch (err) {
            console.error(err);
            alert('Error reporting item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const addQuestion = () => {
        setFormData(prev => ({
            ...prev,
            verificationQuestions: [...prev.verificationQuestions, { question: '', answer: '' }]
        }));
    };

    return (
        <div className="pt-24 px-6 max-w-4xl mx-auto pb-20">
            {/* Multi-step progress indicator */}
            <div className="flex items-center justify-center mb-10 space-x-4">
                {[1, 2].map(i => (
                    <div key={i} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            step >= i ? 'bg-electric-blue text-white shadow-lg' : 'bg-white/5 text-lavender/30'
                        }`}>
                            {step > i ? <CheckCircle2 size={16} /> : i}
                        </div>
                        {i === 1 && <div className={`w-16 h-0.5 mx-2 ${step > 1 ? 'bg-electric-blue' : 'bg-white/5'}`}></div>}
                    </div>
                ))}
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card overflow-hidden"
            >
                <div className={`px-10 py-8 border-b border-white/5 bg-gradient-to-r ${type === 'lost' ? 'from-red-500/10 to-transparent' : 'from-green-500/10 to-transparent'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-black mb-2 tracking-tight">Report {type === 'lost' ? 'Lost' : 'Found'} Item</h1>
                            <p className="text-lavender/40 text-sm">
                                {type === 'lost' 
                                    ? "Describe your lost item so our AI can scan found reports." 
                                    : "Provide details of the item you found to help the owner recover it."}
                            </p>
                        </div>
                        {model && (
                            <div className="flex items-center space-x-2 bg-electric-blue/10 px-3 py-1.5 rounded-full border border-electric-blue/20">
                                <Sparkles size={14} className="text-electric-blue" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-electric-blue">AI Vision Active</span>
                            </div>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-10">
                    {step === 1 ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            {/* Image Upload & AI Classification */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-lavender/60 flex items-center uppercase tracking-widest text-[10px]">
                                    <Camera size={16} className="mr-2 text-electric-blue" /> Photo Analysis
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    <div className="relative h-40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/[0.02] hover:bg-white/[0.04] transition-colors overflow-hidden group">
                                        {formData.images[0] ? (
                                            <>
                                                <img src={formData.images[0]} className="w-full h-full object-cover" alt="Preview" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <span className="text-xs font-bold text-white">Change Photo</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <Camera size={24} className="text-lavender/20 mb-2" />
                                                <span className="text-[10px] font-medium text-lavender/40">Drop item photo or click</span>
                                            </>
                                        )}
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <AnimatePresence mode="wait">
                                            {isAiLoading ? (
                                                <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center space-x-3 text-electric-blue">
                                                    <Loader2 className="animate-spin" size={18} />
                                                    <span className="text-xs font-bold animate-pulse">AI is identifying your item...</span>
                                                </motion.div>
                                            ) : aiSuggestion ? (
                                                <motion.div key="suggestion" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                                    <div className="flex items-center mb-1 space-x-2">
                                                        <Sparkles size={14} className="text-green-500" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-green-500">AI Suggestion</span>
                                                    </div>
                                                    <p className="text-xs text-lavender/80 font-medium">I think this is a <span className="text-white font-bold">{aiSuggestion.label}</span>. Auto-categorized as <span className="text-white font-bold">{aiSuggestion.category}</span>.</p>
                                                </motion.div>
                                            ) : (
                                                <p className="text-[10px] text-lavender/30 leading-relaxed italic">
                                                    Upload a photo to let our AI vision automatically identify the item and suggest the correct category.
                                                </p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-lavender/60 flex items-center uppercase tracking-widest text-[10px]">
                                        <Package size={16} className="mr-2 text-electric-blue" /> Item Title
                                    </label>
                                    <input 
                                        className="input-field" 
                                        placeholder={type === 'lost' ? "e.g. My Sony Headphones" : "e.g. Found Sony Headphones"}
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-lavender/60 flex items-center uppercase tracking-widest text-[10px]">
                                        <Tag size={16} className="mr-2 text-electric-blue" /> Category
                                    </label>
                                    <select 
                                        className="input-field appearance-none"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {categories.map(c => <option key={c} value={c} className="text-inherit">{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-bold text-lavender/60 flex items-center uppercase tracking-widest text-[10px]">
                                    <Info size={16} className="mr-2 text-electric-blue" /> Description
                                </label>
                                <textarea 
                                    className="input-field h-32 py-4 resize-none" 
                                    placeholder={type === 'lost' 
                                        ? "Describe unique marks, serial numbers, or stickers..." 
                                        : "Describe the item (hide 1-2 unique details for verification)..."}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-lavender/60 flex items-center"><Calendar size={14} className="mr-2 text-electric-blue" /> Date</label>
                                    <input type="date" className="input-field" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-lavender/60 flex items-center"><MapPin size={14} className="mr-2 text-electric-blue" /> Location</label>
                                    <input className="input-field" placeholder="e.g. Library 2nd Floor" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-lavender/60 flex items-center"><Tag size={14} className="mr-2 text-electric-blue" /> Color</label>
                                    <input className="input-field" placeholder="e.g. Navy Blue" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                                </div>
                            </div>
                            
                            <button type="button" onClick={() => setStep(2)} className="w-full btn-primary py-4 flex items-center justify-center space-x-3 group">
                                <span className="font-black uppercase tracking-widest text-sm">{type === 'found' ? "Next: Set Verification" : "Final Step: Review"}</span>
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            {type === 'found' ? (
                                <>
                                    <div className="bg-electric-blue/5 border border-electric-blue/10 p-6 rounded-2xl">
                                        <h3 className="font-bold mb-2 flex items-center text-electric-blue">
                                            <ShieldQuestion size={18} className="mr-2" /> Ownership Verification
                                        </h3>
                                        <p className="text-xs text-lavender/40 leading-relaxed">
                                            As a finder, set a question that ONLY the true owner can answer. 
                                            Example: "What is written on the back of the laptop?"
                                        </p>
                                    </div>

                                    {formData.verificationQuestions.map((q, i) => (
                                        <div key={i} className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5">
                                            <input 
                                                className="input-field" 
                                                placeholder="Verification Question"
                                                value={q.question}
                                                onChange={(e) => {
                                                    const qs = [...formData.verificationQuestions];
                                                    qs[i].question = e.target.value;
                                                    setFormData({ ...formData, verificationQuestions: qs });
                                                }}
                                                required
                                            />
                                            <input 
                                                className="input-field" 
                                                placeholder="Expected Answer"
                                                value={q.answer}
                                                onChange={(e) => {
                                                    const qs = [...formData.verificationQuestions];
                                                    qs[i].answer = e.target.value;
                                                    setFormData({ ...formData, verificationQuestions: qs });
                                                }}
                                                required
                                            />
                                        </div>
                                    ))}
                                    <button type="button" onClick={addQuestion} className="text-[10px] font-black tracking-widest text-lavender/40 hover:text-electric-blue uppercase">+ Add Question</button>
                                </>
                            ) : (
                                <div className="py-12 text-center">
                                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                                        <CheckCircle2 size={40} className="text-green-500" />
                                    </div>
                                    <h3 className="text-2xl font-black mb-4 uppercase tracking-tight italic">Ready to Submit</h3>
                                    <p className="text-lavender/40 max-w-sm mx-auto mb-8 text-sm">
                                        Our AI will immediately scan all found items once you submit. 
                                        Make sure your description is as detailed as possible!
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center space-x-4 pt-6 border-t border-white/5">
                                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 font-black uppercase tracking-widest text-xs">Back</button>
                                <button type="submit" disabled={loading} className="btn-primary flex-[2] flex items-center justify-center font-black uppercase tracking-widest text-xs py-4">
                                    {loading ? 'Processing...' : `Confirm & Submit`}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </motion.div>
        </div>
    );
};

export default ReportItem;
