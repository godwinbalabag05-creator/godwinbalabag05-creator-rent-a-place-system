import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminUsers.css'
import useAuthGuard from '../hooks/useAuthGuard'
import NotificationBell from '../components/NotificationBell'

import { db, auth } from '../Firebase'
import { ref, onValue, update } from 'firebase/database'

export default function AdminUsers() {
  useAuthGuard('admin')
  const [users,         setUsers]         = useState([])
  const [query,         setQuery]         = useState('')
  const [loading,       setLoading]       = useState(true)
  const [showModal,     setShowModal]     = useState(false)
  const [selectedUser,  setSelectedUser]  = useState(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [suspending,    setSuspending]    = useState(false)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!user.email || user.role !== 'admin') {
      navigate('/')
      return
    }

    const usersRef = ref(db, 'users')
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const usersArray = Object.keys(data).map((key) => {
          const currentUser = data[key]
          return {
            id:          key,
            firebaseUID: key,
            UID:         currentUser.UID         || '',
            name:        currentUser.name        || 'No Name',
            email:       currentUser.email       || '',
            phone:       currentUser.phone       || 'N/A',
            role:        currentUser.role        || 'renter',
            createdAt:   currentUser.createdAt   || '',
            bookings:    currentUser.bookings    || 0,
            spent:       currentUser.spent       || 0,
            status:      currentUser.status      || 'active',
            suspendReason: currentUser.suspendReason || '',
          }
        })
        setUsers(usersArray.filter(u => u.role === 'renter'))
      } else {
        setUsers([])
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
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Open suspend modal
  function openSuspendModal(u) {
    setSelectedUser(u)
    setSuspendReason('')
    setShowModal(true)
  }

  // Confirm suspend with reason
  async function handleSuspend() {
    if (!suspendReason.trim()) return
    setSuspending(true)
    try {
      await update(ref(db, `users/${selectedUser.firebaseUID}`), {
        status:        'suspended',
        suspendReason: suspendReason.trim(),
        suspendedAt:   new Date().toISOString(),
      })

      // Save notification for the renter
      await import('firebase/database').then(({ push, ref: fbRef }) => {
        push(fbRef(db, `notifications/${selectedUser.firebaseUID}`), {
          type:      'suspended',
          title:     'Account suspended',
          message:   `Your account has been suspended. Reason: ${suspendReason.trim()}`,
          isRead:    false,
          createdAt: new Date().toISOString(),
        })
      })

      setShowModal(false)
      setSuspendReason('')
      setSelectedUser(null)
    } catch (error) {
      console.log(error)
      alert('Failed to suspend user.')
    }
    setSuspending(false)
  }

  // Restore user
  async function handleRestore(userId) {
    try {
      await update(ref(db, `users/${userId}`), {
        status:        'active',
        suspendReason: '',
        suspendedAt:   '',
      })

      // Find user to notify
      const u = users.find(x => x.firebaseUID === userId)
      if (u) {
        const { push: fbPush, ref: fbRef } = await import('firebase/database')
        fbPush(fbRef(db, `notifications/${userId}`), {
          type:      'restored',
          title:     'Account restored',
          message:   'Your account has been restored by the admin. You can now login.',
          isRead:    false,
          createdAt: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.log(error)
      alert('Failed to restore user.')
    }
  }

  const filtered = users.filter(u =>
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
          <NotificationBell userUID={user.firebaseUID} isAdmin={true} />
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

        <div className="au-search-row">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div className="au-table-wrap">
          {loading ? (
            <div className="au-empty">Loading users...</div>
          ) : filtered.length === 0 ? (
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
                  <th>Suspend reason</th>
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
                    <td className="au-td-spent">₱{Number(u.spent).toLocaleString()}</td>
                    <td>
                      <span className={`au-badge ${u.status}`}>
                        {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      {u.suspendReason ? (
                        <span className="au-reason">{u.suspendReason}</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td>
                      {u.status === 'active' ? (
                        <button className="au-suspend-btn" onClick={() => openSuspendModal(u)}>
                          Suspend
                        </button>
                      ) : (
                        <button className="au-restore-btn" onClick={() => handleRestore(u.firebaseUID)}>
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

      {/* Suspend Modal */}
      {showModal && selectedUser && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(10,61,43,0.4)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 200, padding: '1rem'
          }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
        >
          <div style={{
            background: '#ffffff', borderRadius: '16px',
            padding: '2rem', width: '100%', maxWidth: '440px',
            boxShadow: '0 8px 32px rgba(10,61,43,0.15)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0A3D2B', marginBottom: '6px' }}>
              Suspend user
            </h3>
            <p style={{ fontSize: '13px', color: '#6b9e84', marginBottom: '1.25rem' }}>
              You are about to suspend <strong>{selectedUser.name}</strong>. Please provide a reason — this will be shown to the user.
            </p>

            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b9e84', marginBottom: '6px' }}>
              Reason for suspension
            </label>
            <textarea
              placeholder="e.g. Violation of terms, suspicious activity..."
              value={suspendReason}
              onChange={e => setSuspendReason(e.target.value)}
              style={{
                width: '100%', padding: '11px 14px',
                border: '1.5px solid #d4f0e2', borderRadius: '12px',
                fontSize: '14px', fontFamily: 'inherit',
                color: '#0A3D2B', background: '#fff',
                outline: 'none', boxSizing: 'border-box',
                resize: 'vertical', minHeight: '110px', lineHeight: '1.6'
              }}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '1.25rem' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: '11px', background: '#fff',
                  border: '1.5px solid #d4f0e2', borderRadius: '30px',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  color: '#6b9e84', fontFamily: 'inherit'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={suspending || !suspendReason.trim()}
                style={{
                  flex: 1, padding: '11px',
                  background: 'linear-gradient(135deg,#dc2626,#f87171)',
                  border: 'none', borderRadius: '30px',
                  color: '#fff', fontSize: '14px', fontWeight: '700',
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 3px 0 #991b1b', opacity: !suspendReason.trim() ? 0.5 : 1
                }}
              >
                {suspending ? 'Suspending...' : 'Confirm suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}