import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminUsers.css'

import { db } from '../Firebase'
import { auth } from '../Firebase'

import {
  ref,
  onValue,
  update
} from 'firebase/database'

export default function AdminUsers() {

  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {

    // Protect admin route
    if (!user.email || user.role !== 'admin') {
      navigate('/')
      return
    }

    // Fetch users from Firebase
    const usersRef = ref(db, 'users')

    const unsubscribe = onValue(usersRef, (snapshot) => {

      if (snapshot.exists()) {

        const data = snapshot.val()

        const usersArray = Object.keys(data).map((key, index) => {

          const currentUser = data[key]

          return {
            id: key,
            firebaseUID: key,
            UID: currentUser.UID || '',
            name: currentUser.name || 'No Name',
            email: currentUser.email || '',
            phone: currentUser.phone || 'N/A',
            role: currentUser.role || 'renter',
            createdAt: currentUser.createdAt || '',
            bookings: currentUser.bookings || 0,
            spent: currentUser.spent || 0,
            status: currentUser.status || 'active'
          }
        })

        // Optional: only show renters
        const rentersOnly = usersArray.filter(
          u => u.role === 'renter'
        )

        setUsers(rentersOnly)

      } else {
        setUsers([])
      }

      setLoading(false)

    })

    return () => unsubscribe()

  }, [])

  // LOGOUT
  function handleLogout() {
    localStorage.removeItem('user')
    auth.signOut()
    navigate('/')
  }

  // USER INITIALS
  function getInitials(name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // TOGGLE USER STATUS
  async function handleToggle(userId, currentStatus) {

    try {

      const newStatus =
        currentStatus === 'active'
          ? 'suspended'
          : 'active'

      await update(
        ref(db, `users/${userId}`),
        {
          status: newStatus
        }
      )

    } catch (error) {
      console.log(error)
      alert('Failed to update user status.')
    }
  }

  // SEARCH FILTER
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  )

  // STATS
  const totalCount = users.length

  const activeCount = users.filter(
    u => u.status === 'active'
  ).length

  const suspendedCount = users.filter(
    u => u.status === 'suspended'
  ).length

  return (
    <div className="au-page">

      {/* NAVBAR */}
      <nav className="au-nav">

        <span className="au-logo">
          RentAPlace
        </span>

        <div className="au-nav-links">

          <button
            className="au-nav-btn"
            onClick={() => navigate('/admin/dashboard')}
          >
            Dashboard
          </button>

          <button
            className="au-nav-btn"
            onClick={() => navigate('/admin/listings')}
          >
            Listings
          </button>

          <button
            className="au-nav-btn"
            onClick={() => navigate('/admin/bookings')}
          >
            Bookings
          </button>

          <button className="au-nav-btn active">
            Users
          </button>

          <button
            className="au-nav-btn logout"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </nav>

      {/* CONTENT */}
      <div className="au-content">

        {/* HEADER */}
        <div className="au-header">

          <div>
            <h2>Manage users</h2>

            <p className="au-subheader">
              {totalCount} registered renters
            </p>
          </div>

        </div>

        {/* STATS */}
        <div className="au-stats">

          <div className="au-stat">
            <p className="au-stat-label">
              Total renters
            </p>

            <p className="au-stat-num">
              {totalCount}
            </p>
          </div>

          <div className="au-stat">
            <p className="au-stat-label">
              Active
            </p>

            <p className="au-stat-num active-c">
              {activeCount}
            </p>
          </div>

          <div className="au-stat">
            <p className="au-stat-label">
              Suspended
            </p>

            <p className="au-stat-num suspended">
              {suspendedCount}
            </p>
          </div>

        </div>

        {/* SEARCH */}
        <div className="au-search-row">

          <input
            type="text"
            placeholder="Search by name or email..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />

        </div>

        {/* TABLE */}
        <div className="au-table-wrap">

          {loading ? (

            <div className="au-empty">
              Loading users...
            </div>

          ) : filtered.length === 0 ? (

            <div className="au-empty">
              No users found.
            </div>

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

                        <div className={`au-avatar ${u.status === 'suspended'
                          ? 'suspended'
                          : ''
                          }`}
                        >
                          {getInitials(u.name)}
                        </div>

                        <div>

                          <div className="au-name">
                            {u.name}
                          </div>

                          <div className="au-email">
                            {u.email}
                          </div>

                        </div>

                      </div>

                    </td>

                    <td>
                      {u.phone}
                    </td>

                    <td className="au-td-bookings">
                      {u.bookings}
                    </td>

                    <td className="au-td-spent">
                      ₱{Number(u.spent).toLocaleString()}
                    </td>

                    <td>

                      <span className={`au-badge ${u.status}`}>
                        {u.status.charAt(0).toUpperCase() +
                          u.status.slice(1)}
                      </span>

                    </td>

                    <td>

                      {u.status === 'active' ? (

                        <button
                          className="au-suspend-btn"
                          onClick={() =>
                            handleToggle(
                              u.firebaseUID,
                              u.status
                            )
                          }
                        >
                          Suspend
                        </button>

                      ) : (

                        <button
                          className="au-restore-btn"
                          onClick={() =>
                            handleToggle(
                              u.firebaseUID,
                              u.status
                            )
                          }
                        >
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