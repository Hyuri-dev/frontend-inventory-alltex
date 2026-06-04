import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Navigate } from 'react-router';
import Login from './pages/login'
// import Dashboard from './pages/dashboard'
// import Inventory from './pages/inventory'
import './App.css'

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<Login />} />
      {/* <Route path="/dashboard" element={<Dashboard />} /> */}
      {/* <Route path="/inventory" element={<Inventory />} /> */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </>
  )
);

function App() {
  return <RouterProvider router={router} />
}

export default App
