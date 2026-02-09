import React, { createContext, useContext, useReducer, useEffect, useMemo, ReactNode } from 'react';
import { AuthState, AuthAction, User } from '@/types/auth';
import * as authService from '@/services/authService';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
    case 'RESTORE_TOKEN':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isLoading: false,
        isAuthenticated: true,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    async function restoreToken() {
      try {
        const { accessToken, refreshToken, user } = await authService.getStoredTokens();

        if (accessToken && refreshToken && user) {
          console.log('restoreToken - found in storage')
          dispatch({
            type: 'RESTORE_TOKEN',
            payload: { user, accessToken, refreshToken },
          });
        } else {
          console.log('restoreToken - NOT found in storage')
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch {
        console.log('restoreToken - exception')
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }

    restoreToken();
  }, []);

  const authActions = useMemo(
    () => ({
      login: async (username: string, password: string) => {
        const response = await authService.login(username, password);
        dispatch({
          type: 'LOGIN',
          payload: {
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          },
        });
      },
      logout: async () => {
        await authService.logout();
        dispatch({ type: 'LOGOUT' });
      },
    }),
    []
  );

  const value = useMemo(
    () => ({
      ...state,
      ...authActions,
    }),
    [state, authActions]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
