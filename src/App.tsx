import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./components/layouts/DashboardLayout";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { DiscountStock } from "./pages/DiscountStock/DiscountStock";
import { Products } from "./pages/Product/Products";
import { ProductsDetails } from "./pages/Product/ProductsDetails";
import DiscountStockDetails from "./pages/DiscountStock/DiscountStockDetails";
import Login from "./pages/Login/Login";
import { useAuth } from "./contexts/useAuth";
import { Supplier } from "./pages/supplier/Supplier";
import { SupplierDetails } from "./pages/supplier/SupplierDetails";
import { Profille } from "./pages/profille/Profille";

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
        }
      />

      <Route
        element={
          isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/discount-stock" element={<DiscountStock />} />
        <Route path="/produtos" element={<Products />} />
        <Route path="/product-details/:id?" element={<ProductsDetails />} />
        <Route path="/discount-stock-details" element={<DiscountStockDetails />} />
        <Route path="/suppliers" element={<Supplier />} />
        <Route path="/supplier-details/:id?" element={<SupplierDetails />} />
        <Route path="/config/:id?" element={<Profille />} />
      </Route>
    </Routes>
  );
}