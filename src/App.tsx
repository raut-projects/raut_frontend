import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAdmin from "./components/RequireAdmin";
import RequireAuth from "./components/RequireAuth";
import Dashboard from "./pages/dashboard";
import Customers from "./pages/customers";
import Drivers from "./pages/drivers";
import Rides from "./pages/rides";
import RoutesPage from "./pages/routes";
import Payouts from "./pages/payouts";
import Transactions from "./pages/transactions";
import Settings from "./pages/settings";
import Login from "./pages/login";
import RequestAdmin from "./pages/requestAdmin";
import Onboarding from "./pages/Onboarding";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
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
          <Route path="/rides" element={<Rides />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/payouts" element={<Payouts />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
