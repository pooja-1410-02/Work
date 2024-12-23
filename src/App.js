import React, { useState, useEffect, useCallback } from 'react';
import { Route, Routes, Link, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ItemList from './components/ItemList';
import PLOList from './components/PLOList';
import ProcessorList from './components/ProcessorList';
import Dashboard from './components/Dashboard';
import ProfilePage from './components/ProfilePage';
import ExcelUpload from './components/ExcelUpload'; // Import the new component
import Forecast from './components/Forecast'; // Import the new Forecast component
import PeakPlanning from './components/PeakPlanning'; // Import the new Peak Planning component
import './App.css';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

const client = axios.create({
  baseURL: "http://127.0.0.1:8000"
});

// Function to log in user
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

// Authentication form component
const AuthForm = ({ type, onSubmit, toggleForm, onInputChange }) => (
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
  </div>
);

function App() {
  const [currentUser, setCurrentUser] = useState(false);
  const [registrationToggle, setRegistrationToggle] = useState(false);
  const [formData, setFormData] = useState({ email: '', username: '', password: '' });
  const [userDetails, setUserDetails] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const navigate = useNavigate();

  // Fetch user details
  const fetchUserDetails = useCallback(async (username) => {
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await client.get('/api/users/', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const currentUserDetails = response.data.find(user => user.username === username);
      setUserDetails(currentUserDetails || null);
    } catch (error) {
      console.error('Error fetching user details:', error.response ? error.response.data : error);
      setUserDetails(null);
    }
  }, []);

  // Handle login process
  const handleLogin = async () => {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      try {
        const res = await client.get("/api/user/", {
          headers: { 'Authorization': `Bearer ${authToken}` }
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
    handleLogin();
    const timer = setInterval(() => {
      const now = new Date();
      const utcHours = String(now.getUTCHours()).padStart(2, '0');
      const utcMinutes = String(now.getUTCMinutes()).padStart(2, '0');
      setCurrentTime(`${utcHours}:${utcMinutes}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchUserDetails]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  // Handle logout process
  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.error('No refresh token found.');
      return;
    }

    try {
      await client.post('/api/logout/', { refresh: refreshToken });
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      setCurrentUser(false);
      setUserDetails(null);
    } catch (error) {
      console.error('Logout error:', error.response ? error.response.data : error.message);
    }
  };

  // Submit login form
  const submitLogin = async (event) => {
    event.preventDefault();
    const result = await loginUser({ username: formData.username, password: formData.password });
    if (result.success) {
      await handleLogin();
      toast.success("Login successful!");
      setFormData(prevData => ({ ...prevData, password: '' }));
    } else {
      toast.error(result.message);
    }
  };

  // Submit registration form
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

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleLogoutClick = async () => {
    await handleLogout();
    navigate('/');
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <img 
          className="branding__logo" 
          src="https://one.int.sap/_static/1723770168074/images/logo.svg" 
          alt="SAP Logo" 
          aria-hidden="true" 
        />
        <h1>System Build Tracker</h1>
        <div className="header-time">{currentTime} UTC</div> 
      </header>

      <main className="main-content">
        {currentUser ? (
          <>
            <nav className="app-nav">
              <ul className="nav-list">
                <li className="nav-item"><Link to="/items" className="nav-link">Systems</Link></li>
                <li className="nav-item"><Link to="/plos" className="nav-link">PLOs</Link></li>
                <li className="nav-item"><Link to="/processors" className="nav-link">Processors</Link></li>
                <li className="nav-item"><Link to="/forecast" className="nav-link">Forecast</Link></li>
                <li className="nav-item"><Link to="/peak-planning" className="nav-link">Peak Planning</Link></li> {/* New link for Peak Planning */}
                {userDetails?.is_staff && (
                  <>
                    <li className="nav-item"><Link to="/dashboard" className="nav-link">Dashboard</Link></li>
                    <li className="nav-item"><Link to="/upload-excel" className="nav-link">Add Excel</Link></li>
                  </>
                )}
              </ul>
              <div className="nav-actions">
                <div className="user-icon" onClick={toggleDropdown}>
                  <img src="https://tse3.mm.bing.net/th?id=OIP.JttmcrrQ9_XqrY60bFEfgQHaHa&pid=Api" alt="User" />
                  {dropdownOpen && (
                    <div className="dropdown-menu">
                      <div className="dropdown-item" onClick={handleProfileClick}>
                        <img src="https://tse2.mm.bing.net/th?id=OIP.7wJNy02RTiC6zhIlyZrEnQHaHa&pid=Api" alt="Profile" />
                        <span>Profile</span>
                      </div>
                      <div className="dropdown-item" onClick={handleLogoutClick}>
                        <img src="https://www.pngitem.com/pimgs/m/45-455258_grey-logout-icon-png-transparent-png.png" alt="Logout" />
                        <span>Logout</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </nav>
            <Routes>
              <Route path="/items" element={<ItemList username={formData.username} userDetails={userDetails} />} />
              <Route path="/plos" element={<PLOList username={formData.username} userDetails={userDetails} />} />
              <Route path="/processors" element={<ProcessorList username={formData.username} userDetails={userDetails} />} />
              <Route path="/forecast" element={<Forecast username={formData.username} userDetails={userDetails}/>} />
              <Route path="/peak-planning" element={<PeakPlanning />} /> {/* New route for Peak Planning */}
              {userDetails?.is_staff && (
                <>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/upload-excel" element={<ExcelUpload />} />
                </>
              )}
              <Route path="/profile" element={<ProfilePage username={formData.username} userDetails={userDetails} />} />
              <Route path="/" element={<Navigate to="/items" />} />
            </Routes>
          </>
        ) : (
          <AuthForm
            type={registrationToggle ? 'register' : 'login'}
            onSubmit={registrationToggle ? submitRegistration : submitLogin}
            toggleForm={toggleForm}
            onInputChange={handleInputChange}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; DLM OPS 4 Cluster 1 System Build Tracker</p>
      </footer>
      
      <ToastContainer />
    </div>
  );
}

export default App;
