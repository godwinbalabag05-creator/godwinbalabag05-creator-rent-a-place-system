import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../Firebase'
import { ref, onValue, update } from 'firebase/database'
import './NotificationBell.css'

export default function NotificationBell({ userUID, isAdmin = false }) {
  const [notifications, setNotifications] = useState([])
  const [open,          setOpen]          = useState(false)
  const dropRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!userUID) return

    const notifsRef = ref(db, `notifications/${userUID}`)
    const unsubscribe = onValue(notifsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const arr = Object.keys(data).map(key => ({
          id:        key,
          ...data[key]
        }))
        arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setNotifications(arr)
      } else {
        setNotifications([])
      }
    })
    return () => unsubscribe()
  }, [userUID])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function markAsRead(notifId) {
    await update(ref(db, `notifications/${userUID}/${notifId}`), { isRead: true })
  }

  async function markAllAsRead() {
    const unread = notifications.filter(n => !n.isRead)
    for (const n of unread) {
      await update(ref(db, `notifications/${userUID}/${n.id}`), { isRead: true })
    }
  }

  function getIcon(type) {
    switch (type) {
      case 'pending':   return '📋'
      case 'approved':  return '✅'
      case 'cancelled': return '❌'
      case 'completed': return '🏠'
      case 'suspended': return '🔒'
      case 'restored':  return '✅'
      case 'appeal':    return '📩'
      default:          return '🔔'
    }
  }

  function getIconBg(type) {
    switch (type) {
      case 'approved':
      case 'restored':
      case 'completed': return '#d1fae5'
      case 'suspended':
      case 'cancelled': return '#fef2f2'
      case 'appeal':    return '#EEEDFE'
      default:          return '#fef3c7'
    }
  }

  function timeAgo(dateStr) {
    const now  = new Date()
    const date = new Date(dateStr)
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60)   return 'Just now'
    if (diff < 3600) return Math.floor(diff / 60) + ' min ago'
    if (diff < 86400) return Math.floor(diff / 3600) + ' hr ago'
    return Math.floor(diff / 86400) + ' day ago'
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="nb-wrap" ref={dropRef}>
      <button
        className="nb-bell"
        onClick={() => setOpen(prev => !prev)}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="nb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="nb-dropdown">
          <div className="nb-header">
            <span className="nb-header-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="nb-mark-all" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="nb-empty">No notifications yet</div>
          ) : (
            <div className="nb-list">
              {notifications.slice(0, 10).map(n => (
                <div
                  key={n.id}
                  className={`nb-item${n.isRead ? '' : ' unread'}`}
                  onClick={() => {
                    markAsRead(n.id)
                    // Navigate to relevant page
                    if (isAdmin) {
                      if (n.type === 'pending' || n.type === 'appeal') navigate('/admin/bookings')
                    } else {
                      navigate('/renter/bookings')
                    }
                    setOpen(false)
                  }}
                >
                  <div
                    className="nb-icon"
                    style={{ background: getIconBg(n.type) }}
                  >
                    {getIcon(n.type)}
                  </div>
                  <div className="nb-body">
                    <p className="nb-title">{n.title}</p>
                    <p className="nb-sub">{n.message}</p>
                    <p className="nb-time">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <div className="nb-dot" />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}