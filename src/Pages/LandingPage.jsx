import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './LandingPage.css'

import { db } from '../Firebase'
import { auth } from '../Firebase'

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth'

import {
  ref,
  set,
  get
} from 'firebase/database'

import { v4 as uuidv4 } from 'uuid'

export default function LandingPage() {
  const [searchParams] = useSearchParams()                          
  const wasSuspended = searchParams.get('suspended') === 'true'
  const [tab, setTab] = useState('login')

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: ''
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  // LOGIN FUNCTION
  async function handleLogin(e) {
    e.preventDefault()

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Firebase Auth Login
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginData.email,
        loginData.password
      )

      const firebaseUser = userCredential.user

      // Get user data from database
      const userRef = ref(db, `users/${firebaseUser.uid}`)
      const snapshot = await get(userRef)

      if (!snapshot.exists()) {
        setError('User data not found.')
        setLoading(false)
        return
      }

      const userData = snapshot.val()

      // ── ADD THIS CHECK ──
      if (userData.status === 'suspended') {
        setError('Your account has been suspended. Please contact the admin.')
        setLoading(false)
        return
      }
      // ── END OF CHECK ──

      // Save user locally
      localStorage.setItem('user', JSON.stringify(userData))

      setSuccess('Login successful!')

      console.log(userData.role);
      // Redirect based on role
      if (userData.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/renter/dashboard')
      }

    } catch (err) {
      console.log(err)

      if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.')
      } else {
        setError(err.message)
      }
    }

    setLoading(false)
  }

  // REGISTER FUNCTION
  async function handleRegister(e) {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (
      !registerData.name ||
      !registerData.email ||
      !registerData.password
    ) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)

    try {
      // Create Firebase Auth User
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registerData.email,
        registerData.password
      )

      const firebaseUser = userCredential.user

      // Generate custom UUID
      const customUID = uuidv4()

      // User object
      const userData = {
        UID: customUID,
        firebaseUID: firebaseUser.uid,
        name: registerData.name,
        email: registerData.email,
        role: 'renter',
        status: 'active',
        createdAt: new Date().toISOString()
      }

      // Save to Realtime Database
      await set(
        ref(db, `users/${firebaseUser.uid}`),
        userData
      )

      setSuccess('Account created successfully!')

      // Clear form
      setRegisterData({
        name: '',
        email: '',
        password: ''
      })

      // Redirect to login
      setTimeout(() => {
        setTab('login')
        setSuccess('')
      }, 2000)

    } catch (err) {
      console.log(err)

      if (err.code === 'auth/email-already-in-use') {
        setError('Email already exists.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.')
      } else {
        setError(err.message)
      }
    }

    setLoading(false)
  }

  return (
    <div className="lp-page">
      <div className="lp-card">

        <div className="lp-logo">
          <div className="lp-logo-icon">
            🏠
          </div>
          <div className="lp-logo-text">
            RentAPlace
          </div>

          <div className="lp-logo-sub">
            Find your perfect place to stay
          </div>
        </div>

        <div className="lp-tabs">
          <button
            className={tab === 'login' ? 'active' : ''}
            onClick={() => {
              setTab('login')
              setError('')
              setSuccess('')
            }}
          >
            Sign in
          </button>

          <button
            className={tab === 'register' ? 'active' : ''}
            onClick={() => {
              setTab('register')
              setError('')
              setSuccess('')
            }}
          >
            Register
          </button>
        </div>

        {/* LOGIN */}
        {tab === 'login' && (
          <form onSubmit={handleLogin}>

            {/* Suspension message */}
    {wasSuspended && (
      <p className="lp-error">
        Your account has been suspended. Please contact the admin.
      </p>
    )}
            <label>Email address</label>

            <input
              type="email"
              placeholder="you@email.com"
              value={loginData.email}
              onChange={(e) =>
                setLoginData({
                  ...loginData,
                  email: e.target.value
                })
              }
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="••••••••"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({
                  ...loginData,
                  password: e.target.value
                })
              }
            />

            {error && (
              <p className="lp-error">
                {error}
              </p>
            )}

            {success && (
              <p className="lp-success">
                {success}
              </p>
            )}

            <button
              type="submit"
              className="lp-submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

          </form>
        )}

        {/* REGISTER */}
        {tab === 'register' && (
          <form onSubmit={handleRegister}>

            <label>Full name</label>

            <input
              type="text"
              placeholder="Godwin Balabag"
              value={registerData.name}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  name: e.target.value
                })
              }
            />

            <label>Email address</label>

            <input
              type="email"
              placeholder="you@email.com"
              value={registerData.email}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  email: e.target.value
                })
              }
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="••••••••"
              value={registerData.password}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  password: e.target.value
                })
              }
            />

            {error && (
              <p className="lp-error">
                {error}
              </p>
            )}

            {success && (
              <p className="lp-success">
                {success}
              </p>
            )}

            <button
              type="submit"
              className="lp-submit"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

          </form>
        )}

      </div>
    </div>
  )
}