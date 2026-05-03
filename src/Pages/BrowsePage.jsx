import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './BrowsePage.css'

const MOCK_PROPERTIES = [
  { id: 1, title: 'Cozy Studio in Davao', city: 'Davao City', price: 850, guests: 2 },
  { id: 2, title: 'Modern Flat near Mall', city: 'Davao City', price: 1200, guests: 4 },
  { id: 3, title: 'Beach House Samal', city: 'Island Garden City', price: 2500, guests: 6 },
  { id: 4, title: 'Quiet Room Toril', city: 'Davao City', price: 600, guests: 1 },
  { id: 5, title: 'Family Home Calinan', city: 'Davao City', price: 1800, guests: 5 },
  { id: 6, title: 'Studio in Tagum', city: 'Tagum City', price: 750, guests: 2 },
]

export default function BrowsePage() {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('')
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  function handleLogout() {
    localStorage.removeItem('user')
    navigate('/')
  }

  let filtered = MOCK_PROPERTIES.filter(p =>
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.city.toLowerCase().includes(query.toLowerCase())
  )
  if (sort === 'asc') filtered.sort((a, b) => a.price - b.price)
  if (sort === 'desc') filtered.sort((a, b) => b.price - a.price)

  return (
    <div className="bp-page">

      <nav className="bp-nav">
  <span className="bp-logo">RentAPlace</span>
  <div className="bp-nav-right">
    <span onClick={() => navigate('/renter/dashboard')} className="bp-nav-link">Dashboard</span>
    <span className="bp-nav-link active">Browse</span>
    <span onClick={() => navigate('/renter/bookings')} className="bp-nav-link">My bookings</span>
    <button onClick={handleLogout} className="bp-logout">Logout</button>
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
        </div>

        <p className="bp-count">
          Showing {filtered.length} {filtered.length === 1 ? 'property' : 'properties'}
        </p>

        {filtered.length === 0 ? (
          <p className="bp-empty">No properties found.</p>
        ) : (
          <div className="bp-grid">
            {filtered.map(property => (
              <div
                key={property.id}
                className="bp-card"
                onClick={() => navigate(`/property/${property.id}`)}
              >
                <div className="bp-card-img">
                  <span>🏠</span>
                </div>
                <div className="bp-card-body">
                  <h3>{property.title}</h3>
                  <p className="bp-city">{property.city}</p>
                  <div className="bp-card-footer">
                    <span className="bp-price">₱{property.price.toLocaleString()}/night</span>
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