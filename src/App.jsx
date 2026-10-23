import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import RequireAdmin from './components/RequireAdmin.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import Dashboard from './pages/dashboard.jsx'
import Customers from './pages/customers.jsx'
import Drivers from './pages/drivers.jsx'
import Settings from './pages/settings.jsx'
import Login from './pages/login.jsx'
import RequestAdmin from './pages/requestAdmin.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/request-admin"
          element={
            <RequireAuth>
              <RequestAdmin />
            </RequireAuth>
          }
        />
        <Route
          element={
            <RequireAdmin>
              <Layout />
            </RequireAdmin>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
