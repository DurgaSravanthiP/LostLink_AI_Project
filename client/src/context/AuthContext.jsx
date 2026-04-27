import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // On app startup, validate any stored token against the server
    useEffect(() => {
        const validateSession = async () => {
            const storedToken = localStorage.getItem('token');
            if (!storedToken) {
                // No stored session — start fresh (logged out)
                setLoading(false);
                return;
            }
            try {
                // Set header and verify token by calling the profile endpoint
                axios.defaults.headers.common['x-auth-token'] = storedToken;
                const res = await axios.get('http://localhost:5000/api/auth/profile');
                // Token is valid — restore the session
                setToken(storedToken);
                setUser(res.data);
                localStorage.setItem('user', JSON.stringify(res.data));
                localStorage.setItem('userName', res.data.name);
            } catch (err) {
                // Token is invalid / expired / server unreachable — clear stale session
                console.warn('Stored session is invalid, logging out.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('userName');
                delete axios.defaults.headers.common['x-auth-token'];
                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        validateSession();
    }, []);

    const login = async (email, password) => {
        const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('userName', res.data.user.name);
        axios.defaults.headers.common['x-auth-token'] = res.data.token;
    };

    const signup = async (userData) => {
        const res = await axios.post('http://localhost:5000/api/auth/signup', userData);
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('userName', res.data.user.name);
        axios.defaults.headers.common['x-auth-token'] = res.data.token;
    };

    const updateProfile = async (profileData) => {
        const res = await axios.put('http://localhost:5000/api/auth/profile', profileData);
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        localStorage.setItem('userName', res.data.name);
        return res.data;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userName');
        delete axios.defaults.headers.common['x-auth-token'];
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, signup, updateProfile, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
