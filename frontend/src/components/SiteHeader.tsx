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
              PANDA EXPRESS
            </Link>
            <nav className="hidden md:flex items-center gap-4">
              <Link to="/">
                <Button
                  variant={isActive('/') ? 'default' : 'ghost'}
                  size="sm"
                  className="iron-border"
                >
                  Dashboard
                </Button>
              </Link>
              <Link to="/store-data">
                <Button
                  variant={isActive('/store-data') ? 'default' : 'ghost'}
                  size="sm"
                  className="iron-border"
                >
                  Store Data
                </Button>
              </Link>
              <Link to="/reports">
                <Button
                  variant={isActive('/reports') ? 'default' : 'ghost'}
                  size="sm"
                  className="iron-border"
                >
                  Reports
                </Button>
              </Link>
              <Link to="/pl">
                <Button
                  variant={isActive('/pl') || location.pathname.startsWith('/pl/') ? 'default' : 'ghost'}
                  size="sm"
                  className="iron-border"
                >
                  P&L
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
