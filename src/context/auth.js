import axios from 'axios';

export const isAuthenticated = () => {
    const token = localStorage.getItem('authToken');
    return token !== null;
};

export const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

export const fetchToken = async (username, password) => {
    try {
        const response = await axios.post('http://localhost:8000/api/api-token-auth/', {
            username: username,
            password: password,
        });
        localStorage.setItem('authToken', response.data.token);
        return response.data.token;
    } catch (error) {
        // Customize error messages based on response
        if (error.response && error.response.status === 401) {
            throw new Error('Invalid credentials');
        }
        throw new Error('An error occurred. Please try again.');
    }
};
