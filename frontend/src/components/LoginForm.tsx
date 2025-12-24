import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Button } from './ui/button'

export function LoginForm() {
  const [pin, setPin] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState('')
  const { login, isLoading } = useAuthStore()
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
      
      // Move to next input if not last
      if (index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    } else {
      // Handle backspace/delete
      const newPin = [...pin]
      newPin[index] = ''
      setPin(newPin)
      
      // Move to previous input if current is empty
      if (index > 0) {
        inputRefs.current[index - 1]?.focus()
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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid PIN. Access denied.')
      setPin(Array(6).fill(''))
      inputRefs.current[0]?.focus()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center iron-bg-pattern p-0 md:p-4">
      <div className="w-full max-w-md md:max-w-md w-full h-screen md:h-auto flex flex-col md:block">
        <div className="md:iron-border md:rounded-lg p-4 md:p-8 md:bg-card/50 md:backdrop-blur-sm md:iron-card-hover flex-1 flex flex-col justify-center md:block">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-primary iron-text-glow">
              PANDA EXPRESS
            </h1>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3 md:mb-4">
              DASHBOARD ACCESS
            </h2>
            <div className="h-1 w-24 bg-primary iron-glow mx-auto"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 flex-1 flex flex-col justify-center md:block">
            <div className="space-y-3 md:space-y-4 group relative">
              <label 
                className="text-sm font-medium text-foreground block text-center transition-all duration-300 md:group-hover:text-primary md:group-hover:iron-text-glow"
              >
                PIN CODE
              </label>
              
              {/* Mobile: Individual square inputs (minimal style) */}
              <div className="md:hidden flex justify-center gap-2">
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit ? '●' : ''}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isLoading}
                    className="w-12 h-12 text-center text-xl font-mono font-bold bg-transparent border-2 border-primary/30 text-foreground rounded transition-all duration-300 focus-visible:border-primary focus-visible:ring-0 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                ))}
              </div>
              
              {/* Desktop: Individual square inputs */}
              <div className="hidden md:flex justify-center gap-3">
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit ? 'X' : ''}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={isLoading}
                    className="w-14 h-14 text-center text-2xl font-mono font-bold bg-secondary/50 border-2 border-primary/30 text-foreground rounded-lg transition-all duration-300 hover:border-primary/60 hover:bg-secondary/70 hover:iron-glow focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary focus-visible:iron-glow disabled:opacity-50 disabled:cursor-not-allowed tracking-wider"
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
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 iron-glow font-semibold py-4 md:py-6 text-base md:text-lg transition-all duration-300 md:hover:scale-[1.02] md:hover:shadow-[0_0_30px_rgba(0,200,255,0.5)] active:scale-[0.98]"
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

          <div className="mt-4 md:mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Internal access only
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

