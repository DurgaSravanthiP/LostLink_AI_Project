const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    type: { type: String, enum: ['lost', 'found'], required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String },
    location: { type: String, required: true },
    color: { type: String },
    images: [{ type: String }],
    status: { type: String, enum: ['active', 'matched', 'recovered', 'returned'], default: 'active' },
    verificationQuestions: [{
        question: String,
        answer: String
    }],
    claims: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        claimerItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
        status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
        createdAt: { type: Date, default: Date.now }
    }],
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    matchScore: { type: Number, default: 0 },
    urgencyLevel: { type: String, enum: ['Low', 'High', 'Critical'], default: 'Low' },
    inferenceReason: { type: String, default: 'Standard item.' },
    aiProcessed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', ItemSchema);
