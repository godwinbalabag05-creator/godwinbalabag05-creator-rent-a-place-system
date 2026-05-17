import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './MyBookings.css'
import useAuthGuard from '../hooks/useAuthGuard'

import { db, auth } from '../Firebase'
import { ref, onValue, update } from 'firebase/database'

export default function MyBookings() {
  useAuthGuard('renter')
  const [bookings, setBookings] = useState([])
  const [filter,   setFilter]   = useState('all')
  const [loading,  setLoading]  = useState(true)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // ── Auto complete check ──
  async function autoCompleteBookings(bookingsArray) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const booking of bookingsArray) {
      if (booking.status === 'approved' && booking.checkOut) {
        const checkOutDate = new Date(booking.checkOut)
        checkOutDate.setHours(0, 0, 0, 0)

        if (checkOutDate < today) {
          try {
            await update(ref(db, `bookings/${booking.id}`), {
              status: 'completed'
            })
          } catch (err) {
            console.log('Auto complete error:', err)
          }
        }
      }
    }
  }

  useEffect(() => {
    if (!user.email) {
      navigate('/')
      return
    }

    const bookingsRef = ref(db, 'bookings')

    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()

        const bookingsArray = Object.keys(data)
          .map(key => ({
            id:            key,
            ref:           data[key].ref           || '',
            propertyId:    data[key].propertyId    || '',
            propertyTitle: data[key].propertyTitle || '',
            propertyCity:  data[key].propertyCity  || '',
            checkIn:       data[key].checkIn       || '',
            checkOut:      data[key].checkOut      || '',
            nights:        data[key].nights        || 0,
            total:         data[key].total         || 0,
            status:        data[key].status        || 'pending',
            paymentStatus: data[key].paymentStatus || 'pending',
            renterEmail:   data[key].renterEmail   || '',
            renterName:    data[key].renterName    || '',
            renterPhone:   data[key].renterPhone   || '',
            note:          data[key].note          || '',
            createdAt:     data[key].createdAt     || '',
          }))
          .filter(b => b.renterEmail === user.email)

        bookingsArray.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        )

        // Run auto complete check
        autoCompleteBookings(bookingsArray)

        setBookings(bookingsArray)
      } else {
        setBookings([])
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  function handleLogout() {
    localStorage.removeItem('user')
    auth.signOut()
    navigate('/')
  }

  async function handleCancel(bookingId) {
    try {
      await update(ref(db, `bookings/${bookingId}`), {
        status: 'cancelled'
      })
    } catch (error) {
      console.log(error)
      alert('Failed to cancel booking. Please try again.')
    }
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  const filtered        = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter)

  const totalCount      = bookings.length
  const pendingCount    = bookings.filter(b => b.status === 'pending').length
  const approvedCount   = bookings.filter(b => b.status === 'approved').length
  const completedCount  = bookings.filter(b => b.status === 'completed').length

  return (
    <div className="mb-page">

      <nav className="mb-nav">
        <span className="mb-logo">RentAPlace</span>
        <div className="mb-nav-links">
          <button className="mb-nav-btn" onClick={() => navigate('/renter/dashboard')}>Dashboard</button>
          <button className="mb-nav-btn" onClick={() => navigate('/renter/browse')}>Browse</button>
          <button className="mb-nav-btn active">My bookings</button>
          <button className="mb-nav-btn" onClick={() => navigate('/renter/profile')}>Profile</button>
          <button className="mb-nav-btn logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="mb-content">

        {/* Stats */}
        <div className="mb-stats">
          <div className="mb-stat">
            <p className="mb-stat-label">Total</p>
            <p className="mb-stat-num">
              {loading ? '...' : totalCount}
            </p>
          </div>
          <div className="mb-stat">
            <p className="mb-stat-label">Pending</p>
            <p className="mb-stat-num pending">
              {loading ? '...' : pendingCount}
            </p>
          </div>
          <div className="mb-stat">
            <p className="mb-stat-label">Approved</p>
            <p className="mb-stat-num approved">
              {loading ? '...' : approvedCount}
            </p>
          </div>
          <div className="mb-stat">
            <p className="mb-stat-label">Completed</p>
            <p className="mb-stat-num completed">
              {loading ? '...' : completedCount}
            </p>
          </div>
        </div>

        {/* Header + filters */}
        <div className="mb-header">
          <h2>My bookings</h2>
          <div className="mb-filters">
            {['all', 'pending', 'approved', 'completed', 'cancelled'].map(f => (
              <button
                key={f}
                className={`mb-filter-btn${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings list */}
        {loading ? (
          <div className="mb-empty">
            <p>Loading your bookings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mb-empty">
            <p>No {filter === 'all' ? '' : filter} bookings found.</p>
            <button
              className="mb-browse-btn"
              onClick={() => navigate('/renter/browse')}
            >
              Browse properties
            </button>
          </div>
        ) : (
          <div className="mb-list">
            {filtered.map(booking => (
              <div key={booking.id} className="mb-card">
                <div className="mb-card-icon">
                  {booking.status === 'completed' ? '✅' : '🏠'}
                </div>
                <div className="mb-card-body">

                  <div className="mb-card-top">
                    <p className="mb-card-title">{booking.propertyTitle}</p>
                    <span className={`mb-badge ${booking.status}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>

                  <p className="mb-card-city">📍 {booking.propertyCity}</p>

                  <div className="mb-card-dates">
                    <span>Check-in: {formatDate(booking.checkIn)}</span>
                    <span>Check-out: {formatDate(booking.checkOut)}</span>
                    <span>{booking.nights} nights</span>
                  </div>

                  <div className="mb-card-footer">
                    <div>
                      <span className="mb-card-total">
                        ₱{Number(booking.total).toLocaleString()}
                      </span>
                      <span className="mb-card-ref"> {booking.ref}</span>
                    </div>
                    {booking.status === 'pending' && (
                      <button
                        className="mb-cancel-btn"
                        onClick={() => handleCancel(booking.id)}
                      >
                        Cancel
                      </button>
                    )}
                    {booking.status === 'completed' && (
                      <span className="mb-completed-tag">
                        Stay completed ✓
                      </span>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}