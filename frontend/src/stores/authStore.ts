import { create } from 'zustand'
import axios from 'axios'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  login: (password: string) => Promise<void>
  logout: () => Promise<void>
  verify: () => Promise<void>
}

// Create axios instance with base config
// In production, use relative path (nginx will proxy)
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
})

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true, // Start with loading true to prevent flash of content

  login: async (password: string) => {
    set({ isLoading: true, isAuthenticated: false })
    
    try {
      const response = await api.post('/auth/login', { password })
      
      if (response.data.authenticated) {
        set({ isAuthenticated: true, isLoading: false })
        // Don't store in localStorage - it can be manipulated
      } else {
        set({ isLoading: false, isAuthenticated: false })
        throw new Error(response.data.error || 'Invalid password. Access denied.')
      }
    } catch (error: any) {
      set({ isLoading: false, isAuthenticated: false })
      
      console.error('Login error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
      
      if (error.response?.status === 500) {
        throw new Error('Server error. Please check if backend is running.')
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      } else if (error.message) {
        throw error
      } else {
        throw new Error('Authentication failed. Please try again.')
      }
    }
  },

  logout: async () => {
    try {
      // Call backend to clear session
      await api.post('/auth/logout')
    } catch (error) {
      // Even if logout fails, clear local state
      console.error('Logout error:', error)
    } finally {
      set({ isAuthenticated: false, isLoading: false })
    }
  },

  verify: async () => {
    set({ isLoading: true })
    try {
      const response = await api.get('/auth/verify')
      
      // Only trust the server response - never rely on localStorage
      if (response.data.authenticated === true) {
        set({ isAuthenticated: true, isLoading: false })
      } else {
        set({ isAuthenticated: false, isLoading: false })
      }
    } catch (error: any) {
      // If verify fails, user is not authenticated
      // This is critical for security - fail closed
      set({ isAuthenticated: false, isLoading: false })
      console.error('Verify failed:', error.response?.status, error.message)
    }
  },
}))
