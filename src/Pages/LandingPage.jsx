import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LandingPage.css'

const MOCK_USERS = [
  { email: 'admin@rent.com', password: '1234', role: 'admin', name: 'Admin' },
  { email: 'renter@rent.com', password: '1234', role: 'renter', name: 'Juan' },
]

export default function LandingPage() {
  const [tab, setTab] = useState('login')
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  function handleLogin(e) {
    e.preventDefault()
    const user = MOCK_USERS.find(
      u => u.email === loginData.email && u.password === loginData.password
    )
    if (!user) { setError('Invalid email or password.'); return }
    setError('')
    localStorage.setItem('user', JSON.stringify(user))
    if (user.role === 'admin') navigate('/admin/dashboard')
    else navigate('/renter/dashboard')
  }

  function handleRegister(e) {
    e.preventDefault()
    if (!registerData.name || !registerData.email || !registerData.password) {
      setError('Please fill in all fields.'); return
    }
    setError('')
    setSuccess('Account created! You can now sign in.')
    setTimeout(() => { setTab('login'); setSuccess('') }, 1800)
  }

  return (
    <div className="lp-page">
      <div className="lp-card">

        <div className="lp-logo">
          <div className="lp-logo-text">RentAPlace</div>
          <div className="lp-logo-sub">Find your perfect place to stay</div>
        </div>

        <div className="lp-tabs">
          <button
            className={tab === 'login' ? 'active' : ''}
            onClick={() => { setTab('login'); setError('') }}
          >
            Sign in
          </button>
          <button
            className={tab === 'register' ? 'active' : ''}
            onClick={() => { setTab('register'); setError('') }}
          >
            Register
          </button>
        </div>

        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <label>Email address</label>
            <input
              type="email"
              placeholder="you@email.com"
              value={loginData.email}
              onChange={e => setLoginData({ ...loginData, email: e.target.value })}
            />
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={loginData.password}
              onChange={e => setLoginData({ ...loginData, password: e.target.value })}
            />
            {error && <p className="lp-error">{error}</p>}
            <button type="submit" className="lp-submit">Sign in</button>
            <p className="lp-hint">Demo: admin@rent.com / renter@rent.com — password: 1234</p>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegister}>
            <label>Full name</label>
            <input
              type="text"
              placeholder="Juan dela Cruz"
              value={registerData.name}
              onChange={e => setRegisterData({ ...registerData, name: e.target.value })}
            />
            <label>Email address</label>
            <input
              type="email"
              placeholder="you@email.com"
              value={registerData.email}
              onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
            />
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={registerData.password}
              onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
            />
            {error && <p className="lp-error">{error}</p>}
            {success && <p className="lp-success">{success}</p>}
            <button type="submit" className="lp-submit">Create account</button>
          </form>
        )}

      </div>
    </div>
  )
}