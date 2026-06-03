import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import Login from './pages/login'
import Dashboard from './pages/dashboard'
import Inventory from './pages/inventory'
import './App.css'

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
