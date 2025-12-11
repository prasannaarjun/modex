import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors globally if needed
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // We can handle 401s here to logout, etc.
        if (error.response?.status === 401) {
            // dispatch logout or redirect
        }
        return Promise.reject(error);
    }
);
