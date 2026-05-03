import { useState } from 'react'
import { Route, Routes, BrowserRouter } from 'react-router-dom'

import LandingPage from "./Pages/LandingPage"
import BrowsePage from './Pages/BrowsePage'
import PropertyDetail from './Pages/PropertyDetail'
import BookingForm from './Pages/BookingForm'
import MyBookings from './Pages/MyBookings'
import RenterDashboard from './Pages/RenterDashboard'





function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<LandingPage />} /> 

        <Route path="/renter/browse" element={<BrowsePage />} />

        <Route path="/property/:id" element={<PropertyDetail />} />

        <Route path="/renter/book/:id" element={<BookingForm />} />

        <Route path="/renter/bookings" element={<MyBookings />} />

        <Route path="/renter/dashboard" element={<RenterDashboard />} />

        
      </Routes>
    </BrowserRouter>
  )
}

export default App