import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import './PropertyDetail.css'

const MOCK_PROPERTIES = [
  {
    id: 1, title: 'Cozy Studio in Davao', city: 'Davao City',
    price: 850, guests: 2, type: 'Studio',
    description: 'A comfortable and fully furnished studio unit perfect for solo travelers or couples. Located near major establishments, restaurants, and public transport. Includes free WiFi, air conditioning, and a private bathroom.',
    amenities: ['WiFi', 'Air con', 'Private bath', 'Kitchen'],
  },
  {
    id: 2, title: 'Modern Flat near Mall', city: 'Davao City',
    price: 1200, guests: 4, type: 'Flat',
    description: 'Spacious modern flat just 5 minutes from SM Lanang. Perfect for small families or groups. Features a fully equipped kitchen and a cozy living area.',
    amenities: ['WiFi', 'Air con', 'Kitchen', 'Parking'],
  },
  {
    id: 3, title: 'Beach House Samal', city: 'Island Garden City',
    price: 2500, guests: 6, type: 'Beach House',
    description: 'Wake up to ocean views in this stunning beach house on Samal Island. Perfect for family getaways. Comes with a private deck and beach access.',
    amenities: ['Beach access', 'WiFi', 'BBQ area', 'Air con'],
  },
  {
    id: 4, title: 'Quiet Room Toril', city: 'Davao City',
    price: 600, guests: 1, type: 'Room',
    description: 'A quiet and affordable private room in a peaceful neighborhood in Toril. Great for solo travelers on a budget.',
    amenities: ['WiFi', 'Fan', 'Shared bath'],
  },
  {
    id: 5, title: 'Family Home Calinan', city: 'Davao City',
    price: 1800, guests: 5, type: 'House',
    description: 'A spacious family home in the cool highlands of Calinan. Features a garden, multiple bedrooms, and a large living space.',
    amenities: ['WiFi', 'Air con', 'Garden', 'Kitchen', 'Parking'],
  },
  {
    id: 6, title: 'Studio in Tagum', city: 'Tagum City',
    price: 750, guests: 2, type: 'Studio',
    description: 'A cozy studio unit in the heart of Tagum City. Walking distance to restaurants, malls, and transport hubs.',
    amenities: ['WiFi', 'Air con', 'Private bath'],
  },
]

export default function PropertyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const property = MOCK_PROPERTIES.find(p => p.id === parseInt(id))

  function handleLogout() {
    localStorage.removeItem('user')
    navigate('/')
  }

  if (!property) {
    return (
      <div className="pd-page">
        <nav className="pd-nav">
          <span className="pd-logo">RentAPlace</span>
        </nav>
        <div className="pd-content">
          <p className="pd-not-found">
            Property not found.{' '}
            <span onClick={() => navigate('/renter/browse')}>Go back to browse</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="pd-page">
      <nav className="pd-nav">
        <span className="pd-logo">RentAPlace</span>
        <div className="pd-nav-links">
          <button className="pd-nav-btn" onClick={() => navigate('/renter/dashboard')}>Dashboard</button>
          <button className="pd-nav-btn active" onClick={() => navigate('/renter/browse')}>Browse</button>
          <button className="pd-nav-btn" onClick={() => navigate('/renter/bookings')}>My bookings</button>
          <button className="pd-nav-btn logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="pd-content">
        <div className="pd-hero">🏠</div>

        <div className="pd-body">
          <div className="pd-info">
            <h1 className="pd-title">{property.title}</h1>
            <p className="pd-city">📍 {property.city}</p>

            <div className="pd-tags">
              <span className="pd-tag">{property.guests} guests</span>
              <span className="pd-tag">Available</span>
              <span className="pd-tag">{property.type}</span>
            </div>

            <p className="pd-section-label">About this place</p>
            <p className="pd-desc">{property.description}</p>

            <p className="pd-section-label">Amenities</p>
            <div className="pd-tags">
              {property.amenities.map(a => (
                <span key={a} className="pd-tag">{a}</span>
              ))}
            </div>
          </div>

          <BookingPanel property={property} />
        </div>
      </div>
    </div>
  )
}

function BookingPanel({ property }) {
  const navigate = useNavigate()
  const [checkIn, setCheckIn]   = useState('')
  const [checkOut, setCheckOut] = useState('')

  const nights = checkIn && checkOut
    ? Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
    : 0
  const total = nights > 0 ? property.price * nights : 0

  function handleBookNow() {
    if (!checkIn || !checkOut || nights <= 0) {
      alert('Please select valid check-in and check-out dates.')
      return
    }
    navigate(`/renter/book/${property.id}`, {
      state: { checkIn, checkOut, nights, total, property }
    })
  }

  return (
    <div className="pd-book">
      <p className="pd-price-big">₱{property.price.toLocaleString()}</p>
      <p className="pd-per">per night</p>

      <label>Check-in</label>
      <input type="date" value={checkIn}  onChange={e => setCheckIn(e.target.value)}  />

      <label>Check-out</label>
      <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} />

      <hr className="pd-divider" />

      <div className="pd-total-row">
        <span>Nights</span>
        <span>{nights > 0 ? nights : '—'}</span>
      </div>
      <div className="pd-total-row">
        <span>₱{property.price.toLocaleString()} × {nights > 0 ? nights : '—'}</span>
        <span>{total > 0 ? '₱' + total.toLocaleString() : '—'}</span>
      </div>

      <hr className="pd-divider" />

      <div className="pd-total-big">
        <span>Total</span>
        <span>{total > 0 ? '₱' + total.toLocaleString() : '—'}</span>
      </div>

      <button className="pd-book-btn" onClick={handleBookNow}>
        Book now →
      </button>
    </div>
  )
}