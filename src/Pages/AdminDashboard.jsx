import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminDashboard.css'
import AnalyticsChart from '../components/AnalyticsChart'
import useAuthGuard from '../hooks/useAuthGuard'

import { db, auth } from '../Firebase'
import { ref, onValue, update } from 'firebase/database'

export default function AdminDashboard() {
  useAuthGuard('admin')
  const [bookings,   setBookings]   = useState([])
  const [properties, setProperties] = useState([])
  const [loading,    setLoading]    = useState(true)
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
    if (!user.email || user.role !== 'admin') {
      navigate('/')
      return
    }

    // Listen to bookings in real time
    const bookingsRef = ref(db, 'bookings')
    const unsubscribeBookings = onValue(bookingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const bookingsArray = Object.keys(data).map(key => ({
          id:            key,
          ref:           data[key].ref           || '',
          renterName:    data[key].renterName    || 'Unknown',
          renterEmail:   data[key].renterEmail   || '',
          propertyTitle: data[key].propertyTitle || '',
          propertyCity:  data[key].propertyCity  || '',
          checkIn:       data[key].checkIn       || '',
          checkOut:      data[key].checkOut      || '',
          nights:        data[key].nights        || 0,
          total:         data[key].total         || 0,
          status:        data[key].status        || 'pending',
          paymentStatus: data[key].paymentStatus || 'pending',
          createdAt:     data[key].createdAt     || '',
        }))
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

    // Listen to properties in real time
    const propertiesRef = ref(db, 'properties')
    const unsubscribeProperties = onValue(propertiesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const propertiesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }))
        setProperties(propertiesArray)
      } else {
        setProperties([])
      }
    })

    return () => {
      unsubscribeBookings()
      unsubscribeProperties()
    }
  }, [])

  function handleLogout() {
    localStorage.removeItem('user')
    auth.signOut()
    navigate('/')
  }

  async function handleApprove(bookingId) {
    try {
      await update(ref(db, `bookings/${bookingId}`), {
        status: 'approved'
      })
    } catch (error) {
      console.log(error)
      alert('Failed to approve booking.')
    }
  }

  async function handleCancel(bookingId) {
    try {
      await update(ref(db, `bookings/${bookingId}`), {
        status: 'cancelled'
      })
    } catch (error) {
      console.log(error)
      alert('Failed to cancel booking.')
    }
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

  const totalProperties  = properties.length
  const totalBookings    = bookings.length
  const pendingBookings  = bookings.filter(b => b.status === 'pending')
  const completedCount   = bookings.filter(b => b.status === 'completed').length

  // ── Feature 3: Revenue counts from paymentStatus === 'paid' ──
  const totalRevenue = bookings
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + Number(b.total), 0)

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
            <h2>Welcome, {user.name || 'Admin'}!</h2>
            <p>{getTodayString()} — Here's what needs your attention today.</p>
          </div>
          <div className="ad-avatar">
            {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
        </div>

        {/* Stats */}
        <div className="ad-stats">
          <div className="ad-stat">
            <p className="ad-stat-label">Total properties</p>
            <p className="ad-stat-num green">
              {loading ? '...' : totalProperties}
            </p>
          </div>
          <div className="ad-stat">
            <p className="ad-stat-label">Total bookings</p>
            <p className="ad-stat-num">
              {loading ? '...' : totalBookings}
            </p>
          </div>
          <div className="ad-stat">
            <p className="ad-stat-label">Pending approval</p>
            <p className="ad-stat-num amber">
              {loading ? '...' : pendingBookings.length}
            </p>
          </div>
          <div className="ad-stat">
            <p className="ad-stat-label">Completed stays</p>
            <p className="ad-stat-num purple">
              {loading ? '...' : completedCount}
            </p>
          </div>
          <div className="ad-stat">
            <p className="ad-stat-label">Total revenue</p>
            <p className="ad-stat-num green">
              {loading ? '...' : '₱' + totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Analytics Chart */}
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
          <AnalyticsChart bookings={bookings} />
        </div>

        {/* Pending bookings table */}
        <div className="ad-section-hdr">
          <h3>Pending bookings</h3>
          <button className="ad-view-all" onClick={() => navigate('/admin/bookings')}>
            View all bookings →
          </button>
        </div>

        <div className="ad-table-wrap">
          {loading ? (
            <div className="ad-empty">Loading bookings...</div>
          ) : pendingBookings.length === 0 ? (
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
                    <td className="ad-td-total">
                      ₱{Number(booking.total).toLocaleString()}
                    </td>
                    <td>
                      <button
                        className="ad-approve-btn"
                        onClick={() => handleApprove(booking.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="ad-cancel-btn"
                        onClick={() => handleCancel(booking.id)}
                      >
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