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
import { ProductService } from "./service/Product.service";
import { MessageService } from "./service/Message.service";

export default function App() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    const checkStock = async () => {
      try {
        const data = await ProductService.findAll();
        for (const p of data) {
          const primaryImage = (p.images || []).find((img: any) => img.isPrimary);
          const imageUrl = primaryImage?.url || p.images?.[0]?.url || "";
          if (p.isActiveStock && (p.stock ?? 0) === 0) {
            try {
              await MessageService.create({
                productId: p.id,
                name: p.name,
                url: imageUrl,
                type: 'esgotado',
                description: `O produto "${p.name}" foi esgotado. Estoque zerado. Realize a reposição imediatamente.`,
              });
            } catch {}
          } else if (p.isActiveStock && (p.lowStock ?? 0) > (p.stock ?? 0)) {
            try {
              await MessageService.create({
                productId: p.id,
                name: p.name,
                url: imageUrl,
                type: 'estoque_baixo',
                description: `Alerta de estoque baixo: o produto "${p.name}" possui apenas ${p.stock ?? 0} unidades restantes. O limite de alerta é ${p.lowStock}. Realize a reposição.`,
              });
            } catch {}
          }
          if (Array.isArray(p.variations)) {
            for (const v of p.variations) {
              const varImage = v.imageUrl || imageUrl;
              const varName = `${p.name} - ${v.color || ""} ${v.size || ""}`.trim();
              if (Number(v.stock ?? 0) === 0) {
                try {
                  await MessageService.create({
                    productId: p.id,
                    name: varName,
                    url: varImage,
                    type: 'esgotado',
                    description: `A variação "${v.color || ""} ${v.size || ""}" do produto "${p.name}" foi esgotada. Estoque zerado. Realize a reposição imediatamente.`,
                  });
                } catch {}
              } else if (p.isActiveStock && (p.lowStock ?? 0) > Number(v.stock ?? 0)) {
                try {
                  await MessageService.create({
                    productId: p.id,
                    name: varName,
                    url: varImage,
                    type: 'estoque_baixo',
                    description: `Alerta de estoque baixo: a variação "${v.color || ""} ${v.size || ""}" do produto "${p.name}" possui apenas ${v.stock ?? 0} unidades restantes. O limite de alerta é ${p.lowStock}. Realize a reposição.`,
                  });
                } catch {}
              }
            }
          }
        }
      } catch {}
    };
    checkStock();
  }, [isAuthenticated]);

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
        <Route path="/out-of-stock" element={<OutOfStock />} />
        <Route path="/suppliers" element={<Supplier />} />
        <Route path="/supplier-details/:id?" element={<SupplierDetails />} />
        <Route path="/config/:id?" element={<Profille />} />
      </Route>
    </Routes>
  );
}