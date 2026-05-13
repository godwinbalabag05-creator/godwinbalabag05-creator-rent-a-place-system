import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './RenterDashboard.css'
import useAuthGuard from '../hooks/useAuthGuard'


import { db, auth } from '../Firebase'
import { ref, onValue } from 'firebase/database'

export default function RenterDashboard() {
  useAuthGuard('renter')
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!user.email) {
      navigate('/')
      return
    }

    // Listen to bookings — filter by this renter's email
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
            renterEmail:   data[key].renterEmail   || '',
            createdAt:     data[key].createdAt     || '',
          }))
          // Only show THIS renter's bookings
          .filter(b => b.renterEmail === user.email)

        // Sort newest first
        bookingsArray.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        )

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

  function getInitials(name) {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function getTodayString() {
    return new Date().toLocaleDateString('en-PH', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    })
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  const totalCount    = bookings.length
  const pendingCount  = bookings.filter(b => b.status === 'pending').length
  const approvedCount = bookings.filter(b => b.status === 'approved').length
  const totalSpent    = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + Number(b.total), 0)

  const recentBookings = [...bookings].slice(0, 4)

  return (
    <div className="rd-page">

      <nav className="rd-nav">
        <span className="rd-logo">RentAPlace</span>
        <div className="rd-nav-links">
          <button className="rd-nav-btn active">Dashboard</button>
          <button className="rd-nav-btn" onClick={() => navigate('/renter/browse')}>Browse</button>
          <button className="rd-nav-btn" onClick={() => navigate('/renter/bookings')}>My bookings</button>
          <button className="rd-nav-btn logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="rd-content">

        {/* Banner */}
        <div className="rd-banner">
          <div>
            <h2>Welcome back, {user.name || 'Renter'}!</h2>
            <p>{getTodayString()}</p>
          </div>
          <div className="rd-banner-right">
            <button
              className="rd-browse-btn"
              onClick={() => navigate('/renter/browse')}
            >
              Browse places
            </button>
            <div className="rd-avatar">{getInitials(user.name)}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="rd-stats">
          <div className="rd-stat">
            <p className="rd-stat-label">Total bookings</p>
            <p className="rd-stat-num">
              {loading ? '...' : totalCount}
            </p>
          </div>
          <div className="rd-stat">
            <p className="rd-stat-label">Pending</p>
            <p className="rd-stat-num pending">
              {loading ? '...' : pendingCount}
            </p>
          </div>
          <div className="rd-stat">
            <p className="rd-stat-label">Approved</p>
            <p className="rd-stat-num approved">
              {loading ? '...' : approvedCount}
            </p>
          </div>
          <div className="rd-stat">
            <p className="rd-stat-label">Total spent</p>
            <p className="rd-stat-num spent">
              {loading ? '...' : '₱' + totalSpent.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Recent bookings */}
        <div className="rd-section-header">
          <h3>Recent bookings</h3>
          <button
            className="rd-see-all"
            onClick={() => navigate('/renter/bookings')}
          >
            See all →
          </button>
        </div>

        {loading ? (
          <div className="rd-empty">
            <p>Loading your bookings...</p>
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="rd-empty">
            <p>You have no bookings yet.</p>
            <button
              className="rd-empty-btn"
              onClick={() => navigate('/renter/browse')}
            >
              Browse properties
            </button>
          </div>
        ) : (
          <div className="rd-bookings-grid">
            {recentBookings.map(booking => (
              <div key={booking.id} className="rd-booking-card">
                <div className="rd-booking-top">
                  <p className="rd-booking-title">{booking.propertyTitle}</p>
                  <span className={`rd-badge ${booking.status}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
                <p className="rd-booking-city">📍 {booking.propertyCity}</p>
                <p className="rd-booking-dates">
                  {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)} · {booking.nights} nights
                </p>
                <p className="rd-booking-total">
                  ₱{Number(booking.total).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="rd-section-header">
          <h3>Quick actions</h3>
        </div>
        <div className="rd-quick">
          <div className="rd-quick-card" onClick={() => navigate('/renter/browse')}>
            <div className="rd-quick-icon">🔍</div>
            <p className="rd-quick-label">Browse places</p>
            <p className="rd-quick-sub">Find a new place to rent</p>
          </div>
          <div className="rd-quick-card" onClick={() => navigate('/renter/bookings')}>
            <div className="rd-quick-icon">📋</div>
            <p className="rd-quick-label">My bookings</p>
            <p className="rd-quick-sub">View all your bookings</p>
          </div>
          <div className="rd-quick-card">
            <div className="rd-quick-icon">👤</div>
            <p className="rd-quick-label">My profile</p>
            <p className="rd-quick-sub">View your account details</p>
          </div>
        </div>

      </div>
    </div>
  )
}