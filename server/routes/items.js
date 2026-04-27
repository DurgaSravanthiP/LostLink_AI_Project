const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Item = require('../models/Item');
const User = require('../models/User');
const axios = require('axios');
const JWT_SECRET = process.env.JWT_SECRET || 'lostlink_secret_fallback_123';

const sanitizeVerificationQuestions = (questions = []) => {
    return questions
        .filter(q => q?.question?.trim() && q?.answer?.trim())
        .map(q => ({ question: q.question.trim(), answer: q.answer.trim() }));
};

// Middleware to protect routes
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

// ─────────────────────────────────────────────
// Report Item (lost or found)
// ─────────────────────────────────────────────
router.post('/report', auth, async (req, res) => {
    try {
        const itemData = { ...req.body, user: req.user };
        if (itemData.type !== 'found') {
            itemData.verificationQuestions = [];
        } else {
            itemData.verificationQuestions = sanitizeVerificationQuestions(itemData.verificationQuestions);
            if (itemData.verificationQuestions.length === 0) {
                return res.status(400).json({ message: 'At least one verification question is required for found items to ensure secure claims.' });
            }
        }

        const newItem = new Item(itemData);
        
        // ⭐ NEW: Infer Priority using Forward Chaining Agent (Unit 1 & 3 Concept)
        try {
            const priorityRes = await axios.post('http://localhost:8000/infer-priority', {
                title: newItem.title,
                description: newItem.description,
                location: newItem.location,
                category: newItem.category
            });
            newItem.urgencyLevel = priorityRes.data.urgencyLevel;
            newItem.inferenceReason = priorityRes.data.inferenceReason;
        } catch (err) {
            console.error("AI Priority Inference failed:", err.message);
        }

        await newItem.save();

        // Trigger AI matching — match against opposite type
        const oppositeType = newItem.type === 'lost' ? 'found' : 'lost';
        const potentialMatches = await Item.find({
            type: oppositeType,
            status: 'active',
            user: { $ne: req.user }   // exclude own items
        }).populate('user', 'name email');

        let matches = [];
        if (potentialMatches.length > 0) {
            const aiResponse = await axios.post('http://localhost:8000/match', {
                new_item: {
                    title: newItem.title,
                    description: newItem.description,
                    location: newItem.location,
                    category: newItem.category
                },
                existing_items: potentialMatches.map(item => ({
                    title: item.title,
                    description: item.description,
                    location: item.location,
                    category: item.category
                }))
            });

            matches = aiResponse.data.map(m => ({
                index: m.index,
                item: potentialMatches[m.index],
                score: m.score,
                aiExplanation: { descriptionSimilarity: m.score, fuzzyMatch: m.score, locationSimilarity: m.score, timeRelevance: 100 }
            })).sort((a, b) => b.score - a.score);

            if (matches.length > 0) {
                const bestMatch = matches[0];

                if (bestMatch.score > 60) {
                    const matchedItem = potentialMatches[bestMatch.index];

                    newItem.status = "matched";
                    newItem.matchId = matchedItem._id;
                    newItem.matchScore = bestMatch.score;

                    await newItem.save();

                    await Item.findByIdAndUpdate(matchedItem._id, {
                        status: "matched",
                        matchId: newItem._id,
                        matchScore: bestMatch.score
                    });
                }
            }
        }

        res.status(201).json({ item: newItem, matches });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /all — All active items (lost + found) for public Activity Feed
// ─────────────────────────────────────────────
router.get('/all', auth, async (req, res) => {
    try {
        const items = await Item.find({ status: 'active' })
            .sort({ createdAt: -1 })
            .populate('user', 'name');
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /my-items — Current user's own items
// Optional query: ?type=lost|found
// ─────────────────────────────────────────────
router.get('/my-items', auth, async (req, res) => {
    try {
        const filter = { user: req.user };
        if (req.query.type) {
            filter.type = req.query.type;
        }
        const items = await Item.find(filter)
            .sort({ createdAt: -1 })
            .populate('claims.user', 'name email');
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /my-found-items — Current user's found item reports (for claim selection)
// ─────────────────────────────────────────────
router.get('/my-found-items', auth, async (req, res) => {
    try {
        const items = await Item.find({ user: req.user, type: 'found', status: 'active' })
            .sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /public-lost — All active lost items for Activity Feed (alias for filtering)
// ─────────────────────────────────────────────
router.get('/public-lost', auth, async (req, res) => {
    try {
        const items = await Item.find({ type: 'lost', status: 'active' })
            .sort({ createdAt: -1 })
            .populate('user', 'name');
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /my-claims — Claims on the current user's found items
// ─────────────────────────────────────────────
router.get('/my-claims', auth, async (req, res) => {
    try {
        const foundItems = await Item.find({ user: req.user, type: 'found' })
            .populate('claims.user', 'name email');
        const claims = [];
        foundItems.forEach(item => {
            item.claims.forEach(claim => {
                claims.push({ item, claim });
            });
        });
        res.json({ claims });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /notifications — Match alerts for users with active lost items
// ─────────────────────────────────────────────
router.get('/notifications', auth, async (req, res) => {
    try {
        const userItems = await Item.find({ user: req.user, status: 'active', type: 'lost' });
        const notifications = [];

        for (const item of userItems) {
            const potentialMatches = await Item.find({
                type: 'found',
                status: 'active',
                user: { $ne: req.user }
            });
            let matches = [];
            if (potentialMatches.length > 0) {
                const aiResponse = await axios.post('http://localhost:8000/match', {
                    new_item: { title: item.title, description: item.description, location: item.location, category: item.category },
                    existing_items: potentialMatches.map(p => ({ title: p.title, description: p.description, location: p.location, category: p.category }))
                });
                matches = aiResponse.data
                    .map(m => ({
                        item: potentialMatches[m.index],
                        score: Math.round(m.score),
                        aiExplanation: { descriptionSimilarity: Math.round(m.score), fuzzyMatch: Math.round(m.score), locationSimilarity: Math.round(m.score), timeRelevance: 100 }
                    }))
                    .filter(m => m.score >= 10)
                    .sort((a, b) => b.score - a.score);
            }
            if (matches.length > 0) {
                notifications.push({
                    item,
                    totalMatches: matches.length,
                    topMatches: matches.slice(0, 3)
                });
            }
        }

        res.json({ notifications });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /:id/matches — AI matches for a specific item
// ─────────────────────────────────────────────
router.get('/:id/matches', auth, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        const oppositeType = item.type === 'lost' ? 'found' : 'lost';

        // Find active potential matches
        const potentialMatches = await Item.find({
            type: oppositeType,
            status: 'active',
            user: { $ne: item.user }
        }).populate('user', 'name email');

        let matches = [];
        if (potentialMatches.length > 0) {
            const aiResponse = await axios.post('http://localhost:8000/match', {
                new_item: { title: item.title, description: item.description, location: item.location, category: item.category },
                existing_items: potentialMatches.map(p => ({ title: p.title, description: p.description, location: p.location, category: p.category }))
            });
            matches = aiResponse.data
                .map(m => ({
                    item: potentialMatches[m.index],
                    score: Math.round(m.score),
                    aiExplanation: { descriptionSimilarity: Math.round(m.score), fuzzyMatch: Math.round(m.score), locationSimilarity: Math.round(m.score), timeRelevance: 100 }
                }))
                .filter(m => m.score >= 10)
                .sort((a, b) => b.score - a.score);
        }

        // Also find already-matched items (verified claims) for this item
        const alreadyMatchedItems = [];
        if (item.claims && item.claims.length > 0) {
            for (const claim of item.claims) {
                if (claim.status === 'verified' && claim.claimerItemId) {
                    const matchedItem = await Item.findById(claim.claimerItemId).populate('user', 'name email');
                    if (matchedItem) {
                        alreadyMatchedItems.push({
                            item: matchedItem,
                            score: 100,
                            alreadyMatched: true,
                            aiExplanation: { descriptionSimilarity: 100, fuzzyMatch: 100, locationSimilarity: 100, timeRelevance: 100 }
                        });
                    }
                }
            }
        }

        // Also check if the item itself is referenced in another item's verified claims
        if (item.status === 'matched') {
            const parentItems = await Item.find({
                type: oppositeType,
                status: 'matched',
                'claims.claimerItemId': item._id,
                'claims.status': 'verified'
            }).populate('user', 'name email');

            for (const parentItem of parentItems) {
                const alreadyIncluded = alreadyMatchedItems.some(m => m.item._id.toString() === parentItem._id.toString());
                if (!alreadyIncluded) {
                    alreadyMatchedItems.push({
                        item: parentItem,
                        score: 100,
                        alreadyMatched: true,
                        aiExplanation: { descriptionSimilarity: 100, fuzzyMatch: 100, locationSimilarity: 100, timeRelevance: 100 }
                    });
                }
            }
        }

        res.json([...alreadyMatchedItems, ...matches]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────────
// POST /:id/claim — Claim a found item (by the person who lost it)
// The body must contain: claimerItemId (the claimer's own LOST item report)
// OR: for a finder notifying about a lost item, body contains foundItemId (their OWN found report)
// ─────────────────────────────────────────────
router.post('/:id/claim', auth, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        // Cannot claim your own item
        if (item.user.toString() === req.user) {
            return res.status(400).json({ message: 'You cannot claim your own item.' });
        }

        const { claimerItemId } = req.body;
        if (!claimerItemId) {
            return res.status(400).json({ message: 'claimerItemId is required.' });
        }

        const claimerItem = await Item.findById(claimerItemId);
        if (!claimerItem || claimerItem.user.toString() !== req.user) {
            return res.status(400).json({ message: 'Invalid claim report or unauthorized.' });
        }

        // The claimerItem type must be opposite to the item being claimed
        // - If claiming a FOUND item → claimer must have a LOST report
        // - If notifying about a LOST item → claimer must have a FOUND report
        if (item.type === 'found' && claimerItem.type !== 'lost') {
            return res.status(400).json({ message: 'To claim a found item, you must link your lost item report.' });
        }
        if (item.type === 'lost' && claimerItem.type !== 'found') {
            return res.status(400).json({ message: 'To notify a lost item owner, you must link your found item report.' });
        }

        const alreadyClaimed = item.claims.find(c => c.user.toString() === req.user);
        if (!alreadyClaimed) {
            item.claims.push({
                user: req.user,
                claimerItemId,
                status: 'pending'
            });
            await item.save();
        }

        res.json({ message: 'Claim submitted successfully', item });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────────
// POST /:id/verify — Verify ownership answers (loser answering finder's questions)
// ─────────────────────────────────────────────
router.post('/:id/verify', auth, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        if (!Array.isArray(req.body.answers)) {
            return res.status(400).json({ message: 'Answers must be provided in an array.', success: false });
        }

        if (!item.verificationQuestions || item.verificationQuestions.length === 0) {
            return res.status(400).json({ message: 'No verification questions are configured for this item.', success: false });
        }

        const claim = item.claims.find(c => c.user.toString() === req.user);
        if (!claim) {
            return res.status(400).json({ message: 'No pending claim found for this user.', success: false });
        }

        const answers = req.body.answers.map(a => (a || '').toString().toLowerCase().trim());
        let allCorrect = item.verificationQuestions.length === answers.length;

        // Fuzzy answer matching: case-insensitive, partial/keyword match
        const fuzzyAnswerMatch = (userAnswer, correctAnswer) => {
            if (!userAnswer || !correctAnswer) return false;
            const ua = userAnswer.toLowerCase().trim();
            const ca = correctAnswer.toLowerCase().trim();
            // Exact match
            if (ua === ca) return true;
            // One contains the other (e.g. 'butterfly' matches 'butterfly company')
            if (ca.includes(ua) || ua.includes(ca)) return true;
            // Keyword overlap: check if significant words from user's answer appear in correct answer
            const uaWords = ua.split(/\s+/).filter(w => w.length > 1);
            const caWords = ca.split(/\s+/).filter(w => w.length > 1);
            if (uaWords.length > 0 && caWords.length > 0) {
                const matchedWords = uaWords.filter(uw => caWords.some(cw => cw === uw || cw.includes(uw) || uw.includes(cw)));
                // At least one significant keyword matches
                if (matchedWords.length > 0) return true;
            }
            return false;
        };

        item.verificationQuestions.forEach((q, i) => {
            if (!answers[i] || !fuzzyAnswerMatch(answers[i], (q.answer || ''))) {
                allCorrect = false;
            }
        });

        if (allCorrect) {
            claim.status = 'verified';
            item.status = 'matched';
            await item.save();

            // Also mark the claimer's item as matched
            if (claim.claimerItemId) {
                await Item.findByIdAndUpdate(claim.claimerItemId, { status: 'matched' });
            }

            // Award reputation to the finder
            const finderItem = await Item.findById(item._id).populate('user');
            if (finderItem?.user) {
                await User.findByIdAndUpdate(finderItem.user._id, {
                    $inc: { reputationScore: 10 }
                });
            }

            return res.json({ message: 'Verification successful! Item marked as matched.', success: true });
        }

        res.json({ message: 'Incorrect answers. Please try again.', success: false });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /:id — Get item by id
// ─────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id).populate('user', 'name email');
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─────────────────────────────────────────────
// DELETE /:id — Delete own item
// ─────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        if (item.user.toString() !== req.user) {
            return res.status(403).json({ message: 'Not authorized to delete this item' });
        }

        await Item.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
