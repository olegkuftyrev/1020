import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { LoginForm } from './components/LoginForm'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { StoreData } from './pages/StoreData'
import { Reports } from './pages/Reports'
import { PL } from './pages/PL'
import { PLPeriodDetail } from './pages/PLPeriodDetail'

function App() {
  const { isAuthenticated, verify } = useAuthStore()

  useEffect(() => {
    verify()
  }, [verify])

  return (
    <BrowserRouter>
      {!isAuthenticated ? (
        <LoginForm />
      ) : (
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/store-data" element={<StoreData />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/pl" element={<PL />} />
            <Route path="/pl/:year/:period" element={<PLPeriodDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )}
    </BrowserRouter>
  )
}

export default App
