import { Link, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import { useAuthStore } from '@/stores/authStore'

export function SiteHeader() {
  const location = useLocation()
  const { logout } = useAuthStore()

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="border-b border-primary/20 bg-card/40 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold text-primary iron-text-glow">
              PX1020
            </Link>
            <nav className="flex items-center gap-2 md:gap-4">
              <Link to="/">
                <Button
                  variant={isActive('/') ? 'default' : 'ghost'}
                  size="sm"
                  className="iron-border text-xs md:text-sm"
                >
                  Dashboard
                </Button>
              </Link>
              <Link to="/store-data">
                <Button
                  variant={isActive('/store-data') ? 'default' : 'ghost'}
                  size="sm"
                  className="iron-border text-xs md:text-sm"
                >
                  $1K Usage
                </Button>
              </Link>
              <Link to="/pl">
                <Button
                  variant={isActive('/pl') || location.pathname.startsWith('/pl/') ? 'default' : 'ghost'}
                  size="sm"
                  className="iron-border text-xs md:text-sm"
                >
                  P&L
                </Button>
              </Link>
              <Link to="/easy-learning">
                <Button
                  variant={isActive('/easy-learning') ? 'default' : 'ghost'}
                  size="sm"
                  className="iron-border text-xs md:text-sm"
                >
                  Easy Learning
                </Button>
              </Link>
            </nav>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            className="iron-border"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
