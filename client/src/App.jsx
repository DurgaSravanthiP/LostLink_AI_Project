import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ReportItem from './pages/ReportItem';
import Matches from './pages/Matches';
import MyItems from './pages/MyItems';
import Activity from './pages/Activity';
import Profile from './pages/Profile';

const NotFound = () => (
    <div className="pt-32 px-6 text-center">
        <div className="glass-card max-w-md mx-auto p-16">
            <div className="text-6xl mb-6">🔍</div>
            <h1 className="text-4xl font-black mb-3">404</h1>
            <p className="text-lavender/50 mb-8">Page not found. It might be lost too!</p>
            <a href="/" className="btn-primary px-8 py-3 text-xs font-black uppercase tracking-widest">Go Home</a>
        </div>
    </div>
);

const ProtectedRoute = ({ children }) => {
    const { token, loading } = useAuth();
    if (loading) return null;
    return token ? children : <Navigate to="/login" />;
};

const HomeRoute = () => {
    const { loading } = useAuth();
    if (loading) return null;
    return <Home />;
};

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen font-sans selection:bg-electric-blue/30">
                    <Navbar />
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/" element={<HomeRoute />} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/report-lost" element={<ProtectedRoute><ReportItem type="lost" /></ProtectedRoute>} />
                        <Route path="/report-found" element={<ProtectedRoute><ReportItem type="found" /></ProtectedRoute>} />
                        <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
                        <Route path="/my-items" element={<ProtectedRoute><MyItems /></ProtectedRoute>} />
                        <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
};

export default App;
