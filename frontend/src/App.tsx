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
import { PLQuestions } from './pages/PLQuestions'
import { PLQuestionTest } from './pages/PLQuestionTest'
import { EasyLearning } from './pages/EasyLearning'

function App() {
  const { isAuthenticated, isLoading, verify } = useAuthStore()

  useEffect(() => {
    verify()
  }, [verify])

  // Don't render anything until verification is complete
  // This prevents bypassing authentication during the verify() call
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-pulse text-primary text-lg">Verifying authentication...</div>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      {!isAuthenticated ? (
        <LoginForm />
      ) : (
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/1k" element={<StoreData />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/pl" element={<PL />} />
            <Route path="/pl/:year/:period" element={<PLPeriodDetail />} />
            <Route path="/pl-questions" element={<PLQuestions />} />
            <Route path="/pl-questions/:id" element={<PLQuestionTest />} />
            <Route path="/easy-learning" element={<EasyLearning />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )}
    </BrowserRouter>
  )
}

export default App
