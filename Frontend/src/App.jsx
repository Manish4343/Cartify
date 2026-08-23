import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

/* =====================================================
   PUBLIC PAGES
   ===================================================== */

import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Success from "./pages/Success";
import Wishlist from "./pages/Wishlist";

/* =====================================================
   USER PAGES
   ===================================================== */

import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";

/* =====================================================
   ADMIN PAGES
   ===================================================== */

import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
import AdminProducts from "./pages/AdminProducts";

/* =====================================================
   ROUTE PROTECTION
   ===================================================== */

import {
  ProtectedRoute,
  AdminRoute,
} from "./components/ProtectedRoute";

/* =====================================================
   APP
   ===================================================== */

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =================================================
            PUBLIC
        ================================================= */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/product/:id"
          element={<ProductDetails />}
        />

        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route
          path="/wishlist"
          element={<Wishlist />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/success"
          element={<Success />}
        />

        {/* =================================================
            PROTECTED USER
        ================================================= */}

        <Route element={<ProtectedRoute />}>

          <Route
            path="/checkout"
            element={<Checkout />}
          />

          <Route
            path="/orders"
            element={<Orders />}
          />

          <Route
            path="/orders/:id"
            element={<OrderDetails />}
          />

        </Route>

        {/* =================================================
            ADMIN
        ================================================= */}

        <Route element={<AdminRoute />}>

          <Route
            path="/admin"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/products"
            element={<AdminProducts />}
          />

          <Route
            path="/admin/orders"
            element={<AdminOrders />}
          />

        </Route>

        {/* =================================================
            404
        ================================================= */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </BrowserRouter>
  );
}

/* =====================================================
   404 PAGE
   ===================================================== */

function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">

      <div className="text-center">

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
          Cartify
        </p>

        <h1 className="mt-3 text-7xl font-black text-gray-900">
          404
        </h1>

        <p className="mt-4 text-gray-500">
          The page you're looking for doesn't exist.
        </p>

        <a
          href="/"
          className="
            mt-7
            inline-flex
            rounded-full
            bg-black
            px-7
            py-3
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-gray-800
            active:bg-black
            active:text-white
          "
        >
          Back to Store
        </a>

      </div>

    </main>
  );
}