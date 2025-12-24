import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import { LoginForm } from './components/LoginForm'
import { Button } from './components/ui/button'

function Dashboard() {
  const { logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-background iron-bg-pattern">
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-4 text-primary iron-text-glow">
              PANDA EXPRESS DASHBOARD
            </h1>
            <div className="h-1 w-32 bg-primary iron-glow mb-4"></div>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="iron-border text-foreground hover:bg-secondary"
          >
            LOGOUT
          </Button>
        </div>

        <div className="iron-border rounded-lg p-8 bg-card/50 backdrop-blur-sm">
          <p className="text-muted-foreground text-lg">
            Store dashboard for internal use
          </p>
          <p className="text-foreground mt-4">
            Welcome to the dashboard. Your data will appear here.
          </p>
        </div>
      </div>
    </div>
  )
}

function App() {
  const { isAuthenticated, verify } = useAuthStore()

  useEffect(() => {
    verify()
  }, [verify])

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return <Dashboard />
}

export default App
