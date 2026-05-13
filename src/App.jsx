import { useState } from 'react'
import { Route, Routes, BrowserRouter } from 'react-router-dom'

import LandingPage from "./Pages/LandingPage"
import BrowsePage from './Pages/BrowsePage'
import PropertyDetail from './Pages/PropertyDetail'
import BookingForm from './Pages/BookingForm'
import MyBookings from './Pages/MyBookings'
import RenterDashboard from './Pages/RenterDashboard'
import AdminDashboard from './Pages/AdminDashboard'
import AdminListings from './Pages/AdminListings'
import AdminBookings from './Pages/AdminBookings'
import AdminUsers from './Pages/AdminUsers'
import PayPage from './Pages/PayPage'








function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/pay/:transactionID" element={ <PayPage />} /> 

        <Route path="/" element={<LandingPage />} /> 

        <Route path="/renter/browse" element={<BrowsePage />} />

        <Route path="/property/:id" element={<PropertyDetail />} />

        <Route path="/renter/book/:id" element={<BookingForm />} />

        <Route path="/renter/bookings" element={<MyBookings />} />

        <Route path="/renter/dashboard" element={<RenterDashboard />} />

        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        
        <Route path="/admin/listings" element={<AdminListings />} />

        <Route path="/admin/bookings" element={<AdminBookings />} />

        <Route path="/admin/users" element={<AdminUsers />} />


      </Routes>
    </BrowserRouter>
  )
}

export default App