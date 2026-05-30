import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './ProfilePage.css'
import useAuthGuard from '../hooks/useAuthGuard'
import NotificationBell from '../components/NotificationBell'

import { db, auth } from '../Firebase'
import { ref, onValue, update } from 'firebase/database'

export default function ProfilePage() {
  useAuthGuard('renter')
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [email,   setEmail]   = useState('')
  const [role,    setRole]    = useState('')
  const [status,  setStatus]  = useState('')
  const [joined,  setJoined]  = useState('')
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState('')
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!user.firebaseUID) return

    const userRef = ref(db, `users/${user.firebaseUID}`)
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        setName(data.name   || '')
        setPhone(data.phone || '')
        setEmail(data.email || '')
        setRole(data.role   || 'renter')
        setStatus(data.status || 'active')
        setJoined(data.createdAt
          ? new Date(data.createdAt).toLocaleDateString('en-PH', {
              month: 'long', day: 'numeric', year: 'numeric'
            })
          : 'N/A'
        )
      }
    })
    return () => unsubscribe()
  }, [])

  function handleLogout() {
    localStorage.removeItem('user')
    auth.signOut()
    navigate('/')
  }

  function getInitials(name) {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Name cannot be empty.'); return }
    setError('')
    setSaving(true)

    try {
      await update(ref(db, `users/${user.firebaseUID}`), {
        name:  name.trim(),
        phone: phone.trim(),
      })

      // Update localStorage too
      const updatedUser = { ...user, name: name.trim(), phone: phone.trim() }
      localStorage.setItem('user', JSON.stringify(updatedUser))

      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)

    } catch (err) {
      console.log(err)
      setError('Failed to update profile. Please try again.')
    }

    setSaving(false)
  }

  return (
    <div className="pf-page">

      <nav className="pf-nav">
        <span className="pf-logo">RentAPlace</span>
        <div className="pf-nav-links">
          <button className="pf-nav-btn" onClick={() => navigate('/renter/dashboard')}>Dashboard</button>
          <button className="pf-nav-btn" onClick={() => navigate('/renter/browse')}>Browse</button>
          <button className="pf-nav-btn" onClick={() => navigate('/renter/bookings')}>My bookings</button>
          <button className="pf-nav-btn active">Profile</button>
          <NotificationBell userUID={user.firebaseUID} isAdmin={false} />
          <button className="pf-nav-btn logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="pf-content">

        {/* Header */}
        <div className="pf-header">
          <div className="pf-avatar-big">{getInitials(name)}</div>
          <div className="pf-header-info">
            <h2>{name || 'Your Name'}</h2>
            <p>{email}</p>
            <span className="pf-role-badge">Renter</span>
          </div>
        </div>

        {/* Personal info form */}
        <form className="pf-card" onSubmit={handleSave}>
          <p className="pf-card-title">Personal information</p>

          <div className="pf-field">
            <label>Full name</label>
            <input
              type="text"
              placeholder="Juan dela Cruz"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="pf-field">
            <label>Email address <span className="pf-locked">🔒 cannot be changed</span></label>
            <input
              type="email"
              value={email}
              disabled
            />
          </div>

          <div className="pf-field">
            <label>Phone number</label>
            <input
              type="tel"
              placeholder="09xx-xxx-xxxx"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          {error   && <p className="pf-error">{error}</p>}
          {success && <p className="pf-success">{success}</p>}

          <button
            type="submit"
            className="pf-save-btn"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>

        {/* Account details */}
        <div className="pf-card">
          <p className="pf-card-title">Account details</p>
          <div className="pf-info-row">
            <span>Role</span>
            <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
          </div>
          <div className="pf-info-row">
            <span>Member since</span>
            <span>{joined}</span>
          </div>
          <div className="pf-info-row">
            <span>Account status</span>
            <span className={`pf-status ${status}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}