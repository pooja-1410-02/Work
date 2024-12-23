import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({ token: null, isSuperuser: false });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.get('http://localhost:8000/api/validate/', {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(response => {
                if (response.data.valid) {
                    setAuth({ token: token, isSuperuser: response.data.is_superuser });
                } else {
                    setAuth({ token: null, isSuperuser: false });
                }
            })
            .catch(() => {
                setAuth({ token: null, isSuperuser: false });
            });
        }
    }, []);

    const login = async (username, password) => {
        try {
            const response = await axios.post('http://localhost:8000/api/login/', { username, password });
            const token = response.data.token;
            localStorage.setItem('token', token);
            console.log("authcontext");
            console.log(localStorage);
            console.log("kkkkkkkk");
            setAuth({ token, isSuperuser: response.data.is_superuser });
        } catch (error) {
            alert('Login failed: ' + (error.response?.data?.message || 'Unknown error'));
        }
    };

    const logout = () => {
        setAuth({ token: null, isSuperuser: false });
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ auth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
