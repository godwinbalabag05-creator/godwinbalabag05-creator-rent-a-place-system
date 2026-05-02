import { useState } from 'react'
import { Route, Routes, BrowserRouter } from 'react-router-dom'

// Import the files from the Pages
import  ExamplePage from "./Pages/Example"


function App() {
  return (
    <BrowserRouter>
        <Routes>

          <Route path="/" element={<ExamplePage />} /> 

        </Routes>
    </BrowserRouter>
  )
}

export default App
