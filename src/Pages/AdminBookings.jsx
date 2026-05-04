import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminBookings.css'

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [filter,   setFilter]   = useState('all')
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!user.email || user.role !== 'admin') navigate('/')
    const stored = JSON.parse(localStorage.getItem('bookings') || '[]')
    setBookings(stored)
  }, [])

  function handleLogout() {
    localStorage.removeItem('user')
    navigate('/')
  }

  function handleApprove(id) {
    const updated = bookings.map(b =>
      b.id === id ? { ...b, status: 'approved' } : b
    )
    setBookings(updated)
    localStorage.setItem('bookings', JSON.stringify(updated))
  }

  function handleCancel(id) {
    const updated = bookings.map(b =>
      b.id === id ? { ...b, status: 'cancelled' } : b
    )
    setBookings(updated)
    localStorage.setItem('bookings', JSON.stringify(updated))
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  const filtered        = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)
  const totalCount      = bookings.length
  const pendingCount    = bookings.filter(b => b.status === 'pending').length
  const approvedCount   = bookings.filter(b => b.status === 'approved').length
  const cancelledCount  = bookings.filter(b => b.status === 'cancelled').length

  return (
    <div className="ab-page">

      <nav className="ab-nav">
        <span className="ab-logo">RentAPlace</span>
        <div className="ab-nav-links">
          <button className="ab-nav-btn" onClick={() => navigate('/admin/dashboard')}>Dashboard</button>
          <button className="ab-nav-btn" onClick={() => navigate('/admin/listings')}>Listings</button>
          <button className="ab-nav-btn active">Bookings</button>
          <button className="ab-nav-btn" onClick={() => navigate('/admin/users')}>Users</button>
          <button className="ab-nav-btn logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="ab-content">

        <div className="ab-header">
          <div>
            <h2>Manage bookings</h2>
            <p className="ab-subheader">{totalCount} bookings total</p>
          </div>
        </div>

        {/* Stats */}
        <div className="ab-stats">
          <div className="ab-stat">
            <p className="ab-stat-label">Total</p>
            <p className="ab-stat-num">{totalCount}</p>
          </div>
          <div className="ab-stat">
            <p className="ab-stat-label">Pending</p>
            <p className="ab-stat-num pending">{pendingCount}</p>
          </div>
          <div className="ab-stat">
            <p className="ab-stat-label">Approved</p>
            <p className="ab-stat-num approved">{approvedCount}</p>
          </div>
          <div className="ab-stat">
            <p className="ab-stat-label">Cancelled</p>
            <p className="ab-stat-num cancelled">{cancelledCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="ab-filters">
          {['all', 'pending', 'approved', 'cancelled'].map(f => (
            <button
              key={f}
              className={`ab-filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="ab-table-wrap">
          {filtered.length === 0 ? (
            <div className="ab-empty">No {filter === 'all' ? '' : filter} bookings found.</div>
          ) : (
            <table className="ab-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Renter</th>
                  <th>Property</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Nights</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(booking => (
                  <tr key={booking.id}>
                    <td className="ab-td-ref">{booking.ref}</td>
                    <td className="ab-td-name">{booking.renterName}</td>
                    <td>{booking.propertyTitle}</td>
                    <td>{formatDate(booking.checkIn)}</td>
                    <td>{formatDate(booking.checkOut)}</td>
                    <td>{booking.nights}</td>
                    <td className="ab-td-total">₱{booking.total.toLocaleString()}</td>
                    <td>
                      <span className={`ab-badge ${booking.status}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="ab-td-actions">
                      {booking.status === 'pending' ? (
                        <>
                          <button className="ab-approve-btn" onClick={() => handleApprove(booking.id)}>
                            Approve
                          </button>
                          <button className="ab-cancel-btn" onClick={() => handleCancel(booking.id)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <span className="ab-no-action">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}