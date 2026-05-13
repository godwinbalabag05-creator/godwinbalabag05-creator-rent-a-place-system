import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './BrowsePage.css'
import useAuthGuard from '../hooks/useAuthGuard'


import { db, auth } from '../Firebase'
import { ref, onValue } from 'firebase/database'

const CARD_COLORS = ['#d1fae5','#EEEDFE','#fef3c7','#fee2e2','#dbeafe','#fce7f3']
const CARD_ICONS  = ['🏠','🏡','🏢','🏘️','🏗️','🛖']

export default function BrowsePage() {
  useAuthGuard('renter')
  const [properties, setProperties] = useState([])
  const [query,      setQuery]      = useState('')
  const [sort,       setSort]       = useState('')
  const [loading,    setLoading]    = useState(true)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!user.email) {
      navigate('/')
      return
    }

    // Listen to properties from Firebase
    const propertiesRef = ref(db, 'properties')

    const unsubscribe = onValue(propertiesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()

        const propertiesArray = Object.keys(data)
          .map(key => ({
            id:          key,
            title:       data[key].title       || '',
            city:        data[key].city        || '',
            price:       data[key].price       || 0,
            guests:      data[key].guests      || 0,
            description: data[key].description || '',
            status:      data[key].status      || 'available',
            createdAt:   data[key].createdAt   || '',
          }))
          // Only show available properties to renters
          .filter(p => p.status === 'available')

        setProperties(propertiesArray)
      } else {
        setProperties([])
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

  // Search filter
  let filtered = properties.filter(p =>
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.city.toLowerCase().includes(query.toLowerCase())
  )

  // Sort
  if (sort === 'asc')  filtered.sort((a, b) => a.price - b.price)
  if (sort === 'desc') filtered.sort((a, b) => b.price - a.price)

  return (
    <div className="bp-page">

      <nav className="bp-nav">
        <span className="bp-logo">RentAPlace</span>
        <div className="bp-nav-links">
          <button className="bp-nav-btn" onClick={() => navigate('/renter/dashboard')}>Dashboard</button>
          <button className="bp-nav-btn active">Browse</button>
          <button className="bp-nav-btn" onClick={() => navigate('/renter/bookings')}>My bookings</button>
          <button className="bp-nav-btn logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="bp-content">

        <div className="bp-search-row">
          <input
            type="text"
            placeholder="Search by city or title..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="">Sort: default</option>
            <option value="asc">Price: low to high</option>
            <option value="desc">Price: high to low</option>
          </select>
          <button className="bp-search-btn">Search</button>
        </div>

        {loading ? (
          <p className="bp-count">Loading properties...</p>
        ) : (
          <p className="bp-count">
            Showing {filtered.length} {filtered.length === 1 ? 'property' : 'properties'}
          </p>
        )}

        {loading ? (
          <div className="bp-grid">
            {[1,2,3].map(i => (
              <div key={i} className="bp-card" style={{ opacity: 0.4 }}>
                <div className="bp-card-img" style={{ background: '#d1fae5' }}>🏠</div>
                <div className="bp-card-body">
                  <p className="bp-card-title">Loading...</p>
                  <p className="bp-card-city">Please wait</p>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bp-empty">
            {query
              ? `No properties found for "${query}".`
              : 'No properties available right now.'
            }
          </div>
        ) : (
          <div className="bp-grid">
            {filtered.map((property, i) => (
              <div
                key={property.id}
                className="bp-card"
                onClick={() => navigate(`/property/${property.id}`)}
              >
                <div
                  className="bp-card-img"
                  style={{ background: CARD_COLORS[i % CARD_COLORS.length] }}
                >
                  {CARD_ICONS[i % CARD_ICONS.length]}
                </div>
                <div className="bp-card-body">
                  <p className="bp-card-title">{property.title}</p>
                  <p className="bp-card-city">{property.city}</p>
                  <div className="bp-card-footer">
                    <span className="bp-price">
                      ₱{Number(property.price).toLocaleString()}/night
                    </span>
                    <span className="bp-guests">{property.guests} guests</span>
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