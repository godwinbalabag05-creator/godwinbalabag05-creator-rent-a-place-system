import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminDashboard.css'
import AnalyticsChart from '../components/AnalyticsChart'


const MOCK_PROPERTIES = [
  { id: 1, title: 'Cozy Studio in Davao',  city: 'Davao City',         price: 850  },
  { id: 2, title: 'Modern Flat near Mall', city: 'Davao City',         price: 1200 },
  { id: 3, title: 'Beach House Samal',     city: 'Island Garden City', price: 2500 },
  { id: 4, title: 'Quiet Room Toril',      city: 'Davao City',         price: 600  },
  { id: 5, title: 'Family Home Calinan',   city: 'Davao City',         price: 1800 },
  { id: 6, title: 'Studio in Tagum',       city: 'Tagum City',         price: 750  },
]

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([])
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  console.log(user)

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

  function getTodayString() {
    return new Date().toLocaleDateString('en-PH', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    })
  }

  const totalProperties = MOCK_PROPERTIES.length
  const totalBookings   = bookings.length
  const pendingBookings = bookings.filter(b => b.status === 'pending')
  const totalRevenue    = bookings
    .filter(b => b.status === 'approved')
    .reduce((sum, b) => sum + b.total, 0)

  return (
    <div className="ad-page">

      <nav className="ad-nav">
        <span className="ad-logo">RentAPlace</span>
        <div className="ad-nav-links">
          <button className="ad-nav-btn active">Dashboard</button>
          <button className="ad-nav-btn" onClick={() => navigate('/admin/listings')}>Listings</button>
          <button className="ad-nav-btn" onClick={() => navigate('/admin/bookings')}>Bookings</button>
          <button className="ad-nav-btn" onClick={() => navigate('/admin/users')}>Users</button>
          <button className="ad-nav-btn logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="ad-content">

        {/* Banner */}
        <div className="ad-banner">
          <div>
            <h2>Welcome, Admin!</h2>
            <p>{getTodayString()} — Here's what needs your attention today.</p>
          </div>
          <div className="ad-avatar">AD</div>
        </div>

        {/* Stats */}
        <div className="ad-stats">
          <div className="ad-stat">
            <p className="ad-stat-label">Total properties</p>
            <p className="ad-stat-num green">{totalProperties}</p>
          </div>
          <div className="ad-stat">
            <p className="ad-stat-label">Total bookings</p>
            <p className="ad-stat-num">{totalBookings}</p>
          </div>
          
          <div className="ad-stat">
            <p className="ad-stat-label">Pending approval</p>
            <p className="ad-stat-num amber">{pendingBookings.length}</p>
          </div>
          <div className="ad-stat">
            <p className="ad-stat-label">Total revenue</p>
            <p className="ad-stat-num purple">₱{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="ad-section-hdr" style={{ marginTop: '28px' }}>
        <h3>Analytics</h3>
        </div>

        <div style={{
        background: '#ffffff',
        border: '1.5px solid #d4f0e2',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '28px',
        boxShadow: '0 1px 3px rgba(10,61,43,0.08)'
        }}>
        <AnalyticsChart />
        </div>

        {/* Pending bookings table */}
        <div className="ad-section-hdr">
          <h3>Pending bookings</h3>
          <button className="ad-view-all" onClick={() => navigate('/admin/bookings')}>
            View all bookings →
          </button>
        </div>

        <div className="ad-table-wrap">
          {pendingBookings.length === 0 ? (
            <div className="ad-empty">No pending bookings — all caught up! 🎉</div>
          ) : (
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Renter</th>
                  <th>Property</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingBookings.map(booking => (
                  <tr key={booking.id}>
                    <td className="ad-td-name">{booking.renterName}</td>
                    <td>{booking.propertyTitle}</td>
                    <td>{formatDate(booking.checkIn)}</td>
                    <td>{formatDate(booking.checkOut)}</td>
                    <td className="ad-td-total">₱{booking.total.toLocaleString()}</td>
                    <td>
                      <button className="ad-approve-btn" onClick={() => handleApprove(booking.id)}>
                        Approve
                      </button>
                      <button className="ad-cancel-btn" onClick={() => handleCancel(booking.id)}>
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick actions */}
        <div className="ad-section-hdr"><h3>Quick actions</h3></div>
        <div className="ad-quick">
          <div className="ad-quick-card" onClick={() => navigate('/admin/listings')}>
            <div className="ad-quick-icon">🏠</div>
            <p className="ad-quick-label">Manage listings</p>
            <p className="ad-quick-sub">Add, edit, remove properties</p>
          </div>
          <div className="ad-quick-card" onClick={() => navigate('/admin/bookings')}>
            <div className="ad-quick-icon">📋</div>
            <p className="ad-quick-label">Manage bookings</p>
            <p className="ad-quick-sub">Approve or cancel bookings</p>
          </div>
          <div className="ad-quick-card" onClick={() => navigate('/admin/users')}>
            <div className="ad-quick-icon">👥</div>
            <p className="ad-quick-label">Manage users</p>
            <p className="ad-quick-sub">View and suspend renters</p>
          </div>
        </div>

      </div>
    </div>
  )
}