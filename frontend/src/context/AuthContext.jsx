import { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore auth state from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('chefai_token');
    const user = localStorage.getItem('chefai_user');

    if (token && user) {
      try {
        dispatch({
          type: 'LOGIN',
          payload: { token, user: JSON.parse(user) },
        });
        // Optionally refresh user data from server
        authService.getProfile().then((res) => {
          if (res.success) {
            dispatch({ type: 'UPDATE_USER', payload: res.data });
            localStorage.setItem('chefai_user', JSON.stringify(res.data));
          }
        }).catch(() => {
          // Token might be expired
          dispatch({ type: 'LOGOUT' });
          localStorage.removeItem('chefai_token');
          localStorage.removeItem('chefai_user');
        });
      } catch {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await authService.login(credentials);
      if (res.success) {
        localStorage.setItem('chefai_token', res.data.token);
        localStorage.setItem('chefai_user', JSON.stringify(res.data.user));
        dispatch({ type: 'LOGIN', payload: res.data });
        toast.success(res.message || 'Welcome back!');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, message };
    }
  };

  const register = async (data) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await authService.register(data);
      if (res.success) {
        localStorage.setItem('chefai_token', res.data.token);
        localStorage.setItem('chefai_user', JSON.stringify(res.data.user));
        dispatch({ type: 'LOGIN', payload: res.data });
        toast.success(res.message || 'Account created!');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('chefai_token');
    localStorage.removeItem('chefai_user');
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  const updateUser = (data) => {
    dispatch({ type: 'UPDATE_USER', payload: data });
    const updated = { ...state.user, ...data };
    localStorage.setItem('chefai_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
