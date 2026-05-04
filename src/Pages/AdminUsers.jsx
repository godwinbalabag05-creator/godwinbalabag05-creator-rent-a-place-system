import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminUsers.css'

const INITIAL_USERS = [
  { id: 1, name: 'Juan dela Cruz', email: 'renter@rent.com',  phone: '09171234567', bookings: 0, spent: 0,     status: 'active' },
  { id: 2, name: 'Maria Santos',   email: 'maria@email.com',  phone: '09281234567', bookings: 2, spent: 12500, status: 'active' },
  { id: 3, name: 'Carlo Reyes',    email: 'carlo@email.com',  phone: '09391234567', bookings: 1, spent: 2400,  status: 'suspended' },
  { id: 4, name: 'Ana Gomez',      email: 'ana@email.com',    phone: '09451234567', bookings: 4, spent: 21000, status: 'active' },
]

export default function AdminUsers() {
  const [users,   setUsers]   = useState(INITIAL_USERS)
  const [query,   setQuery]   = useState('')
  const [bookings, setBookings] = useState([])
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!user.email || user.role !== 'admin') navigate('/')
    // Load real bookings to show accurate stats per user
    const stored = JSON.parse(localStorage.getItem('bookings') || '[]')
    setBookings(stored)
    // Update Juan's stats from real localStorage bookings
    const juanBookings = stored.filter(b => b.renterEmail === 'renter@rent.com')
    const juanSpent    = juanBookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.total, 0)
    setUsers(prev => prev.map(u =>
      u.email === 'renter@rent.com'
        ? { ...u, bookings: juanBookings.length, spent: juanSpent }
        : u
    ))
  }, [])

  function handleLogout() {
    localStorage.removeItem('user')
    navigate('/')
  }

  function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function handleToggle(id) {
    setUsers(prev => prev.map(u =>
      u.id === id
        ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' }
        : u
    ))
  }

  const filtered       = users.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  )
  const totalCount     = users.length
  const activeCount    = users.filter(u => u.status === 'active').length
  const suspendedCount = users.filter(u => u.status === 'suspended').length

  return (
    <div className="au-page">

      <nav className="au-nav">
        <span className="au-logo">RentAPlace</span>
        <div className="au-nav-links">
          <button className="au-nav-btn" onClick={() => navigate('/admin/dashboard')}>Dashboard</button>
          <button className="au-nav-btn" onClick={() => navigate('/admin/listings')}>Listings</button>
          <button className="au-nav-btn" onClick={() => navigate('/admin/bookings')}>Bookings</button>
          <button className="au-nav-btn active">Users</button>
          <button className="au-nav-btn logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="au-content">

        <div className="au-header">
          <div>
            <h2>Manage users</h2>
            <p className="au-subheader">{totalCount} registered renters</p>
          </div>
        </div>

        {/* Stats */}
        <div className="au-stats">
          <div className="au-stat">
            <p className="au-stat-label">Total renters</p>
            <p className="au-stat-num">{totalCount}</p>
          </div>
          <div className="au-stat">
            <p className="au-stat-label">Active</p>
            <p className="au-stat-num active-c">{activeCount}</p>
          </div>
          <div className="au-stat">
            <p className="au-stat-label">Suspended</p>
            <p className="au-stat-num suspended">{suspendedCount}</p>
          </div>
        </div>

        {/* Search */}
        <div className="au-search-row">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="au-table-wrap">
          {filtered.length === 0 ? (
            <div className="au-empty">No users found.</div>
          ) : (
            <table className="au-table">
              <thead>
                <tr>
                  <th>Renter</th>
                  <th>Phone</th>
                  <th>Bookings</th>
                  <th>Total spent</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="au-avatar-cell">
                        <div className={`au-avatar${u.status === 'suspended' ? ' suspended' : ''}`}>
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <div className="au-name">{u.name}</div>
                          <div className="au-email">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.phone}</td>
                    <td className="au-td-bookings">{u.bookings}</td>
                    <td className="au-td-spent">₱{u.spent.toLocaleString()}</td>
                    <td>
                      <span className={`au-badge ${u.status}`}>
                        {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      {u.status === 'active' ? (
                        <button className="au-suspend-btn" onClick={() => handleToggle(u.id)}>
                          Suspend
                        </button>
                      ) : (
                        <button className="au-restore-btn" onClick={() => handleToggle(u.id)}>
                          Restore
                        </button>
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