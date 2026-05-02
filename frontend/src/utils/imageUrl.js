export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  // VITE_API_URL is typically /api or http://localhost:5000/api
  // We want to strip the /api part to get the base URL for static assets like /uploads
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiUrl.replace(/\/api\/?$/, '');
  
  // In dev, baseUrl might become empty string if VITE_API_URL is '/api'.
  // This is completely fine since '/uploads/...' will hit the current origin.
  return `${baseUrl}${path}`;
};
