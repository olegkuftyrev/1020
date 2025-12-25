import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Button } from './ui/button'

export function LoginForm() {
  const [pin, setPin] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState('')
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus()
  }, [])

  const handlePinChange = (index: number, value: string) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(0, 1)
    
    if (digit) {
      const newPin = [...pin]
      newPin[index] = digit
      setPin(newPin)
      setError('') // Clear error when user starts typing
      
      // Move to next input if not last - multiple strategies for bulletproof focus
      if (index < 5) {
        // Strategy 1: Immediate attempt
        const nextInput = inputRefs.current[index + 1]
        if (nextInput) {
          nextInput.focus()
          // Strategy 2: If immediate didn't work, try after a tiny delay
          setTimeout(() => {
            if (document.activeElement !== nextInput) {
              nextInput.focus()
              // Strategy 3: Last resort - try again after animation frame
              requestAnimationFrame(() => {
                nextInput.focus()
              })
            }
          }, 0)
        }
      }
    } else {
      // Handle backspace/delete
      const newPin = [...pin]
      newPin[index] = ''
      setPin(newPin)
      
      // Move to previous input if current is empty
      if (index > 0) {
        const prevInput = inputRefs.current[index - 1]
        if (prevInput) {
          prevInput.focus()
          setTimeout(() => {
            if (document.activeElement !== prevInput) {
              prevInput.focus()
            }
          }, 0)
        }
      }
    }
  }

  const handleInput = (index: number, e: React.FormEvent<HTMLInputElement>) => {
    const target = e.currentTarget
    const value = target.value.replace(/\D/g, '').slice(0, 1)
    
    if (value) {
      const newPin = [...pin]
      newPin[index] = value
      setPin(newPin)
      setError('')
      
      // Immediately focus next input on input event (more reliable than onChange)
      if (index < 5) {
        const nextInput = inputRefs.current[index + 1]
        if (nextInput) {
          // Multiple attempts to ensure focus works
          nextInput.focus()
          setTimeout(() => nextInput.focus(), 0)
          requestAnimationFrame(() => nextInput.focus())
        }
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
      const newPin = [...pin]
      newPin[index - 1] = ''
      setPin(newPin)
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newPin = [...pin]
    pastedData.split('').forEach((digit, i) => {
      if (i < 6) {
        newPin[i] = digit
      }
    })
    setPin(newPin)
    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const pinString = pin.join('')
    
    if (!pinString) {
      setError('PIN is required')
      return
    }

    if (pinString.length !== 6) {
      setError('PIN must be 6 digits')
      return
    }

    try {
      await login(pinString)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid PIN. Access denied.')
      setPin(Array(6).fill(''))
      inputRefs.current[0]?.focus()
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Snap to grid (50px grid size)
    const gridSize = 50
    const snappedX = Math.floor(x / gridSize) * gridSize
    const snappedY = Math.floor(y / gridSize) * gridSize
    
    e.currentTarget.style.setProperty('--mouse-x-offset', `${snappedX}px`)
    e.currentTarget.style.setProperty('--mouse-y-offset', `${snappedY}px`)
  }
  
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    // Reset on mouse leave
    e.currentTarget.style.setProperty('--mouse-x-offset', '0')
    e.currentTarget.style.setProperty('--mouse-y-offset', '0')
  }

  return (
    <div 
      className={`min-h-screen flex items-center justify-center iron-bg-pattern p-4 transition-all duration-500 ${
        error 
          ? 'bg-red-950/20' 
          : ''
      }`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="w-full max-w-md">
        <div className={`iron-border rounded-lg p-8 bg-card/50 backdrop-blur-sm iron-card-hover transition-all duration-500 ${
          error 
            ? 'border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.4)] bg-red-950/30' 
            : ''
        }`}>
              <div className="text-center mb-8">
                <h1 className={`text-4xl font-bold mb-2 transition-colors duration-500 ${
                  error ? 'text-red-400 iron-text-glow' : 'text-primary iron-text-glow'
                }`}>
                  PANDA EXPRESS
                </h1>
                <h2 className={`text-2xl font-semibold mb-4 transition-colors duration-500 ${
                  error ? 'text-red-300' : 'text-foreground'
                }`}>
                  DASHBOARD ACCESS
                </h2>
                <div className={`h-1 w-24 mx-auto transition-all duration-500 ${
                  error ? 'bg-red-500 iron-glow' : 'bg-primary iron-glow'
                }`}></div>
              </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 group relative">
              <label 
                className="text-sm font-medium text-foreground block text-center transition-all duration-300 group-hover:text-primary group-hover:iron-text-glow"
              >
                PIN CODE
              </label>
              
              {/* Unified square inputs for all devices */}
              <div className="flex justify-center gap-3">
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit ? 'X' : ''}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onInput={(e) => handleInput(index, e)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={isLoading}
                    className={`w-14 h-14 text-center text-2xl font-mono font-bold bg-secondary/50 border-2 text-foreground rounded-lg transition-all duration-300 hover:iron-glow focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed tracking-wider ${
                      error 
                        ? 'border-red-500/60 hover:border-red-400 hover:bg-red-950/20 focus-visible:ring-red-500 focus-visible:border-red-400' 
                        : 'border-primary/30 hover:border-primary/60 hover:bg-secondary/70 focus-visible:ring-primary focus-visible:border-primary'
                    }`}
                    style={{ letterSpacing: '0.1em' }}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/20 border border-destructive/50 text-destructive text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full font-semibold py-6 text-lg transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] ${
                    error
                      ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)]'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 iron-glow hover:shadow-[0_0_30px_rgba(0,200,255,0.5)]'
                  }`}
                >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-pulse">●</span>
                  AUTHENTICATING...
                </span>
              ) : (
                'AUTHENTICATE'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Top Secret Classified
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

