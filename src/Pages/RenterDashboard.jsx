import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './RenterDashboard.css'

export default function RenterDashboard() {
  const [bookings, setBookings] = useState([])
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!user.email) navigate('/')
    const stored = JSON.parse(localStorage.getItem('bookings') || '[]')
    setBookings(stored)
  }, [])

  function handleLogout() {
    localStorage.removeItem('user')
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
    .reduce((sum, b) => sum + b.total, 0)

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4)

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
            <button className="rd-browse-btn" onClick={() => navigate('/renter/browse')}>
              Browse places
            </button>
            <div className="rd-avatar">{getInitials(user.name)}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="rd-stats">
          <div className="rd-stat">
            <p className="rd-stat-label">Total bookings</p>
            <p className="rd-stat-num">{totalCount}</p>
          </div>
          <div className="rd-stat">
            <p className="rd-stat-label">Pending</p>
            <p className="rd-stat-num pending">{pendingCount}</p>
          </div>
          <div className="rd-stat">
            <p className="rd-stat-label">Approved</p>
            <p className="rd-stat-num approved">{approvedCount}</p>
          </div>
          <div className="rd-stat">
            <p className="rd-stat-label">Total spent</p>
            <p className="rd-stat-num spent">₱{totalSpent.toLocaleString()}</p>
          </div>
        </div>

        {/* Recent bookings */}
        <div className="rd-section-header">
          <h3>Recent bookings</h3>
          <button className="rd-see-all" onClick={() => navigate('/renter/bookings')}>
            See all →
          </button>
        </div>

        {recentBookings.length === 0 ? (
          <div className="rd-empty">
            <p>You have no bookings yet.</p>
            <button className="rd-empty-btn" onClick={() => navigate('/renter/browse')}>
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
                <p className="rd-booking-total">₱{booking.total.toLocaleString()}</p>
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