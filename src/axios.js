import axios from 'axios';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

const instance = axios.create({
    baseURL: 'http://localhost:8000/api/', // Adjust this URL to match your backend
});

export default instance;
