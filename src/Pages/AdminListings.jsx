import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminListings.css'
import useAuthGuard from '../hooks/useAuthGuard'

import { db, auth } from '../Firebase'
import { ref, onValue, push, update, remove } from 'firebase/database'

const EMPTY_FORM = { title: '', city: '', price: '', guests: '', description: '' }

export default function AdminListings() {
  useAuthGuard('admin')
  const [properties, setProperties] = useState([])
  const [showModal,  setShowModal]  = useState(false)
  const [editId,     setEditId]     = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [formError,  setFormError]  = useState('')
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!user.email || user.role !== 'admin') {
      navigate('/')
      return
    }

    // Listen to properties in real time
    const propertiesRef = ref(db, 'properties')

    const unsubscribe = onValue(propertiesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const propertiesArray = Object.keys(data).map(key => ({
          id:          key,
          title:       data[key].title       || '',
          city:        data[key].city        || '',
          price:       data[key].price       || 0,
          guests:      data[key].guests      || 0,
          description: data[key].description || '',
          status:      data[key].status      || 'available',
          createdAt:   data[key].createdAt   || '',
        }))

        // Sort by newest first
        propertiesArray.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        )

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

  async function handleSave() {
    if (!form.title || !form.city || !form.price || !form.guests) {
      setFormError('Please fill in all required fields.')
      return
    }

    setSaving(true)

    try {
      if (editId) {
        // Update existing property in Firebase
        await update(ref(db, `properties/${editId}`), {
          title:       form.title,
          city:        form.city,
          price:       Number(form.price),
          guests:      Number(form.guests),
          description: form.description,
        })
      } else {
        // Add new property to Firebase
        await push(ref(db, 'properties'), {
          title:       form.title,
          city:        form.city,
          price:       Number(form.price),
          guests:      Number(form.guests),
          description: form.description,
          status:      'available',
          createdAt:   new Date().toISOString(),
        })
      }

      setShowModal(false)

    } catch (error) {
      console.log(error)
      setFormError('Failed to save property. Please try again.')
    }

    setSaving(false)
  }

  async function handleToggle(propertyId, currentStatus) {
    try {
      const newStatus = currentStatus === 'available' ? 'unavailable' : 'available'
      await update(ref(db, `properties/${propertyId}`), {
        status: newStatus
      })
    } catch (error) {
      console.log(error)
      alert('Failed to update property status.')
    }
  }

  async function handleDelete(propertyId) {
    if (!window.confirm('Are you sure you want to delete this property?')) return
    try {
      await remove(ref(db, `properties/${propertyId}`))
    } catch (error) {
      console.log(error)
      alert('Failed to delete property.')
    }
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
            <p className="al-subheader">
              {loading ? 'Loading...' : `${properties.length} properties total`}
            </p>
          </div>
          <button className="al-add-btn" onClick={openAdd}>
            + Add new property
          </button>
        </div>

        <div className="al-table-wrap">
          {loading ? (
            <div className="al-empty">Loading properties...</div>
          ) : properties.length === 0 ? (
            <div className="al-empty">
              No properties yet. Click "Add new property" to get started!
            </div>
          ) : (
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
                    <td className="al-td-price">
                      ₱{Number(property.price).toLocaleString()}
                    </td>
                    <td>{property.guests} guests</td>
                    <td>
                      <span className={`al-badge ${property.status}`}>
                        {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                      </span>
                    </td>
                    <td className="al-td-actions">
                      <button
                        className={`al-toggle-btn ${property.status === 'available' ? 'on' : 'off'}`}
                        onClick={() => handleToggle(property.id, property.status)}
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
          )}
        </div>

      </div>

      {/* Modal */}
      {showModal && (
        <div className="al-modal-bg" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="al-modal">
            <h3>{editId ? 'Edit property' : 'Add new property'}</h3>

            <label>Title <span className="al-required">*</span></label>
            <input
              type="text"
              placeholder="e.g. Cozy Studio in Davao"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />

            <label>City <span className="al-required">*</span></label>
            <input
              type="text"
              placeholder="e.g. Davao City"
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
            />

            <div className="al-form-row">
              <div>
                <label>Price per night (₱) <span className="al-required">*</span></label>
                <input
                  type="number"
                  placeholder="e.g. 850"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div>
                <label>Max guests <span className="al-required">*</span></label>
                <input
                  type="number"
                  placeholder="e.g. 2"
                  value={form.guests}
                  onChange={e => setForm({ ...form, guests: e.target.value })}
                />
              </div>
            </div>

            <label>Description</label>
            <textarea
              placeholder="Describe the property..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />

            {formError && <p className="al-form-error">{formError}</p>}

            <div className="al-modal-btns">
              <button
                className="al-close-btn"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="al-save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : editId ? 'Save changes' : 'Add property'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}