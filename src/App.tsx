import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { DashboardLayout } from "./components/layouts/DashboardLayout";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { DiscountStock } from "./pages/DiscountStock/DiscountStock";
import { Products } from "./pages/Product/Products";
import { ProductsDetails } from "./pages/Product/ProductsDetails";
import DiscountStockDetails from "./pages/DiscountStock/DiscountStockDetails";
import Login from "./pages/Login/Login";
import { useAuth } from "./contexts/useAuth";
import { Supplier } from "./pages/Supplier/Supplier";
import { SupplierDetails } from "./pages/Supplier/SupplierDetails";
import { Profille } from "./pages/Profille/Profille";
import { OutOfStock } from "./pages/OutOfStock/OutOfStock";
import { useMessageContext } from "./contexts/MessageContext";
import Roleta from "./pages/Roulette/Roulette";
import { Credit } from "./pages/Credit/Credit";
import { CreditDetails } from "./pages/Credit/CreditDetails";

export default function App() {
  const { isAuthenticated } = useAuth();
  const { checkStockAndNotify } = useMessageContext();

  useEffect(() => {
    if (!isAuthenticated) return;
    checkStockAndNotify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
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
        <Route
          path="/discount-stock-details"
          element={<DiscountStockDetails />}
        />
        <Route path="/out-of-stock" element={<OutOfStock />} />
        <Route path="/suppliers" element={<Supplier />} />
        <Route path="/supplier-details/:id?" element={<SupplierDetails />} />
        <Route path="/config/:id?" element={<Profille />} />
        <Route path="/roulette" element={<Roleta />} />
        <Route path="/credit" element={<Credit />} />
        <Route path="/credit-details/:id?" element={<CreditDetails />} />
      </Route>
    </Routes>
  );
}
