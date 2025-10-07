import { Route, Routes, Navigate, Link } from 'react-router-dom'
import Login from './Login'
import Signup from './Signup'
import Dashboard from './Dashboard'
import { useEffect, useState } from 'react'

export default function App() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Attempt to fetch session
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/me`, {
      credentials: 'include'
    }).then(async (r) => {
      if (r.ok) {
        const data = await r.json()
        setUser(data.user)
      }
    }).catch(() => {})
  }, [])

  return (
    <div>
      <nav className="w-full border-b border-slate-200 dark:border-slate-800">
        <div className="container flex items-center justify-between py-3">
          <Link to="/" className="font-semibold">Smart Energy</Link>
          <div className="space-x-4">
            {user ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <button className="btn" onClick={async () => {
                  await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/logout`, { method: 'POST', credentials: 'include' })
                  window.location.href = '/'
                }}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/signup">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  )
}
