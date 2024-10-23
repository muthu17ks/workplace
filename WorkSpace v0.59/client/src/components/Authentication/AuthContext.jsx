import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const isTokenExpired = (token) => {
        try {
            const decodedToken = jwtDecode(token);
            return decodedToken.exp * 1000 < Date.now();
        } catch (error) {
            console.error('Invalid token:', error);
            return true;
        }
    };

    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        const token = localStorage.getItem('token');
        return token ? !isTokenExpired(token) : false;
    });

    const [user, setUser] = useState(null);

    const login = (token) => {
        setIsAuthenticated(true);
        localStorage.setItem('token', token);
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('token');
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            if (isTokenExpired(token)) {
                logout();
            } else {
                setIsAuthenticated(true);
                setUser(jwtDecode(token));
            }
        }
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
