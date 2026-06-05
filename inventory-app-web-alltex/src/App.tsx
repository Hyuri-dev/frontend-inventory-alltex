import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Navigate } from 'react-router';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Inventory from './pages/inventory';
import Categories from './pages/categories';
import Users from './pages/users';
import Layout from './components/Layout';
import './App.css';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes Layout Shell */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/users" element={<Users />} />
        {/* Redirect base logged-in path to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Catch-all redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </>
  )
);

function App() {
  return <RouterProvider router={router} />
}

export default App;
