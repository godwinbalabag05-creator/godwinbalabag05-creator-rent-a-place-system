import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './PropertyDetail.css'
import useAuthGuard from '../hooks/useAuthGuard'

import { db, auth } from '../Firebase'
import { ref, onValue } from 'firebase/database'

export default function PropertyDetail() {
  useAuthGuard('renter')
  const { id }     = useParams()
  const navigate   = useNavigate()

  const [property, setProperty] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!user.email) {
      navigate('/')
      return
    }

    const propertyRef = ref(db, `properties/${id}`)

    const unsubscribe = onValue(propertyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        setProperty({
          id,
          title:       data.title       || '',
          city:        data.city        || '',
          price:       data.price       || 0,
          guests:      data.guests      || 0,
          type:        data.type        || 'Property',
          description: data.description || 'No description available.',
          amenities:   data.amenities   || [],
          status:      data.status      || 'available',
        })
        setNotFound(false)
      } else {
        setNotFound(true)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [id])

  function handleLogout() {
    localStorage.removeItem('user')
    auth.signOut()
    navigate('/')
  }

  const NavBar = () => (
    <nav className="pd-nav">
      <span className="pd-logo">RentAPlace</span>
      <div className="pd-nav-links">
        <button className="pd-nav-btn" onClick={() => navigate('/renter/dashboard')}>Dashboard</button>
        <button className="pd-nav-btn active" onClick={() => navigate('/renter/browse')}>Browse</button>
        <button className="pd-nav-btn" onClick={() => navigate('/renter/bookings')}>My bookings</button>
        <button className="pd-nav-btn" onClick={() => navigate('/renter/profile')}>Profile</button>
        <button className="pd-nav-btn logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  )

  // ── Loading state ──
  if (loading) {
    return (
      <div className="pd-page">
        <NavBar />
        <div className="pd-content">
          <div className="pd-hero" style={{ opacity: 0.4 }}>🏠</div>
          <p style={{ textAlign: 'center', color: '#6b9e84', marginTop: '1rem' }}>
            Loading property...
          </p>
        </div>
      </div>
    )
  }

  // ── Not found state ──
  if (notFound || !property) {
    return (
      <div className="pd-page">
        <NavBar />
        <div className="pd-content">
          <p className="pd-not-found">
            Property not found.{' '}
            <span onClick={() => navigate('/renter/browse')}>
              Go back to browse
            </span>
          </p>
        </div>
      </div>
    )
  }

  // ── Property found ──
  return (
    <div className="pd-page">
      <NavBar />
      <div className="pd-content">

        <div className="pd-hero">🏠</div>

        <div className="pd-body">

          <div className="pd-info">
            <h1 className="pd-title">{property.title}</h1>
            <p className="pd-city">📍 {property.city}</p>

            <div className="pd-tags">
              <span className="pd-tag">{property.guests} guests</span>
              <span className="pd-tag">Available</span>
              <span className="pd-tag">{property.type}</span>
            </div>

            <p className="pd-section-label">About this place</p>
            <p className="pd-desc">{property.description}</p>

            {property.amenities && property.amenities.length > 0 && (
              <>
                <p className="pd-section-label">Amenities</p>
                <div className="pd-tags">
                  {property.amenities.map((a, i) => (
                    <span key={i} className="pd-tag">{a}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          <BookingPanel property={property} />

        </div>
      </div>
    </div>
  )
}

function BookingPanel({ property }) {
  const navigate = useNavigate()
  const [checkIn,     setCheckIn]     = useState('')
  const [checkOut,    setCheckOut]    = useState('')
  const [bookedDates, setBookedDates] = useState([])
  const [conflict,    setConflict]    = useState(false)
  const [nextAvailable, setNextAvailable] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const nights = checkIn && checkOut
    ? Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
    : 0

  const total = nights > 0 ? Number(property.price) * nights : 0

  // ── Load existing paid bookings for this property ──
  useEffect(() => {
    const bookingsRef = ref(db, 'bookings')

    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()

        // Only block dates for paid bookings
        const propertyBookings = Object.values(data).filter(b =>
          b.propertyId === property.id &&
          b.paymentStatus === 'paid' &&
          b.status !== 'cancelled'
        )

        setBookedDates(propertyBookings)

        // Find the next available date after all booked periods
        if (propertyBookings.length > 0) {
          const latestCheckOut = propertyBookings.reduce((latest, b) => {
            const checkOut = new Date(b.checkOut)
            return checkOut > latest ? checkOut : latest
          }, new Date(0))

          const nextDay = new Date(latestCheckOut)
          nextDay.setDate(nextDay.getDate() + 1)

          if (nextDay > new Date()) {
            setNextAvailable(nextDay.toISOString().split('T')[0])
          }
        }
      }
    })

    return () => unsubscribe()
  }, [property.id])

  // ── Check if selected dates conflict ──
  function hasConflict(checkInDate, checkOutDate) {
    if (!checkInDate || !checkOutDate) return false
    const newStart = new Date(checkInDate)
    const newEnd   = new Date(checkOutDate)

    return bookedDates.some(booking => {
      const existStart = new Date(booking.checkIn)
      const existEnd   = new Date(booking.checkOut)
      return newStart < existEnd && newEnd > existStart
    })
  }

  function handleCheckInChange(e) {
    const newCheckIn = e.target.value
    setCheckIn(newCheckIn)
    setCheckOut('')
    setConflict(false)
  }

  function handleCheckOutChange(e) {
    const newCheckOut = e.target.value
    setCheckOut(newCheckOut)
    setConflict(hasConflict(checkIn, newCheckOut))
  }

  function handleBookNow() {
    if (!checkIn || !checkOut || nights <= 0) {
      alert('Please select valid check-in and check-out dates.')
      return
    }
    if (conflict) {
      alert('These dates are already booked. Please choose different dates.')
      return
    }
    navigate(`/renter/book/${property.id}`, {
      state: { checkIn, checkOut, nights, total, property }
    })
  }

  return (
    <div className="pd-book">
      <p className="pd-price-big">₱{Number(property.price).toLocaleString()}</p>
      <p className="pd-per">per night</p>

      {/* Show next available date if property has bookings */}
      {nextAvailable && nextAvailable > today && (
        <div className="pd-available-notice">
          📅 Next available from{' '}
          <strong>
            {new Date(nextAvailable).toLocaleDateString('en-PH', {
              month: 'long', day: 'numeric', year: 'numeric'
            })}
          </strong>
        </div>
      )}

      <label>Check-in</label>
      <input
        type="date"
        value={checkIn}
        min={today}
        onChange={handleCheckInChange}
      />

      <label>Check-out</label>
      <input
        type="date"
        value={checkOut}
        min={checkIn || today}
        onChange={handleCheckOutChange}
      />

      {/* Conflict warning */}
      {conflict && (
        <div className="pd-conflict">
          ❌ These dates are already booked!
          {nextAvailable && (
            <span>
              {' '}Try dates from{' '}
              <strong>
                {new Date(nextAvailable).toLocaleDateString('en-PH', {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}
              </strong>
            </span>
          )}
        </div>
      )}

      <hr className="pd-divider" />

      <div className="pd-total-row">
        <span>Nights</span>
        <span>{nights > 0 ? nights : '—'}</span>
      </div>
      <div className="pd-total-row">
        <span>₱{Number(property.price).toLocaleString()} × {nights > 0 ? nights : '—'}</span>
        <span>{total > 0 ? '₱' + total.toLocaleString() : '—'}</span>
      </div>

      <hr className="pd-divider" />

      <div className="pd-total-big">
        <span>Total</span>
        <span>{total > 0 ? '₱' + total.toLocaleString() : '—'}</span>
      </div>

      <button
        className="pd-book-btn"
        onClick={handleBookNow}
        disabled={conflict || nights <= 0}
        style={{
          opacity: conflict ? 0.5 : 1,
          cursor:  conflict ? 'not-allowed' : 'pointer'
        }}
      >
        {conflict ? '❌ Dates unavailable' : 'Book now →'}
      </button>

    </div>
  )
}