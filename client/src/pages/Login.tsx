import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    })
    if (res.ok) {
      window.location.href = '/dashboard'
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.message || 'Login failed')
    }
  }

  return (
    <div className="container py-10">
      <div className="max-w-md mx-auto card p-6">
        <h1 className="text-xl font-semibold mb-4">Login</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button className="btn w-full" type="submit">Login</button>
        </form>
        <div className="text-sm mt-3">No account? <Link to="/signup" className="text-blue-600">Sign up</Link></div>
      </div>
    </div>
  )
}
