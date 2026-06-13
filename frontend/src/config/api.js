const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api';

export const apiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export default API_BASE_URL;
