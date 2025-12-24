import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  login: (password: string) => Promise<void>
  logout: () => void
  verify: () => Promise<void>
}

// PIN stored locally for frontend-only mode
const CORRECT_PIN = '123456'

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: false,

  login: async (pin: string) => {
    set({ isLoading: true, isAuthenticated: false })
    
    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (pin === CORRECT_PIN) {
      set({ isAuthenticated: true, isLoading: false })
    } else {
      set({ isLoading: false, isAuthenticated: false })
      throw new Error('Invalid PIN. Access denied.')
    }
  },

  logout: () => {
    set({ isAuthenticated: false })
  },

  verify: async () => {
    // In frontend-only mode, just check if user was previously authenticated
    // (persisted in session/localStorage could be added if needed)
    set({ isAuthenticated: false })
  },
}))
