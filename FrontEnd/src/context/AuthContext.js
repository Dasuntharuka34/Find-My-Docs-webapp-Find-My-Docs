import React, { createContext, useState, useEffect } from 'react';

// Authentication context එක නිර්මාණය කරනවා
export const AuthContext = createContext();

// AuthProvider component එක (මුළු App එකම wrap කරන්න)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // User object (e.g., { id, name, email, role })
  const [token, setToken] = useState(null); // JWT token
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Login status

  // Initial load එකේදී localStorage එකේ token එකක් තියෙනවද කියලා check කරනවා
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Login function එක
  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      const { token, user: userData } = data; // Backend එකෙන් token සහ user object එක එනවා

      // State update කරනවා
      setToken(token);
      setUser(userData);
      setIsLoggedIn(true);

      // Token සහ user data localStorage එකේ save කරනවා
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      return { success: true, message: 'Login successful' };
    } catch (error) {
      console.error('Login error:', error);
      setIsLoggedIn(false);
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error; // Error එක නැවත throw කරනවා Frontend එකේ handle කිරීමට
    }
  };

  // Logout function එක
  const logout = () => {
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('token'); // localStorage එකෙන් token එක ඉවත් කරනවා
    localStorage.removeItem('user'); // localStorage එකෙන් user data ඉවත් කරනවා
    // ඔබට logout වූ පසු redirect වීමට logic add කළ හැක.
    // window.location.href = '/login'; // සම්පූර්ණ reload එකක් සඳහා
  };

  // Context value එක සපයනවා
  const authContextValue = {
    user,
    token,
    isLoggedIn,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
