import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // ඔබගේ App component එක
import { AuthProvider } from './context/AuthContext'; // AuthProvider import කරන්න
import './index.css'; // Global CSS (if any)

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider> {/* AuthProvider එකෙන් App එක wrap කරනවා */}
      <App />
    </AuthProvider>
  </React.StrictMode>
);
