import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminListings.css'

const INITIAL_PROPERTIES = [
  { id: 1, title: 'Cozy Studio in Davao',  city: 'Davao City',         price: 850,  guests: 2, status: 'available',   description: 'A comfortable studio near major establishments.' },
  { id: 2, title: 'Modern Flat near Mall', city: 'Davao City',         price: 1200, guests: 4, status: 'available',   description: 'Spacious flat near SM Lanang.' },
  { id: 3, title: 'Beach House Samal',     city: 'Island Garden City', price: 2500, guests: 6, status: 'available',   description: 'Stunning beach house on Samal Island.' },
  { id: 4, title: 'Quiet Room Toril',      city: 'Davao City',         price: 600,  guests: 1, status: 'unavailable', description: 'Affordable private room in Toril.' },
  { id: 5, title: 'Family Home Calinan',   city: 'Davao City',         price: 1800, guests: 5, status: 'available',   description: 'Spacious family home in Calinan highlands.' },
  { id: 6, title: 'Studio in Tagum',       city: 'Tagum City',         price: 750,  guests: 2, status: 'available',   description: 'Cozy studio in the heart of Tagum City.' },
]

const EMPTY_FORM = { title: '', city: '', price: '', guests: '', description: '' }

export default function AdminListings() {
  const [properties, setProperties] = useState(INITIAL_PROPERTIES)
  const [showModal,  setShowModal]  = useState(false)
  const [editId,     setEditId]     = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [formError,  setFormError]  = useState('')
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('user')
    navigate('/')
  }

  function openAdd() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowModal(true)
  }

  function openEdit(property) {
    setEditId(property.id)
    setForm({
      title:       property.title,
      city:        property.city,
      price:       property.price,
      guests:      property.guests,
      description: property.description,
    })
    setFormError('')
    setShowModal(true)
  }

  function handleSave() {
    if (!form.title || !form.city || !form.price || !form.guests) {
      setFormError('Please fill in all required fields.')
      return
    }
    if (editId) {
      setProperties(prev => prev.map(p =>
        p.id === editId
          ? { ...p, ...form, price: Number(form.price), guests: Number(form.guests) }
          : p
      ))
    } else {
      setProperties(prev => [...prev, {
        id:          Date.now(),
        title:       form.title,
        city:        form.city,
        price:       Number(form.price),
        guests:      Number(form.guests),
        description: form.description,
        status:      'available',
      }])
    }
    setShowModal(false)
  }

  function handleToggle(id) {
    setProperties(prev => prev.map(p =>
      p.id === id
        ? { ...p, status: p.status === 'available' ? 'unavailable' : 'available' }
        : p
    ))
  }

  function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this property?')) return
    setProperties(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="al-page">

      <nav className="al-nav">
        <span className="al-logo">RentAPlace</span>
        <div className="al-nav-links">
          <button className="al-nav-btn" onClick={() => navigate('/admin/dashboard')}>Dashboard</button>
          <button className="al-nav-btn active">Listings</button>
          <button className="al-nav-btn" onClick={() => navigate('/admin/bookings')}>Bookings</button>
          <button className="al-nav-btn" onClick={() => navigate('/admin/users')}>Users</button>
          <button className="al-nav-btn logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="al-content">

        <div className="al-header">
          <div>
            <h2>Manage listings</h2>
            <p className="al-subheader">{properties.length} properties total</p>
          </div>
          <button className="al-add-btn" onClick={openAdd}>+ Add new property</button>
        </div>

        <div className="al-table-wrap">
          <table className="al-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>City</th>
                <th>Price / night</th>
                <th>Max guests</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map(property => (
                <tr key={property.id}>
                  <td className="al-td-title">{property.title}</td>
                  <td>{property.city}</td>
                  <td className="al-td-price">₱{property.price.toLocaleString()}</td>
                  <td>{property.guests} guests</td>
                  <td>
                    <span className={`al-badge ${property.status}`}>
                      {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                    </span>
                  </td>
                  <td className="al-td-actions">
                    <button
                      className={`al-toggle-btn ${property.status === 'available' ? 'on' : 'off'}`}
                      onClick={() => handleToggle(property.id)}
                    >
                      {property.status === 'available' ? 'Disable' : 'Enable'}
                    </button>
                    <button className="al-edit-btn" onClick={() => openEdit(property)}>
                      Edit
                    </button>
                    <button className="al-delete-btn" onClick={() => handleDelete(property.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="al-modal-bg" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="al-modal">
            <h3>{editId ? 'Edit property' : 'Add new property'}</h3>

            <label>Title <span className="al-required">*</span></label>
            <input type="text" placeholder="e.g. Cozy Studio in Davao"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />

            <label>City <span className="al-required">*</span></label>
            <input type="text" placeholder="e.g. Davao City"
              value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />

            <div className="al-form-row">
              <div>
                <label>Price per night (₱) <span className="al-required">*</span></label>
                <input type="number" placeholder="e.g. 850"
                  value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <label>Max guests <span className="al-required">*</span></label>
                <input type="number" placeholder="e.g. 2"
                  value={form.guests} onChange={e => setForm({ ...form, guests: e.target.value })} />
              </div>
            </div>

            <label>Description</label>
            <textarea placeholder="Describe the property..."
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

            {formError && <p className="al-form-error">{formError}</p>}

            <div className="al-modal-btns">
              <button className="al-close-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="al-save-btn" onClick={handleSave}>
                {editId ? 'Save changes' : 'Add property'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}