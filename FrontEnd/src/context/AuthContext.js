import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        // --- FIX START: Ensure parsedUser is an object before accessing properties ---
        if (typeof parsedUser === 'object' && parsedUser !== null) {
          // If profilePicture is missing or null, set it to a default (null or a default image path)
          if (!parsedUser.profilePicture) {
            parsedUser.profilePicture = null; // Or a default image URL if you have one
          }
          setUser(parsedUser);
          setIsLoggedIn(true);
        } else {
          // If localStorage contains non-object data (like a plain string '123'), clear it
          console.warn("Invalid user data found in localStorage. Clearing...");
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setIsLoggedIn(false);
        }
        // --- FIX END ---
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Login function
  const login = async (fetchedToken, fetchedUser) => {
    setToken(fetchedToken);
    // --- FIX START: Ensure fetchedUser is an object before setting properties ---
    if (typeof fetchedUser === 'object' && fetchedUser !== null) {
      if (!fetchedUser.profilePicture) {
        fetchedUser.profilePicture = null; // Or default image
      }
      setUser(fetchedUser);
      setIsLoggedIn(true);
      localStorage.setItem('token', fetchedToken);
      localStorage.setItem('user', JSON.stringify(fetchedUser));
    } else {
      console.error("Login received non-object user data:", fetchedUser);
      // Fallback: Clear any potentially corrupt data
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw new Error("Invalid user data received from login. Please try again."); // Re-throw to handle in LoginPage
    }
    // --- FIX END ---
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Function to update user data in context and localStorage
  const updateUser = (updatedUserData) => {
    setUser(prevUser => {
      // Ensure prevUser is an object before spreading its properties
      const currentPrevUser = (typeof prevUser === 'object' && prevUser !== null) ? prevUser : {};
      
      const newUserState = {
        ...currentPrevUser, // Keep existing fields not explicitly updated
        ...updatedUserData // Overlay with new data from backend response
      };
      
      // If profilePicture in updatedUserData is explicitly null (e.g., user removed it)
      // or if it's not provided in updatedUserData, but exists in prevUser, keep prevUser's picture.
      if (updatedUserData.profilePicture === undefined && currentPrevUser.profilePicture) {
         newUserState.profilePicture = currentPrevUser.profilePicture;
      }
      return newUserState;
    });

    const currentLocalStorageUser = JSON.parse(localStorage.getItem('user'));
    // Ensure currentLocalStorageUser is an object before spreading its properties
    const parsedLocalStorageUser = (typeof currentLocalStorageUser === 'object' && currentLocalStorageUser !== null) ? currentLocalStorageUser : {};

    const newLocalStorageUser = {
        ...parsedLocalStorageUser,
        ...updatedUserData
    };
    if (updatedUserData.profilePicture === undefined && parsedLocalStorageUser.profilePicture) {
        newLocalStorageUser.profilePicture = parsedLocalStorageUser.profilePicture;
    }
    localStorage.setItem('user', JSON.stringify(newLocalStorageUser));
  };

  const authContextValue = {
    user,
    token,
    isLoggedIn,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
