import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import Dashboard from './pages/dashboard.jsx'
import Customers from './pages/customers.jsx'
import Riders from './pages/riders.jsx'
import Settings from './pages/settings.jsx'
import Deliveries from './pages/deliveries.jsx'
import Login from './pages/login.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/riders" element={<Riders />} />
          <Route path="/deliveries" element={<Deliveries />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
