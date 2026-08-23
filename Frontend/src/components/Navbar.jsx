import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  ShoppingBag,
  User,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Heart,
} from "lucide-react";

import { useState } from "react";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

import CartDrawer from "./CartDrawer";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    isAuthenticated,
    isAdmin,
    logout,
  } = useAuth();

  const { totalItems } = useCart();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    cartOpen,
    setCartOpen,
  ] = useState(false);

  const handleLogout = () => {
    logout();

    setMobileOpen(false);
    setCartOpen(false);

    navigate("/login", {
      replace: true,
    });
  };

  const closeMobile = () => {
    setMobileOpen(false);
  };

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className="sticky top-0 z-/[80] border-b border-gray-200/80 bg-white/90 shadow-sm backdrop-blur-xl">

        <div className="mx-auto flex h-/[72px] max-w-7xl items-center justify-between gap-5 px-5 md:px-6">

          {/* LOGO */}

          <Link
            to="/"
            onClick={closeMobile}
            className="group flex shrink-0 items-center gap-2"
          >
            <span className="text-2xl font-black tracking-[-0.04em] text-gray-950 transition duration-300 group-hover:tracking-[-0.02em]">
              Cartify
            </span>

            <span className="hidden rounded-full bg-gray-950 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white sm:inline-block">
              Store
            </span>
          </Link>

          {/* DESKTOP NAV */}

          <nav className="hidden items-center gap-7 md:flex">

            <Link
              to="/"
              className={`relative py-2 text-sm font-semibold transition ${
                isActive("/")
                  ? "text-gray-950"
                  : "text-gray-500 hover:text-gray-950"
              }`}
            >
              Home

              {isActive("/") && (
                <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gray-950" />
              )}
            </Link>

            {isAuthenticated && (
              <Link
                to="/orders"
                className={`relative py-2 text-sm font-semibold transition ${
                  isActive("/orders")
                    ? "text-gray-950"
                    : "text-gray-500 hover:text-gray-950"
                }`}
              >
                My Orders

                {isActive("/orders") && (
                  <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gray-950" />
                )}
              </Link>
            )}

            {isAdmin && (
              <>
                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition ${
                    isActive("/admin")
                      ? "bg-gray-950 text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
                  }`}
                >
                  <ShieldCheck size={15} />
                  Admin
                </Link>

                <Link
                  to="/admin/products"
                  className={`text-sm font-semibold transition ${
                    isActive("/admin/products")
                      ? "text-gray-950"
                      : "text-gray-500 hover:text-gray-950"
                  }`}
                >
                  Manage Products
                </Link>
              </>
            )}

          </nav>

          {/* DESKTOP ACTIONS */}

          <div className="hidden items-center gap-2 md:flex">

            {/* WISHLIST */}

            <Link
              to="/wishlist"
              className="group flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition duration-300 hover:-translate-y-0.5 hover:border-gray-950 hover:text-gray-950"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart
                size={18}
                className="transition group-hover:scale-110"
              />
            </Link>

            {/* CART */}

            <button
              type="button"
              onClick={() =>
                setCartOpen(true)
              }
              className="cartify-nav-cart group relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 transition duration-300 hover:-translate-y-0.5 hover:border-gray-950"
              aria-label="Open shopping cart"
            >
              <ShoppingBag
                size={19}
                className="transition group-hover:scale-110"
              />

              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-gray-950 px-1 text-[10px] font-bold text-white shadow-sm">
                  {totalItems > 99
                    ? "99+"
                    : totalItems}
                </span>
              )}
            </button>

            {/* USER */}

            {isAuthenticated ? (
              <div className="ml-1 flex items-center gap-2">

                <Link
                  to="/profile"
                  className="group flex max-w-/[170px] items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:-translate-y-0.5 hover:border-gray-950 hover:text-gray-950"
                >
                  <User
                    size={16}
                    className="shrink-0"
                  />

                  <span className="truncate">
                    {user?.name ||
                      "Profile"}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  aria-label="Logout"
                  title="Logout"
                >
                  <LogOut size={17} />
                </button>

              </div>
            ) : (
              <div className="ml-1 flex items-center gap-1">

                <Link
                  to="/login"
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:text-gray-950"
                >
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="rounded-full bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md"
                >
                  Sign Up
                </Link>

              </div>
            )}

          </div>

          {/* MOBILE */}

          <div className="flex items-center gap-2 md:hidden">

            <button
              type="button"
              onClick={() =>
                setCartOpen(true)
              }
              className="cartify-nav-cart relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200"
              aria-label="Open shopping cart"
            >
              <ShoppingBag size={18} />

              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-gray-950 px-1 text-[9px] font-bold text-white">
                  {totalItems > 99
                    ? "99+"
                    : totalItems}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setMobileOpen(
                  (previous) =>
                    !previous
                )
              }
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                mobileOpen
                  ? "border-gray-950 bg-gray-950 text-white"
                  : "border-gray-200 bg-white text-gray-700"
              }`}
              aria-label="Toggle menu"
              aria-expanded={
                mobileOpen
              }
            >
              {mobileOpen ? (
                <X size={19} />
              ) : (
                <Menu size={19} />
              )}
            </button>

          </div>

        </div>

        {/* MOBILE MENU */}

        {mobileOpen && (
          <div className="border-t border-gray-200 bg-white px-5 py-5 shadow-lg md:hidden">

            <nav className="flex flex-col gap-1">

              <Link
                to="/"
                onClick={closeMobile}
                className={`rounded-2xl px-4 py-3.5 text-sm font-semibold transition ${
                  isActive("/")
                    ? "bg-gray-950 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Home
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/orders"
                    onClick={closeMobile}
                    className="rounded-2xl px-4 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    My Orders
                  </Link>

                  <Link
                    to="/profile"
                    onClick={closeMobile}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    <User size={17} />
                    Profile
                  </Link>

                  <Link
                    to="/wishlist"
                    onClick={closeMobile}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    <Heart size={17} />
                    Wishlist
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <Link
                    to="/admin"
                    onClick={closeMobile}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    <ShieldCheck size={17} />
                    Admin Dashboard
                  </Link>

                  <Link
                    to="/admin/products"
                    onClick={closeMobile}
                    className="rounded-2xl px-4 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    Manage Products
                  </Link>
                </>
              )}

              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobile}
                    className="rounded-2xl px-4 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    Login
                  </Link>

                  <Link
                    to="/signup"
                    onClick={closeMobile}
                    className="mt-1 rounded-2xl bg-gray-950 px-4 py-3.5 text-center text-sm font-bold text-white transition hover:bg-gray-800"
                  >
                    Create Account
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 flex items-center gap-3 rounded-2xl border border-red-200 px-4 py-3.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              )}

            </nav>

          </div>
        )}

      </header>

      <CartDrawer
        open={cartOpen}
        onClose={() =>
          setCartOpen(false)
        }
      />
    </>
  );
}