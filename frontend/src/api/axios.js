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

// Globally handle expired/invalid sessions: clear the token, notify the app
// (Navbar etc. listen for `authChange`) and bounce to the login screen.
// We skip the redirect for the auth endpoints so a wrong password on the login
// screen surfaces its error instead of triggering a reload loop.
const responseErrorInterceptor = (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh');
    if (status === 401 && !isAuthEndpoint) {
        clearAuthToken();
        window.dispatchEvent(new Event('authChange'));
        if (window.location.pathname !== '/login') {
            window.location.assign('/login');
        }
    }
    return Promise.reject(error);
};

api.interceptors.response.use((r) => r, responseErrorInterceptor);
iotApi.interceptors.response.use((r) => r, responseErrorInterceptor);

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
