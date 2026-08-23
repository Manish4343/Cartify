import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import API from "../services/api";

export default function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // USER
  // =====================================================

  const getUser = () => {
    try {
      const raw = localStorage.getItem("userInfo");

      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);

      if (!parsed || typeof parsed !== "object") {
        return null;
      }

      return parsed;
    } catch (error) {
      console.error("GET USER ERROR =>", error);

      localStorage.removeItem("userInfo");
      localStorage.removeItem("token");

      return null;
    }
  };

  // =====================================================
  // TOKEN
  // =====================================================

  const getToken = () => {
    const user = getUser();

    return user?.token || localStorage.getItem("token") || "";
  };

  // =====================================================
  // FETCH ORDERS
  // =====================================================

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const user = getUser();
      const token = getToken();

      if (!user || !token) {
        navigate("/login", {
          replace: true,
          state: {
            from: "/orders",
          },
        });

        return;
      }

      const response = await API.get("/orders/my-orders");

      const data = response?.data;

      let orderList = [];

      if (Array.isArray(data)) {
        orderList = data;
      } else if (Array.isArray(data?.orders)) {
        orderList = data.orders;
      }

      setOrders(orderList);
    } catch (error) {
      console.error(
        "GET MY ORDERS ERROR =>",
        error?.response?.data || error
      );

      const status = error?.response?.status;

      if (status === 401 || status === 403) {
        localStorage.removeItem("userInfo");
        localStorage.removeItem("token");

        navigate("/login", {
          replace: true,
          state: {
            from: "/orders",
          },
        });

        return;
      }

      setError(
        error?.response?.data?.message ||
          "Unable to load your orders."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD ORDERS
  // =====================================================

  useEffect(() => {
    fetchOrders();
  }, []);

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "Date unavailable";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // ORDER STATUS
  // =====================================================

  const getStatusStyle = (status) => {
    const normalized = String(status || "")
      .toLowerCase()
      .trim();

    switch (normalized) {
      case "delivered":
        return {
          backgroundColor: "#dcfce7",
          color: "#15803d",
          borderColor: "#bbf7d0",
        };

      case "shipped":
        return {
          backgroundColor: "#dbeafe",
          color: "#1d4ed8",
          borderColor: "#bfdbfe",
        };

      case "cancelled":
        return {
          backgroundColor: "#fee2e2",
          color: "#b91c1c",
          borderColor: "#fecaca",
        };

      default:
        return {
          backgroundColor: "#ffedd5",
          color: "#c2410c",
          borderColor: "#fed7aa",
        };
    }
  };

  // =====================================================
  // PAYMENT STATUS
  // =====================================================

  const getPaymentStyle = (status) => {
    const normalized = String(status || "")
      .toLowerCase()
      .trim();

    if (normalized === "paid") {
      return {
        backgroundColor: "#dcfce7",
        color: "#15803d",
        borderColor: "#bbf7d0",
      };
    }

    return {
      backgroundColor: "#fef3c7",
      color: "#b45309",
      borderColor: "#fde68a",
    };
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <>
        <style>
          {`
            .cartify-orders-page {
              min-height: 100vh;
              background: #f8fafc;
              color: #111827;
            }

            .cartify-loading-skeleton {
              animation: cartifyPulse 1.5s ease-in-out infinite;
            }

            @keyframes cartifyPulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.45;
              }
            }
          `}
        </style>

        <div className="cartify-orders-page min-h-screen">
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <Link
                to="/"
                style={{
                  color: "#111827",
                  textDecoration: "none",
                }}
                className="text-2xl font-black"
              >
                Cartify
              </Link>

              <Link
                to="/"
                style={{
                  color: "#4b5563",
                  textDecoration: "none",
                }}
                className="text-sm font-semibold"
              >
                Home
              </Link>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-6 py-12">
            <div className="cartify-loading-skeleton">
              <div className="h-9 w-40 rounded-lg bg-gray-200" />

              <div className="mt-3 h-5 w-64 rounded bg-gray-200" />

              <div className="mt-8 space-y-5">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="rounded-3xl border border-gray-200 bg-white p-6"
                  >
                    <div className="h-5 w-40 rounded bg-gray-200" />

                    <div className="mt-4 h-4 w-72 rounded bg-gray-200" />

                    <div className="mt-6 h-20 rounded-2xl bg-gray-100" />
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <>
        <style>
          {`
            .cartify-error-btn,
            .cartify-error-btn:visited {
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              min-height: 46px !important;
              padding: 12px 24px !important;
              border-radius: 999px !important;
              font-size: 14px !important;
              font-weight: 700 !important;
              line-height: 1 !important;
              text-decoration: none !important;
              cursor: pointer !important;
              transition: all 0.2s ease !important;
              box-sizing: border-box !important;
            }

            .cartify-error-primary {
              background: #111827 !important;
              color: #ffffff !important;
              border: 1px solid #111827 !important;
            }

            .cartify-error-primary:hover {
              background: #374151 !important;
              color: #ffffff !important;
              border-color: #374151 !important;
            }

            .cartify-error-secondary {
              background: #ffffff !important;
              color: #374151 !important;
              border: 1px solid #d1d5db !important;
            }

            .cartify-error-secondary:hover {
              background: #f9fafb !important;
              color: #111827 !important;
              border-color: #111827 !important;
            }
          `}
        </style>

        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
          <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="text-5xl">⚠️</div>

            <h1 className="mt-5 text-2xl font-bold text-gray-900">
              Unable to load orders
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              {error}
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={fetchOrders}
                className="cartify-error-btn cartify-error-primary"
              >
                Try Again
              </button>

              <Link
                to="/"
                className="cartify-error-btn cartify-error-secondary"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <>
      <style>
        {`
          /* =================================================
             CARTIFY ORDERS PAGE BUTTON FIX
             Prevents global CSS from hiding button text.
          ================================================= */

          .cartify-orders-page {
            min-height: 100vh;
            background: #f8fafc;
            color: #111827;
          }

          .cartify-orders-page a {
            text-decoration: none;
          }

          /* CONTINUE SHOPPING */

          .cartify-continue-btn,
          .cartify-continue-btn:visited {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: fit-content !important;
            min-height: 48px !important;
            padding: 13px 24px !important;
            border-radius: 999px !important;
            background: #111827 !important;
            background-color: #111827 !important;
            color: #ffffff !important;
            border: 1px solid #111827 !important;
            font-size: 14px !important;
            font-weight: 700 !important;
            line-height: 1 !important;
            text-decoration: none !important;
            opacity: 1 !important;
            visibility: visible !important;
            cursor: pointer !important;
            box-sizing: border-box !important;
            transition:
              background-color 0.2s ease,
              border-color 0.2s ease,
              color 0.2s ease,
              transform 0.2s ease,
              box-shadow 0.2s ease !important;
          }

          .cartify-continue-btn:hover {
            background: #374151 !important;
            background-color: #374151 !important;
            color: #ffffff !important;
            border-color: #374151 !important;
            transform: translateY(-1px);
            box-shadow: 0 8px 20px rgba(17, 24, 39, 0.16) !important;
          }

          .cartify-continue-btn:active {
            background: #111827 !important;
            background-color: #111827 !important;
            color: #ffffff !important;
            border-color: #111827 !important;
            transform: translateY(0);
          }

          .cartify-continue-btn:focus,
          .cartify-continue-btn:focus-visible {
            background: #111827 !important;
            background-color: #111827 !important;
            color: #ffffff !important;
            outline: 3px solid rgba(59, 130, 246, 0.3) !important;
            outline-offset: 3px !important;
          }

          /* VIEW ORDER */

          .cartify-view-order-btn,
          .cartify-view-order-btn:visited {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            min-height: 48px !important;
            padding: 13px 24px !important;
            border-radius: 999px !important;
            background: #111827 !important;
            background-color: #111827 !important;
            color: #ffffff !important;
            border: 1px solid #111827 !important;
            font-size: 14px !important;
            font-weight: 700 !important;
            line-height: 1 !important;
            text-decoration: none !important;
            opacity: 1 !important;
            visibility: visible !important;
            cursor: pointer !important;
            box-sizing: border-box !important;
            transition:
              background-color 0.2s ease,
              border-color 0.2s ease,
              color 0.2s ease,
              transform 0.2s ease,
              box-shadow 0.2s ease !important;
          }

          .cartify-view-order-btn:hover {
            background: #374151 !important;
            background-color: #374151 !important;
            color: #ffffff !important;
            border-color: #374151 !important;
            transform: translateY(-1px);
            box-shadow: 0 8px 20px rgba(17, 24, 39, 0.16) !important;
          }

          .cartify-view-order-btn:active {
            background: #111827 !important;
            background-color: #111827 !important;
            color: #ffffff !important;
            border-color: #111827 !important;
            transform: translateY(0);
          }

          .cartify-view-order-btn:focus,
          .cartify-view-order-btn:focus-visible {
            background: #111827 !important;
            background-color: #111827 !important;
            color: #ffffff !important;
            outline: 3px solid rgba(59, 130, 246, 0.3) !important;
            outline-offset: 3px !important;
          }

          @media (min-width: 640px) {
            .cartify-view-order-btn {
              width: auto !important;
              min-width: 140px !important;
            }
          }

          /* HEADER LINKS */

          .cartify-header-link,
          .cartify-header-link:visited {
            color: #4b5563 !important;
            text-decoration: none !important;
            opacity: 1 !important;
            visibility: visible !important;
          }

          .cartify-header-link:hover {
            color: #111827 !important;
          }

          /* CART HEADER BUTTON */

          .cartify-cart-btn,
          .cartify-cart-btn:visited {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: 42px !important;
            padding: 10px 17px !important;
            border-radius: 999px !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #374151 !important;
            border: 1px solid #d1d5db !important;
            font-size: 14px !important;
            font-weight: 700 !important;
            text-decoration: none !important;
            opacity: 1 !important;
            visibility: visible !important;
            transition: all 0.2s ease !important;
          }

          .cartify-cart-btn:hover {
            background: #111827 !important;
            background-color: #111827 !important;
            color: #ffffff !important;
            border-color: #111827 !important;
          }

          /* PRODUCT CARD */

          .cartify-product-row {
            background: #f8fafc !important;
            color: #111827 !important;
          }

          /* Make sure product names never become invisible */

          .cartify-product-name {
            color: #111827 !important;
            opacity: 1 !important;
          }

          .cartify-product-meta {
            color: #6b7280 !important;
            opacity: 1 !important;
          }

          /* ORDER ID */

          .cartify-order-id {
            color: #111827 !important;
            opacity: 1 !important;
          }

          /* TOTAL */

          .cartify-order-total {
            color: #111827 !important;
            opacity: 1 !important;
          }
        `}
      </style>

      <div className="cartify-orders-page">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link
              to="/"
              style={{
                color: "#111827",
                textDecoration: "none",
                opacity: 1,
                visibility: "visible",
              }}
              className="text-2xl font-black tracking-tight"
            >
              Cartify
            </Link>

            <div className="flex items-center gap-5">
              <Link
                to="/"
                className="cartify-header-link text-sm font-semibold"
              >
                Home
              </Link>

              <Link
                to="/cart"
                className="cartify-cart-btn"
              >
                Cart
              </Link>
            </div>
          </div>
        </header>

        {/* =================================================
            MAIN
        ================================================= */}

        <main className="mx-auto max-w-6xl px-6 py-10">
          {/* PAGE HEADER */}

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                style={{
                  color: "#9ca3af",
                }}
                className="text-sm font-semibold uppercase tracking-[0.2em]"
              >
                Cartify
              </p>

              <h1
                style={{
                  color: "#111827",
                }}
                className="mt-2 text-3xl font-black md:text-4xl"
              >
                My Orders
              </h1>

              <p
                style={{
                  color: "#6b7280",
                }}
                className="mt-2"
              >
                Track your Cartify purchases.
              </p>
            </div>

            {/* FIXED CONTINUE SHOPPING */}

            <Link
              to="/"
              className="cartify-continue-btn"
            >
              Continue Shopping
            </Link>
          </div>

          {/* =================================================
              EMPTY ORDERS
          ================================================= */}

          {orders.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              <div className="text-6xl">📦</div>

              <h2
                style={{
                  color: "#111827",
                }}
                className="mt-5 text-2xl font-bold"
              >
                No orders yet
              </h2>

              <p
                style={{
                  color: "#6b7280",
                }}
                className="mx-auto mt-3 max-w-md text-sm leading-6"
              >
                You haven't placed an order yet.
                Start shopping and your orders will
                appear here.
              </p>

              <Link
                to="/"
                className="cartify-continue-btn mt-7"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            /* =================================================
               ORDERS LIST
            ================================================= */

            <div className="mt-8 space-y-5">
              {orders.map((order) => {
                const items = Array.isArray(order.items)
                  ? order.items
                  : [];

                const itemCount = items.reduce(
                  (total, item) =>
                    total +
                    Number(item.quantity || 1),
                  0
                );

                return (
                  <article
                    key={order._id}
                    className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                  >
                    {/* =================================================
                        ORDER TOP
                    ================================================= */}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                          Order
                        </p>

                        <h2 className="cartify-order-id mt-1 break-all text-base font-bold">
                          #{order._id}
                        </h2>

                        <p className="mt-2 text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      {/* STATUS */}

                      <div className="flex flex-wrap gap-2">
                        <span
                          style={{
                            ...getStatusStyle(
                              order.orderStatus
                            ),
                            borderWidth: "1px",
                            borderStyle: "solid",
                          }}
                          className="rounded-full px-4 py-2 text-xs font-bold"
                        >
                          {order.orderStatus ||
                            "Processing"}
                        </span>

                        {/* PAYMENT */}

                        <span
                          style={{
                            ...getPaymentStyle(
                              order.paymentStatus
                            ),
                            borderWidth: "1px",
                            borderStyle: "solid",
                          }}
                          className="rounded-full px-4 py-2 text-xs font-bold"
                        >
                          {order.paymentStatus ||
                            "Pending"}
                        </span>
                      </div>
                    </div>

                    {/* =================================================
                        ITEMS
                    ================================================= */}

                    <div className="mt-6 space-y-3">
                      {items.slice(0, 3).map(
                        (item, index) => (
                          <div
                            key={`${order._id}-${
                              item.product?._id ||
                              item.product ||
                              index
                            }`}
                            className="cartify-product-row flex items-center gap-4 rounded-2xl p-3"
                          >
                            {/* IMAGE */}

                            <div className="h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-200">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={
                                    item.name ||
                                    "Product"
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                  —
                                </div>
                              )}
                            </div>

                            {/* INFO */}

                            <div className="min-w-0 flex-1">
                              <p className="cartify-product-name truncate text-sm font-semibold">
                                {item.name ||
                                  "Product"}
                              </p>

                              <p className="cartify-product-meta mt-1 text-xs">
                                Qty:{" "}
                                {Number(
                                  item.quantity || 1
                                )}
                              </p>
                            </div>

                            {/* PRICE */}

                            <p
                              style={{
                                color: "#111827",
                              }}
                              className="shrink-0 text-sm font-bold"
                            >
                              ₹
                              {(
                                Number(
                                  item.price || 0
                                ) *
                                Number(
                                  item.quantity || 1
                                )
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </p>
                          </div>
                        )
                      )}

                      {items.length > 3 && (
                        <p className="px-2 text-xs text-gray-500">
                          + {items.length - 3} more
                          product(s)
                        </p>
                      )}
                    </div>

                    {/* =================================================
                        BOTTOM
                    ================================================= */}

                    <div className="mt-6 flex flex-col gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      {/* TOTAL */}

                      <div>
                        <p className="text-xs text-gray-400">
                          {itemCount}{" "}
                          {itemCount === 1
                            ? "item"
                            : "items"}
                        </p>

                        <p className="cartify-order-total mt-1 text-xl font-black">
                          ₹
                          {Number(
                            order.totalAmount || 0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </p>
                      </div>

                      {/* FIXED VIEW ORDER */}

                      <Link
                        to={`/orders/${order._id}`}
                        className="cartify-view-order-btn"
                      >
                        View Order
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}