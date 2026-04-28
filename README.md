# 🔍 LostLink: Smart Campus Lost & Found System

LostLink is an intelligent, AI-powered platform designed to seamlessly reunite people with their lost belongings. By leveraging **Natural Language Processing (NLP)** and **Fuzzy Logic**, LostLink automatically matches lost and found reports and provides a secure verification system to ensure items returned to their rightful owners.

---

## 📂 Project Structure

| Folder | Description | Tech Stack |
| :--- | :--- | :--- |
| **`client/`** | The frontend application | React, Vite, Tailwind CSS, Framer Motion |
| **`server/`** | The main backend API | Node.js, Express, MongoDB, Socket.io |
| **`ai-service/`** | AI/ML processing service | Python, FastAPI, Scikit-learn (TF-IDF) |

---

## ✨ Key Features

*   **🤖 AI Matching Engine:** Automatically calculates match percentages using TF-IDF text similarity and cosine similarity.
*   **⚖️ Priority Inference:** Uses a Forward Chaining Agent to determine the urgency of reported items based on their category and description.
*   **🛡️ Secure Verification:** Finders set custom security questions; claimants must pass a fuzzy-logic answer check to verify ownership.
*   **💬 Real-time Chat:** Integrated chat system for finders and losers to coordinate returns.
*   **🏅 Reputation System:** Users earn points for successfully returning items, building campus-wide trust.
*   **✨ Premium UI:** A sleek, glassmorphic dashboard with smooth animations.

---

## 🚀 Getting Started

To run the full system, you need to start three services: the **Main Backend**, the **AI Service**, and the **Frontend Client**.

### 1. Main Backend (Node.js)
```bash
cd server
npm install
# Create a .env file with MONGODB_URI and JWT_SECRET
npm run dev
```
*Runs on: `http://localhost:5000`*

### 2. AI Service (Python)
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```
*Runs on: `http://localhost:8000`*

### 3. Frontend Client (React)
```bash
cd client
npm install
npm run dev
```
*Runs on: `http://localhost:5173`*

---

## 🏗️ System Workflow

1.  **Report:** A user submits a "Lost" or "Found" item.
2.  **Analyze:** The `ai-service` infers the item's priority and matches it against existing reports in the database.
3.  **Notify:** If a high-score match is found, the user is notified instantly via their dashboard.
4.  **Verify:** The claimant answers the security questions provided by the finder.
5.  **Return:** Once verified, the items are marked as "Matched," and the finder's reputation score increases.

---

## 🛠️ Configuration (.env)

Ensure your `/server/.env` file contains:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

---

*Developed for the AI - 6th Semester Project.*
