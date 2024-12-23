import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ItemList from './components/ItemList';
import PLOList from './components/PLOList';
import ProcessorList from './components/ProcessorList';
import Dashboard from './components/Dashboard';
import ProfilePage from './components/ProfilePage';
import UserAvatar from './components/UserAvatar'; // Import UserAvatar component
import './App.css';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

const client = axios.create({
  baseURL: "http://127.0.0.1:8000"
});

const loginUser = async (credentials) => {
  try {
    const response = await client.post('/api/token/', credentials);
    const { access, refresh } = response.data;
    localStorage.setItem('authToken', access);
    localStorage.setItem('refreshToken', refresh);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.response?.data?.detail || 'Login failed' };
  }
};

const AuthForm = ({ type, onSubmit, toggleForm, successMessage, errorMessage, onInputChange }) => (
  <div className="auth-box">
    <form onSubmit={onSubmit} className="auth-form">
      <h2>{type === 'login' ? 'Log in' : 'Register'}</h2>
      <input
        type="text"
        placeholder="Username"
        name="username"
        onChange={onInputChange}
        required
      />
      <input
        type="password"
        placeholder="Password"
        name="password"
        onChange={onInputChange}
        required
      />
      {type === 'register' && (
        <input
          type="email"
          placeholder="Email"
          name="email"
          onChange={onInputChange}
          required
        />
      )}
      <button type="submit">{type === 'login' ? 'Log in' : 'Register'}</button>
    </form>
    <button className="toggle-btn" onClick={toggleForm}>
      {type === 'login' ? 'Register' : 'Log in'}
    </button>
    {successMessage && <div className="success-message">{successMessage}</div>}
    {errorMessage && <div className="error-message">{errorMessage}</div>}
  </div>
);

function App() {
  const [currentUser, setCurrentUser] = useState(false);
  const [registrationToggle, setRegistrationToggle] = useState(false);
  const [formData, setFormData] = useState({ email: '', username: '', password: '' });
  const [userDetails, setUserDetails] = useState(null);

  const fetchUserDetails = useCallback(async (username) => {
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await client.get('/api/users/', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const currentUserDetails = response.data.find(user => user.username === username);
      setUserDetails(currentUserDetails || null);
    } catch (error) {
      console.error('Error fetching user details:', error.response ? error.response.data : error);
      setUserDetails(null);
    }
  }, []);

  const handleLogin = async () => {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      try {
        const res = await client.get("/api/user/", {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        setFormData(prevData => ({ ...prevData, username: res.data.username }));
        await fetchUserDetails(res.data.username);
        setCurrentUser(true);
      } catch (error) {
        console.error('Error fetching user info:', error.response ? error.response.data : error);
        setCurrentUser(false);
        setUserDetails(null);
      }
    }
  };

  useEffect(() => {
    handleLogin(); // Fetch user details on initial load if the user is logged in
  }, [fetchUserDetails]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.error('No refresh token found.');
      return;
    }
    
    try {
      await axios.post(
        'http://127.0.0.1:8000/api/logout/',
        { refresh: refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      setCurrentUser(false);
      setUserDetails(null); // Clear user details on logout
    } catch (error) {
      console.error('Logout error:', error.response ? error.response.data : error.message);
    }
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    const result = await loginUser({ username: formData.username, password: formData.password });
    if (result.success) {
      await handleLogin(); // Fetch user details after login
      toast.success("Login successful!");
      setFormData(prevData => ({ ...prevData, password: '' }));
    } else {
      toast.error(result.message);
    }
  };

  const submitRegistration = async (event) => {
    event.preventDefault();
    try {
      await client.post("/api/register/", { email: formData.email, username: formData.username, password: formData.password });
      setRegistrationToggle(false);
      toast.success("Registration successful!");
      setFormData({ email: '', username: '', password: '' });
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed.';
      toast.error(message);
    }
  };

  const toggleForm = () => {
    setRegistrationToggle(!registrationToggle);
  };

  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <img 
            className="branding__logo" 
            src="https://one.int.sap/_static/1723770168074/images/logo.svg" 
            alt="SAP Logo" 
            aria-hidden="true" 
          />
          <h1>Build Tracker App</h1>
        </header>

        <main className="main-content">
          {currentUser ? (
            <>
              <nav className="app-nav">
                <ul className="nav-list">
                  <li className="nav-item"><Link to="/items" className="nav-link">Items</Link></li>
                  <li className="nav-item"><Link to="/plos" className="nav-link">PLOs</Link></li>
                  <li className="nav-item"><Link to="/processors" className="nav-link">Processors</Link></li>
                  <li className="nav-item"><Link to="/dashboard" className="nav-link">Dashboard</Link></li>
                  <li className="nav-item"><Link to="/profile" className="nav-link">Profile</Link></li>
                  <li className="nav-item">
                    <button onClick={handleLogout} className="logout-btn">Log out</button>
                  </li>
                </ul>
                <UserAvatar 
                  username={formData.username} 
                  onLogout={handleLogout} 
                />
              </nav>
              <Routes>
                <Route path="/items" element={<ItemList username={formData.username} userDetails={userDetails} />} />
                <Route path="/plos" element={<PLOList username={formData.username} userDetails={userDetails} />} />
                <Route path="/processors" element={<ProcessorList username={formData.username} userDetails={userDetails} />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<ProfilePage username={formData.username} userDetails={userDetails} />} />
                <Route path="/" element={<Navigate to="/items" />} />
              </Routes>
            </>
          ) : (
            <AuthForm
              type={registrationToggle ? 'register' : 'login'}
              onSubmit={registrationToggle ? submitRegistration : submitLogin}
              toggleForm={toggleForm}
              successMessage=""
              errorMessage=""
              onInputChange={handleInputChange}
            />
          )}
        </main>

        <footer className="app-footer">
          <p>&copy; 2024 Build Tracker App</p>
        </footer>
        
        {/* Toast container for notifications */}
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;
