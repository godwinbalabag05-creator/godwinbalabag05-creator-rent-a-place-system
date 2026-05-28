import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import './BookingForm.css'
import useAuthGuard from '../hooks/useAuthGuard'
import { db, auth } from '../Firebase'
import { ref, push, update, remove } from 'firebase/database'
import PaymentStep from './PaymentStep'

export default function BookingForm() {
  useAuthGuard('renter')
  const { id }    = useParams()
  const { state } = useLocation()
  const navigate  = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [name,          setName]          = useState(user.name  || '')
  const [email,         setEmail]         = useState(user.email || '')
  const [phone,         setPhone]         = useState(user.phone || '')
  const [note,          setNote]          = useState('')
  const [error,         setError]         = useState('')
  const [saving,        setSaving]        = useState(false)

  // Payment flow state
  const [step,          setStep]          = useState('form')
  const [transactionID, setTransactionID] = useState('')
  const [bookingRef,    setBookingRef]    = useState('')

  // ── Hold booking data in memory until payment is done ──
  const [pendingBookingData, setPendingBookingData] = useState(null)

  function handleLogout() {
    localStorage.removeItem('user')
    auth.signOut()
    navigate('/')
  }

  if (!state || !state.property) {
    return (
      <div className="bf-page">
        <nav className="bf-nav">
          <span className="bf-logo">RentAPlace</span>
        </nav>
        <div className="bf-content">
          <p className="bf-lost">
            No booking info found.{' '}
            <span onClick={() => navigate('/renter/browse')}>Go back to browse</span>
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

  // ── Step 1: Save booking to Firebase immediately with paymentStatus: 'pending' ──
async function handleConfirm(e) {
  e.preventDefault()

  if (!name || !email || !phone) {
    setError('Please fill in your name, email and phone number.')
    return
  }

  setError('')
  setSaving(true)

  try {
    const ref_number = '#BK-' + Math.floor(100000 + Math.random() * 900000)
    const txnID      = 'TXN-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase()
    const now        = new Date().toISOString()

    const bookingData = {
      ref:              ref_number,
      propertyId:       property.id,
      propertyTitle:    property.title,
      propertyCity:     property.city,
      checkIn,
      checkOut,
      nights,
      total,
      status:           'pending',
      amount:           total,
      transactionID:    txnID,
      paymentMethod:    '',
      paymentStatus:    'pending',   // ← starts as pending
      paymentCreatedAt: now,
      paidAt:           '',
      renterName:       name,
      renterEmail:      email,
      renterPhone:      phone,
      renterUID:        user.firebaseUID || user.UID || '',
      note,
      createdAt:        now,
    }

    // ── Save to Firebase immediately so PayPage can find it by transactionID ──
    const bookingsRef = ref(db, 'bookings')
    const newRef      = await push(bookingsRef, bookingData)

    // ── Store the Firebase key so we can update it after payment ──
    setPendingBookingData({ ...bookingData, firebaseKey: newRef.key })
    setTransactionID(txnID)
    setBookingRef(ref_number)
    setStep('payment')

  } catch (err) {
    console.error(err)
    setError('Something went wrong. Please try again.')
  }

  setSaving(false)
}

async function handlePaymentSuccess(paymentMethod) {
  try {
    const now = new Date().toISOString()

    // Only update Firebase if payment was done via button click
    // If QR was scanned, PayPage already updated Firebase — skip the update
    if (pendingBookingData?.firebaseKey && paymentMethod) {
      const currentBookingRef = ref(db, `bookings/${pendingBookingData.firebaseKey}`)

      // Check current paymentStatus first — don't double update
      const { get } = await import('firebase/database')
      const snapshot = await get(currentBookingRef)
      const currentData = snapshot.val()

      // Only update if not already paid by QR scan
      if (currentData && currentData.paymentStatus !== 'paid') {
        await update(currentBookingRef, {
          paymentStatus: 'paid',
          paymentMethod: paymentMethod || 'ewallet',
          paidAt:        now,
        })
      }
    }

    // Update phone number on user profile
    if (user.firebaseUID && phone) {
      await update(ref(db, `users/${user.firebaseUID}`), { phone })
      const updatedUser = { ...user, phone }
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }

    // Always go to success screen
    setStep('success')

  } catch (err) {
    console.error(err)
    // Even if update fails, still show success since payment went through
    setStep('success')
  }
}

async function handleCardBack() {
  try {
    // delete pending unpaid booking
    if (pendingBookingData?.firebaseKey) {
      const bookingRef = ref(db, `bookings/${pendingBookingData.firebaseKey}`)
      await remove(bookingRef)
    }

    // reset states
    setPendingBookingData(null)
    setTransactionID('')
    setBookingRef('')
    setStep('form')

  } catch (err) {
    console.error(err)
  }
}

  const Nav = () => (
    <nav className="bf-nav">
      <span className="bf-logo">RentAPlace</span>
      <div className="bf-nav-links">
        <button className="bf-nav-btn" onClick={() => navigate('/renter/dashboard')}>Dashboard</button>
        <button className="bf-nav-btn active" onClick={() => navigate('/renter/browse')}>Browse</button>
        <button className="bf-nav-btn" onClick={() => navigate('/renter/bookings')}>My bookings</button>
        <button className="bf-nav-btn" onClick={() => navigate('/renter/profile')}>Profile</button>
        <button className="bf-nav-btn logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  )

  // ── Success screen ──
  if (step === 'success') {
    return (
      <div className="bf-page">
        <Nav />
        <div className="bf-content">
          <div className="bf-success">
            <div className="bf-check-circle">✓</div>
            <h2>Payment & Booking Confirmed!</h2>
            <p className="bf-success-sub">
              Your payment was received. The booking is pending admin approval.
            </p>
            <div className="bf-ref">{bookingRef}</div>
            <div className="bf-ref" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
              Transaction: {transactionID}
            </div>
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

  // ── Payment step ──
  if (step === 'payment') {
    return (
      <div className="bf-page">
        <Nav />
        <div className="bf-content">
          <PaymentStep
            onCardBack={handleCardBack}
            firebaseKey={pendingBookingData?.firebaseKey}
            transactionID={transactionID}
            bookingRef={bookingRef}
            property={property}
            checkIn={checkIn}
            checkOut={checkOut}
            nights={nights}
            total={total}
            renterName={name}
            onSuccess={handlePaymentSuccess}
          />
        </div>
      </div>
    )
  }

  // ── Booking form (Step 1) ──
  return (
    <div className="bf-page">
      <Nav />
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
              {saving ? 'Saving...' : 'Continue to Payment →'}
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
              Next step: choose a <strong>payment method</strong> to complete your booking.
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}