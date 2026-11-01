import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')));

  const save = (data) => {
    localStorage.setItem('token', data.token);
    setUser(data);
    return data;
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api.get('/auth/me').then((r) => setUser(r.data)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onExpired = () => { setUser(null); toast.error('Your session expired. Please sign in again'); };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = async (email, password) => save((await api.post('/auth/login', { email, password })).data);
  const register = async (name, email, password) => save((await api.post('/auth/register', { name, email, password })).data);
  const updateProfile = async (body) => save((await api.put('/auth/profile', body)).data);
  const saveAddress = async (addr) => save((await (addr._id ? api.put(`/auth/addresses/${addr._id}`, addr) : api.post('/auth/addresses', addr))).data);
  const removeAddress = async (id) => save((await api.delete(`/auth/addresses/${id}`)).data);
  const resetPassword = async (token, password) => save((await api.post(`/auth/reset-password/${token}`, { password })).data);
  const logout = () => { localStorage.removeItem('token'); setUser(null); };

  const toggleWishlist = useCallback(async (productId) => {
    const { data } = await api.post(`/wishlist/${productId}`);
    setUser((u) => ({ ...u, wishlist: data.wishlist }));
    return data.added;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, saveAddress, removeAddress, resetPassword, toggleWishlist }}>
      {children}
    </AuthContext.Provider>
  );
}
