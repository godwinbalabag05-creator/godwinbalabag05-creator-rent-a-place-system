import { useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import './BookingForm.css'
import useAuthGuard from '../hooks/useAuthGuard'


import { db, auth } from '../Firebase'
import { ref, push, update } from 'firebase/database'

export default function BookingForm() {
  useAuthGuard('renter')
  const { id }    = useParams()
  const { state } = useLocation()
  const navigate  = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [name,       setName]       = useState(user.name  || '')
  const [email,      setEmail]      = useState(user.email || '')
  const [phone,      setPhone]      = useState(user.phone || '')
  const [note,       setNote]       = useState('')
  const [error,      setError]      = useState('')
  const [submitted,  setSubmitted]  = useState(false)
  const [bookingRef, setBookingRef] = useState('')
  const [saving,     setSaving]     = useState(false)

  function handleLogout() {
    localStorage.removeItem('user')
    auth.signOut()
    navigate('/')
  }

  // Guard — if user navigated here without booking state
  if (!state || !state.property) {
    return (
      <div className="bf-page">
        <nav className="bf-nav">
          <span className="bf-logo">RentAPlace</span>
        </nav>
        <div className="bf-content">
          <p className="bf-lost">
            No booking info found.{' '}
            <span onClick={() => navigate('/renter/browse')}>
              Go back to browse
            </span>
          </p>
        </div>
      </div>
    )
  }

  const { property, checkIn, checkOut, nights, total } = state

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  async function handleConfirm(e) {
    e.preventDefault()

    if (!name || !email || !phone) {
      setError('Please fill in your name, email and phone number.')
      return
    }

    setError('')
    setSaving(true)

    try {
      // Generate booking reference
      const ref_number = '#BK-' + Math.floor(100000 + Math.random() * 900000)

      // Build booking object
      const bookingData = {
        ref:           ref_number,
        propertyId:    property.id,
        propertyTitle: property.title,
        propertyCity:  property.city,
        checkIn,
        checkOut,
        nights,
        total,
        status:        'pending',
        renterName:    name,
        renterEmail:   email,
        renterPhone:   phone,
        renterUID:     user.firebaseUID || user.UID || '',
        note,
        createdAt:     new Date().toISOString(),
      }

      // Save booking to Firebase under bookings/
      const bookingsRef = ref(db, 'bookings')
      await push(bookingsRef, bookingData)

      // Update phone number on user profile in Firebase
      // so AdminUsers shows the real phone number
      if (user.firebaseUID && phone) {
        await update(ref(db, `users/${user.firebaseUID}`), {
          phone: phone
        })

        // Also update localStorage so it's consistent
        const updatedUser = { ...user, phone }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }

      setBookingRef(ref_number)
      setSubmitted(true)

    } catch (error) {
      console.log(error)
      setError('Failed to save booking. Please try again.')
    }

    setSaving(false)
  }

  // ── Success screen ──
  if (submitted) {
    return (
      <div className="bf-page">
        <nav className="bf-nav">
          <span className="bf-logo">RentAPlace</span>
          <div className="bf-nav-links">
            <button className="bf-nav-btn" onClick={() => navigate('/renter/dashboard')}>Dashboard</button>
            <button className="bf-nav-btn" onClick={() => navigate('/renter/browse')}>Browse</button>
            <button className="bf-nav-btn" onClick={() => navigate('/renter/bookings')}>My bookings</button>
            <button className="bf-nav-btn logout" onClick={handleLogout}>Logout</button>
          </div>
        </nav>
        <div className="bf-content">
          <div className="bf-success">
            <div className="bf-check-circle">✓</div>
            <h2>Booking confirmed!</h2>
            <p className="bf-success-sub">
              Your booking is pending approval from the admin.
            </p>
            <div className="bf-ref">{bookingRef}</div>
            <div className="bf-success-btns">
              <button
                className="bf-btn-primary"
                onClick={() => navigate('/renter/bookings')}
              >
                View my bookings
              </button>
              <button
                className="bf-btn-outline"
                onClick={() => navigate('/renter/browse')}
              >
                Browse more places
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Booking form ──
  return (
    <div className="bf-page">
      <nav className="bf-nav">
        <span className="bf-logo">RentAPlace</span>
        <div className="bf-nav-links">
          <button className="bf-nav-btn" onClick={() => navigate('/renter/dashboard')}>Dashboard</button>
          <button className="bf-nav-btn active" onClick={() => navigate('/renter/browse')}>Browse</button>
          <button className="bf-nav-btn" onClick={() => navigate('/renter/bookings')}>My bookings</button>
          <button className="bf-nav-btn logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="bf-content">
        <div className="bf-grid">

          <form className="bf-card" onSubmit={handleConfirm}>
            <p className="bf-section-label">Your details</p>

            <label>Full name</label>
            <input
              type="text"
              placeholder="Juan dela Cruz"
              value={name}
              onChange={e => setName(e.target.value)}
            />

            <label>Email address</label>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            <label>Phone number</label>
            <input
              type="tel"
              placeholder="09xx-xxx-xxxx"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />

            <label>
              Special requests{' '}
              <span className="bf-optional">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. early check-in, ground floor"
              value={note}
              onChange={e => setNote(e.target.value)}
            />

            {error && <p className="bf-error">{error}</p>}

            <button
              type="submit"
              className="bf-btn-primary"
              style={{ marginTop: '1.5rem' }}
              disabled={saving}
            >
              {saving ? 'Confirming...' : 'Confirm booking'}
            </button>
          </form>

          <div className="bf-card">
            <p className="bf-section-label">Booking summary</p>
            <p className="bf-prop-title">{property.title}</p>
            <p className="bf-prop-city">📍 {property.city}</p>
            <div className="bf-tags">
              <span className="bf-tag">{property.guests} guests</span>
              <span className="bf-tag">{property.type || 'Property'}</span>
            </div>
            <div className="bf-rows">
              <div className="bf-row">
                <span>Check-in</span>
                <span>{formatDate(checkIn)}</span>
              </div>
              <div className="bf-row">
                <span>Check-out</span>
                <span>{formatDate(checkOut)}</span>
              </div>
              <div className="bf-row">
                <span>Nights</span>
                <span>{nights}</span>
              </div>
              <div className="bf-row">
                <span>₱{Number(property.price).toLocaleString()} × {nights}</span>
                <span>₱{Number(total).toLocaleString()}</span>
              </div>
            </div>
            <hr className="bf-divider" />
            <div className="bf-total">
              <span>Total</span>
              <span>₱{Number(total).toLocaleString()}</span>
            </div>
            <div className="bf-status-note">
              After confirming, your booking will be marked as{' '}
              <strong>pending</strong> until the admin approves it.
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}