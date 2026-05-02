import React, { createContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/api';

export const AuthContext = createContext();

const initialState = {
  isLoading: true,
  isSignout: false,
  user: null,
  token: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        isLoading: false,
        isSignout: false,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'SIGN_IN':
      return {
        isLoading: false,
        isSignout: false,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'SIGN_OUT':
      return {
        isLoading: false,
        isSignout: true,
        user: null,
        token: null,
      };
    case 'SIGN_UP':
      return {
        isLoading: false,
        isSignout: false,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        // Get stored token and user
        const [token, userString] = await Promise.all([
          AsyncStorage.getItem('authToken'),
          AsyncStorage.getItem('user'),
        ]);

        let user = null;
        if (userString) {
          try {
            user = JSON.parse(userString);
          } catch (e) {
            console.error('Failed to parse user from storage', e);
          }
        }

        console.log('Token restored:', !!token);
        console.log('User restored:', !!user);

        dispatch({
          type: 'RESTORE_TOKEN',
          payload: { token, user },
        });
      } catch (e) {
        console.error('Failed to restore session:', e);
        dispatch({
          type: 'RESTORE_TOKEN',
          payload: { token: null, user: null },
        });
      }
    };

    bootstrapAsync();
  }, []);

  const authContext = {
    state,
    signIn: async (username, password) => {
      try {
        const response = await apiClient.post('/auth/login', {
          username,
          password,
        });

        const { token, ...user } = response.data.data;

        await Promise.all([
          AsyncStorage.setItem('authToken', token),
          AsyncStorage.setItem('user', JSON.stringify(user)),
        ]);

        dispatch({
          type: 'SIGN_IN',
          payload: { token, user },
        });

        return { success: true, user };
      } catch (error) {
        console.error('Login error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Login failed',
        };
      }
    },
    signOut: async () => {
      try {
        await Promise.all([
          AsyncStorage.removeItem('authToken'),
          AsyncStorage.removeItem('user'),
        ]);
        dispatch({ type: 'SIGN_OUT' });
      } catch (error) {
        console.error('Sign out error:', error);
      }
    },
    signUp: async (userData) => {
      try {
        const response = await apiClient.post('/auth/register', userData);
        const { token, ...user } = response.data.data;

        await Promise.all([
          AsyncStorage.setItem('authToken', token),
          AsyncStorage.setItem('user', JSON.stringify(user)),
        ]);

        dispatch({
          type: 'SIGN_UP',
          payload: { token, user },
        });

        return { success: true };
      } catch (error) {
        console.error('Sign up error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Sign up failed',
        };
      }
    },
    updateUser: async (userData) => {
      try {
        const currentUserString = await AsyncStorage.getItem('user');
        const currentUser = currentUserString ? JSON.parse(currentUserString) : {};
        const updatedUser = { ...currentUser, ...userData };
        
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        
        dispatch({
          type: 'UPDATE_USER',
          payload: userData,
        });
      } catch (error) {
        console.error('Update user state error:', error);
      }
    },
    forgotPassword: async (identifier) => {
      try {
        const response = await apiClient.post('/auth/request-otp', { identifier });
        return {
          success: response.data.success,
          message: response.data.message,
        };
      } catch (error) {
        console.error('Forgot password error:', error);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to send reset request',
        };
      }
    },
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};
