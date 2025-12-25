import { create } from 'zustand'
import axios from 'axios'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  login: (password: string) => Promise<void>
  logout: () => void
  verify: () => Promise<void>
}

// Create axios instance with base config
// In production, use relative path (nginx will proxy)
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: false,

  login: async (password: string) => {
    set({ isLoading: true, isAuthenticated: false })
    
    try {
      const response = await api.post('/auth/login', { password })
      
      if (response.data.authenticated) {
        set({ isAuthenticated: true, isLoading: false })
        // Store auth token/session if needed in the future
        localStorage.setItem('isAuthenticated', 'true')
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

  logout: () => {
    set({ isAuthenticated: false })
    localStorage.removeItem('isAuthenticated')
  },

  verify: async () => {
    try {
      const response = await api.get('/auth/verify')
      
      if (response.data.authenticated) {
        set({ isAuthenticated: true })
        localStorage.setItem('isAuthenticated', 'true')
      } else {
        set({ isAuthenticated: false })
        localStorage.removeItem('isAuthenticated')
      }
    } catch (error: any) {
      // Silently fail on verify - user just needs to login
      set({ isAuthenticated: false })
      localStorage.removeItem('isAuthenticated')
      console.error('Verify failed:', error.response?.status, error.message)
    }
  },
}))
