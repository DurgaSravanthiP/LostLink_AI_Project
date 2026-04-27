const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'lostlink_secret_fallback_123';

const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, studentId, department, year, phone } = req.body;
        
        const allowedDomains = ['srmap.edu.in', 'srmap.ac.in', 'university.edu'];
        const emailDomain = (email || '').split('@')[1]?.toLowerCase();
        if (!emailDomain || !allowedDomains.some(domain => emailDomain === domain || emailDomain.endsWith(`.${domain}`))) {
            return res.status(400).json({ message: 'Please sign up using an approved campus email address.' });
        }

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        user = new User({ name, email, password, studentId, department, year, phone });
        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email,
                studentId: user.studentId,
                department: user.department,
                year: user.year,
                phone: user.phone,
                reputationScore: 0,
                verified: false
            } 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email,
                studentId: user.studentId,
                department: user.department,
                year: user.year,
                phone: user.phone,
                reputationScore: user.reputationScore 
            } 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get logged-in user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, studentId, department, year, phone } = req.body;
        const user = await User.findById(req.user);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name) user.name = name;
        if (studentId) user.studentId = studentId;
        if (department) user.department = department;
        if (year) user.year = year;
        if (phone) user.phone = phone;

        await user.save();

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            reputationScore: user.reputationScore,
            studentId: user.studentId,
            department: user.department,
            year: user.year,
            phone: user.phone
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
