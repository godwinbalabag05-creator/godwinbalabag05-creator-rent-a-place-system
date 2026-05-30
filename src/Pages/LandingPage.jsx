import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './LandingPage.css'
import { push } from 'firebase/database'

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
  const [suspended,      setSuspended]      = useState(false)
  const [suspendedEmail, setSuspendedEmail] = useState('')
  const [appealMessage,  setAppealMessage]  = useState('')
  const [appealSent,     setAppealSent]     = useState(false)
  const [appealSending,  setAppealSending]  = useState(false)

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
      setSuspended(true)
      setSuspendedEmail(loginData.email)
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

  async function handleAppeal(e) {
  e.preventDefault()
  if (!appealMessage.trim()) return

  setAppealSending(true)
  try {
    await push(ref(db, 'appeals'), {
      email:     suspendedEmail,
      message:   appealMessage,
      status:    'pending',
      createdAt: new Date().toISOString(),
    })
    setAppealSent(true)
  } catch (err) {
    console.log(err)
    alert('Failed to submit appeal. Please try again.')
  }
  setAppealSending(false)
}

if (suspended) {
  return (
    <div className="lp-page">
      <div className="lp-card">

        {appealSent ? (
          <>
            <div className="lp-susp-icon">✅</div>
            <h2 className="lp-susp-title">Appeal submitted!</h2>
            <p className="lp-susp-sub">
              Your appeal has been sent to the admin. Please wait for their response.
            </p>

            <button
              className="lp-submit"
              onClick={() => {
                setSuspended(false)
                setAppealSent(false)
                setAppealMessage('')
              }}
            >
              ← Back to login
            </button>
          </>
        ) : (
          <>
            <div className="lp-susp-icon">🔒</div>
            <h2 className="lp-susp-title">Account suspended</h2>
            <p className="lp-susp-sub">
              Your account has been suspended. You may submit an appeal to the admin for review.
            </p>

            <form onSubmit={handleAppeal}>
              <label>Your email address</label>

              <input
                type="email"
                value={suspendedEmail}
                disabled
              />

              <label>Reason for appeal</label>

              <textarea
                placeholder="Explain why you think your account should be restored..."
                value={appealMessage}
                onChange={e => setAppealMessage(e.target.value)}
                rows={4}
                style={{ borderRadius: '12px', resize: 'vertical' }}
              />

              <button
                type="submit"
                className="lp-submit"
                disabled={appealSending || !appealMessage.trim()}
              >
                {appealSending ? 'Submitting...' : 'Submit appeal'}
              </button>
            </form>

            <button
              className="lp-susp-back"
              onClick={() => setSuspended(false)}
            >
              ← Back to login
            </button>

            <p className="lp-hint">
              The admin will review your appeal and respond accordingly.
            </p>
          </>
        )}

      </div>
    </div>
  )
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