import React from 'react';
import ReactDOM from 'react-dom/client'; // Import from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'; // Import BrowserRouter
import App from './App';
import { AuthProvider } from './context/AuthContext';

// Create a root element
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render your application
root.render(
  <Router> {/* Wrap your application with Router */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </Router>
);
