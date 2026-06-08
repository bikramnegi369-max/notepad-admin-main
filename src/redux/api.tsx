import axios from 'axios';

export const apiUrl = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
});

// Automatically add the Authorization header if a token exists
apiUrl.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Handle global errors, such as session expiration
apiUrl.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login if the token is invalid/expired
      localStorage.clear();
      window.location.href = '/#/login';
    }
    return Promise.reject(error);
  },
);
