import { useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import './BookingForm.css'

export default function BookingForm() {
  const { id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  const [name, setName] = useState(JSON.parse(localStorage.getItem('user') || '{}').name || '')
  const [email, setEmail] = useState(JSON.parse(localStorage.getItem('user') || '{}').email || '')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [bookingRef, setBookingRef] = useState('')

  // Guard: if user navigated here directly without state, send them back
  if (!state || !state.property) {
    return (
      <div className="bf-page">
        <p className="bf-lost">
          No booking info found.{' '}
          <span onClick={() => navigate('/renter/browse')}>Go back to browse</span>
        </p>
      </div>
    )
  }

  const { property, checkIn, checkOut, nights, total } = state

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  function handleConfirm(e) {
    e.preventDefault()
    if (!name || !email || !phone) {
      setError('Please fill in your name, email and phone number.')
      return
    }
    setError('')

    // Save booking to localStorage (we'll replace this with a real API later)
    const booking = {
      id: Date.now(),
      ref: '#BK-' + Math.floor(100000 + Math.random() * 900000),
      propertyId: property.id,
      propertyTitle: property.title,
      propertyCity: property.city,
      checkIn,
      checkOut,
      nights,
      total,
      status: 'pending',
      renterName: name,
      renterEmail: email,
      renterPhone: phone,
      note,
      createdAt: new Date().toISOString(),
    }

    const existing = JSON.parse(localStorage.getItem('bookings') || '[]')
    existing.push(booking)
    localStorage.setItem('bookings', JSON.stringify(existing))

    setBookingRef(booking.ref)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bf-page">
        <nav className="bf-nav">
          <span className="bf-logo">RentAPlace</span>
        </nav>
        <div className="bf-content">
          <div className="bf-success">
            <div className="bf-check-circle">✓</div>
            <h2>Booking confirmed!</h2>
            <p className="bf-success-sub">Your booking is pending approval from the admin.</p>
            <div className="bf-ref">Ref: {bookingRef}</div>
            <div className="bf-success-actions">
              <button onClick={() => navigate('/renter/bookings')} className="bf-btn-primary">
                View my bookings
              </button>
              <button onClick={() => navigate('/renter/browse')} className="bf-btn-secondary">
                Browse more places
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bf-page">
      <nav className="bf-nav">
  <span className="bf-logo">RentAPlace</span>
  <div className="bf-nav-links">
    <span onClick={() => navigate('/renter/dashboard')} className="bf-nav-link">Dashboard</span>
    <span onClick={() => navigate('/renter/browse')} className="bf-nav-link">Browse</span>
    <span onClick={() => navigate('/renter/bookings')} className="bf-nav-link">My bookings</span>
  </div>
</nav>

      <div className="bf-content">
        <div className="bf-grid">

          <form className="bf-card" onSubmit={handleConfirm}>
            <p className="bf-section-label">Your details</p>

            <label>Full name</label>
            <input type="text" value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Juan dela Cruz" />

            <label>Email address</label>
            <input type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com" />

            <label>Phone number</label>
            <input type="tel" value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="09xx-xxx-xxxx" />

            <label>Special requests <span className="bf-optional">(optional)</span></label>
            <input type="text" value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. early check-in, ground floor" />

            {error && <p className="bf-error">{error}</p>}

            <button type="submit" className="bf-btn-primary" style={{ marginTop: '1.25rem' }}>
              Confirm booking
            </button>
          </form>

          <div className="bf-card">
            <p className="bf-section-label">Booking summary</p>

            <p className="bf-prop-title">{property.title}</p>
            <p className="bf-prop-city">{property.city}</p>
            <div className="bf-tags">
              <span className="bf-tag">{property.guests} guests</span>
              <span className="bf-tag">{property.type}</span>
            </div>

            <div className="bf-summary-rows">
              <div className="bf-row"><span>Check-in</span><span>{formatDate(checkIn)}</span></div>
              <div className="bf-row"><span>Check-out</span><span>{formatDate(checkOut)}</span></div>
              <div className="bf-row"><span>Nights</span><span>{nights}</span></div>
              <div className="bf-row">
                <span>₱{property.price.toLocaleString()} × {nights}</span>
                <span>₱{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="bf-total-row">
              <span>Total</span>
              <span>₱{total.toLocaleString()}</span>
            </div>

            <div className="bf-status-note">
              After confirming, your booking will be marked as <strong>pending</strong> until the admin approves it.
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}