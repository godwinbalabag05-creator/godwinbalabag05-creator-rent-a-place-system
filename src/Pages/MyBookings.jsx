import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './MyBookings.css'

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('bookings') || '[]')
    setBookings(stored)
  }, [])

  function handleLogout() {
    localStorage.removeItem('user')
    navigate('/')
  }

  function handleCancel(id) {
    const updated = bookings.map(b =>
      b.id === id ? { ...b, status: 'cancelled' } : b
    )
    setBookings(updated)
    localStorage.setItem('bookings', JSON.stringify(updated))
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter)

  const totalCount = bookings.length
  const pendingCount = bookings.filter(b => b.status === 'pending').length
  const approvedCount = bookings.filter(b => b.status === 'approved').length

  return (
    <div className="mb-page">

      <nav className="mb-nav">
        <span className="mb-logo">RentAPlace</span>
        <div className="mb-nav-links">
          <span onClick={() => navigate('/renter/browse')}>Browse</span>
          <span className="active">My bookings</span>
          <span onClick={handleLogout} className="mb-logout">Logout</span>
        </div>
      </nav>

      <div className="mb-content">

        <div className="mb-stats">
          <div className="mb-stat">
            <p className="mb-stat-num">{totalCount}</p>
            <p className="mb-stat-label">Total bookings</p>
          </div>
          <div className="mb-stat">
            <p className="mb-stat-num pending">{pendingCount}</p>
            <p className="mb-stat-label">Pending</p>
          </div>
          <div className="mb-stat">
            <p className="mb-stat-num approved">{approvedCount}</p>
            <p className="mb-stat-label">Approved</p>
          </div>
        </div>

        <div className="mb-header">
          <h2>My bookings</h2>
          <div className="mb-filters">
            {['all', 'pending', 'approved', 'cancelled'].map(f => (
              <button
                key={f}
                className={filter === f ? 'active' : ''}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mb-empty">
            <p>No {filter === 'all' ? '' : filter} bookings found.</p>
            <button onClick={() => navigate('/renter/browse')}>
              Browse properties
            </button>
          </div>
        ) : (
          <div className="mb-list">
            {filtered.map(booking => (
              <div key={booking.id} className="mb-card">
                <div className="mb-card-icon">🏠</div>
                <div className="mb-card-body">
                  <div className="mb-card-top">
                    <p className="mb-card-title">{booking.propertyTitle}</p>
                    <span className={`mb-status ${booking.status}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <p className="mb-card-city">{booking.propertyCity}</p>
                  <div className="mb-card-dates">
                    <span>Check-in: {formatDate(booking.checkIn)}</span>
                    <span>Check-out: {formatDate(booking.checkOut)}</span>
                    <span>{booking.nights} nights</span>
                  </div>
                  <div className="mb-card-footer">
                    <div>
                      <span className="mb-total">
                        ₱{booking.total.toLocaleString()}
                      </span>
                      <span className="mb-ref">&nbsp;{booking.ref}</span>
                    </div>
                    {booking.status === 'pending' && (
                      <button
                        className="mb-cancel-btn"
                        onClick={() => handleCancel(booking.id)}
                      >
                        Cancel
                      </button>
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