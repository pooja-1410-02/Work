import axios from 'axios';

// Create an Axios instance with a base URL
const client = axios.create({
  baseURL: "http://localhost:8000",
});

// Function to handle user login
export const login = async (username, password) => {
  try {
    // Post credentials to the login endpoint
    const response = await client.post('/api/api/token/', { username, password });
    
    // Log the entire response for debugging
    console.log("Login Response:", response);

    // Check if the response status is 200 (OK)
    if (response.status === 200) {
      // Save token to local storage
      localStorage.setItem('authToken', response.data.access);
      console.log("Token stored:", response.data.access); // Log the stored token
    }

    return response.data;
  } catch (error) {
    // Log error for debugging and throw a custom error message
    console.error("Login Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Login failed');
  }
};

// Function to handle user registration
export const register = async (email, username, password) => {
  try {
    // Post registration details to the register endpoint
    const response = await client.post('/api/register/', { email, username, password });
    return response.data;
  } catch (error) {
    // Log error for debugging and throw a custom error message
    console.error("Registration Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Registration failed');
  }
};

// Add an Axios request interceptor to include the token in requests
client.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    // Add Authorization header with Bearer token
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Optionally, add an Axios response interceptor to handle token expiration or other responses
client.interceptors.response.use(response => {
  // Return the response as is
  return response;
}, error => {
  // Handle responses with status codes like 401 Unauthorized or 403 Forbidden
  if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    // Remove invalid token from local storage
    localStorage.removeItem('authToken');
  }
  return Promise.reject(error);
});
