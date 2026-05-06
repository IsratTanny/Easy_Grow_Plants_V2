import axios from 'axios';

// Django API Client
export const api = axios.create({
    baseURL: '/api', // Proxied by Vite
    headers: {
        'Content-Type': 'application/json',
    }
});

// Unified API Client (IoT and Main)
export const iotApi = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

const authInterceptor = (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};

api.interceptors.request.use(authInterceptor);
iotApi.interceptors.request.use(authInterceptor);

// Auth Helpers
export const setAuthToken = (access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
};

export const clearAuthToken = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('access_token');
}
