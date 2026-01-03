import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import { useAuthStore } from '@/stores/authStore'
import { Menu, X } from 'lucide-react'

export function SiteHeader() {
  const location = useLocation()
  const { logout } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleLogout = () => {
    closeMobileMenu()
    logout()
  }

  const navLinks = [
    { path: '/', label: 'Dashboard' },
    { path: '/1k', label: '$1K Usage' },
    { path: '/pl', label: 'P&L', isActive: () => isActive('/pl') || location.pathname.startsWith('/pl/') },
    { path: '/easy-learning', label: 'Easy Learning' },
  ]

  return (
    <>
      <header className="border-b border-primary/20 bg-card/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="text-xl font-bold text-primary iron-text-glow" onClick={closeMobileMenu}>
                PX1020
              </Link>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-2 md:gap-4">
                {navLinks.map((link) => (
                  <Link key={link.path} to={link.path}>
                    <Button
                      variant={(link.isActive ? link.isActive() : isActive(link.path)) ? 'default' : 'ghost'}
                      size="sm"
                      className="iron-border text-xs md:text-sm"
                    >
                      {link.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              {/* Desktop Logout */}
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="hidden md:flex iron-border"
              >
                Logout
              </Button>
              {/* Mobile Menu Button */}
              <Button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                variant="ghost"
                size="sm"
                className="md:hidden iron-border"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />
          {/* Menu Panel */}
          <div className="absolute inset-0 bg-card/95 backdrop-blur-md border-r border-primary/20">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-primary/20">
                <Link 
                  to="/" 
                  className="text-xl font-bold text-primary iron-text-glow"
                  onClick={closeMobileMenu}
                >
                  PX1020
                </Link>
                <Button
                  onClick={closeMobileMenu}
                  variant="ghost"
                  size="sm"
                  className="iron-border"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 flex flex-col gap-2 p-4">
                {navLinks.map((link) => (
                  <Link 
                    key={link.path} 
                    to={link.path}
                    onClick={closeMobileMenu}
                  >
                    <Button
                      variant={(link.isActive ? link.isActive() : isActive(link.path)) ? 'default' : 'ghost'}
                      size="lg"
                      className="w-full justify-start iron-border text-base"
                    >
                      {link.label}
                    </Button>
                  </Link>
                ))}
              </nav>

              {/* Logout Button */}
              <div className="p-4 border-t border-primary/20">
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="lg"
                  className="w-full iron-border"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
