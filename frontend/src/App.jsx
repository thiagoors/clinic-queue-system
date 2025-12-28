import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login/Login'
import Totem from './pages/Totem/Totem'
import Reception from './pages/Reception/Reception'
import Sector from './pages/Sector/Sector'
import Display from './pages/Display/Display'
import Admin from './pages/Admin/Admin'

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/login" />
  }

  return children
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Totem />} />
      <Route path="/login" element={<Login />} />
      <Route path="/display" element={<Display />} />

      {/* Protected routes */}
      <Route
        path="/reception"
        element={
          <PrivateRoute roles={['RECEPTIONIST', 'ADMIN']}>
            <Reception />
          </PrivateRoute>
        }
      />
      <Route
        path="/sector"
        element={
          <PrivateRoute roles={['DOCTOR', 'ADMIN']}>
            <Sector />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute roles={['ADMIN']}>
            <Admin />
          </PrivateRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
