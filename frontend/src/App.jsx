import React from 'react'
import Board from './pages/Board'
import {BrowserRouter, Routes, Route } from "react-router-dom"
import Home from './pages/Homepage'
import AuthPage from './pages/AuthPage'
import ProtectedRoute from './components/ProtectedRoute'



const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/board/:id" element={<ProtectedRoute><Board /></ProtectedRoute>}/>
        <Route path="/login" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App