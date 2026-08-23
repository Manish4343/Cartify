import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import API from "../services/api";

export default function OrderDetails() {
  const {
    id,
  } = useParams();

  const navigate =
    useNavigate();

  const [order, setOrder] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      if (
        !id ||
        id === "undefined"
      ) {
        setError(
          "Order ID is missing."
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await API.get(
            `/orders/${id}`
          );

        const data =
          response?.data;

        const orderData =
          data?.order || data;

        if (
          !orderData?._id
        ) {
          throw new Error(
            "Invalid order data."
          );
        }

        setOrder(orderData);
      } catch (error) {
        console.error(
          "ORDER DETAILS ERROR =>",
          error?.response
            ?.data || error
        );

        const status =
          error?.response?.status;

        if (status === 401) {
          localStorage.removeItem(
            "userInfo"
          );

          localStorage.removeItem(
            "token"
          );

          navigate("/login", {
            replace: true,
            state: {
              from: `/orders/${id}`,
            },
          });

          return;
        }

        setError(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load order."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate]);

  const formatDate = (
    date,
    includeTime = false
  ) => {
    if (!date) {
      return "Unavailable";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "Unavailable";
    }

    return parsed.toLocaleDateString(
      "en-IN",
      includeTime
        ? {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        : {
            day: "numeric",
            month: "long",
            year: "numeric",
          }
    );
  };

  const statusClasses = (
    status
  ) => {
    switch (
      String(status || "")
        .toLowerCase()
    ) {
      case "delivered":
        return "bg-green-100 text-green-700";

      case "shipped":
        return "bg-blue-100 text-blue-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-orange-100 text-orange-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link
              to="/"
              className="text-2xl font-black text-gray-900"
            >
              Cartify
            </Link>

            <Link
              to="/orders"
              className="text-sm font-medium text-gray-500 hover:text-black"
            >
              My Orders
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-10">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />

          <div className="mt-5 h-10 w-80 animate-pulse rounded bg-gray-200" />

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <div className="h-48 animate-pulse rounded-3xl bg-gray-200" />
              <div className="h-72 animate-pulse rounded-3xl bg-gray-200" />
            </div>

            <div className="h-72 animate-pulse rounded-3xl bg-gray-200" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Unable to load order
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            {error}
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/orders"
              className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              My Orders
            </Link>

            <Link
              to="/"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:border-black"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const items =
    Array.isArray(
      order.items
    )
      ? order.items
      : [];

  const address =
    order.address || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="text-2xl font-black tracking-tight text-gray-900"
          >
            Cartify
          </Link>

          <div className="flex items-center gap-5">
            <Link
              to="/"
              className="hidden text-sm font-medium text-gray-600 hover:text-black sm:block"
            >
              Home
            </Link>

            <Link
              to="/orders"
              className="text-sm font-medium text-gray-600 hover:text-black"
            >
              My Orders
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN */}

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link
          to="/orders"
          className="inline-flex rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-black hover:text-black"
        >
          ← Back to Orders
        </Link>

        {/* ORDER HEADER */}

        <div className="mt-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
              Order Details
            </p>

            <h1 className="mt-2 break-all text-2xl font-black text-gray-900 sm:text-3xl">
              #{order._id}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Placed on{" "}
              {formatDate(
                order.createdAt,
                true
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-4 py-2 text-xs font-bold ${statusClasses(
                order.orderStatus
              )}`}
            >
              {order.orderStatus ||
                "Processing"}
            </span>

            <span className="rounded-full bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700">
              Payment:{" "}
              {order.paymentStatus ||
                "Pending"}
            </span>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* LEFT */}

          <div className="space-y-6 lg:col-span-2">
            {/* ITEMS */}

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Order Items
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {items.length}{" "}
                    {items.length === 1
                      ? "product"
                      : "products"}
                  </p>
                </div>
              </div>

              <div className="mt-6 divide-y divide-gray-100">
                {items.map(
                  (
                    item,
                    index
                  ) => {
                    const quantity =
                      Number(
                        item.quantity ||
                          1
                      );

                    const price =
                      Number(
                        item.price ||
                          0
                      );

                    const itemTotal =
                      price *
                      quantity;

                    const productId =
                      typeof item.product ===
                      "object"
                        ? item.product?._id
                        : item.product;

                    return (
                      <div
                        key={`${productId || "item"}-${index}`}
                        className="flex gap-4 py-5 first:pt-0 last:pb-0"
                      >
                        <div className="h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                          {item.image ? (
                            <img
                              src={
                                item.image
                              }
                              alt={
                                item.name ||
                                "Product"
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-gray-900">
                            {item.name ||
                              "Product"}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            Quantity:{" "}
                            {quantity}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            ₹
                            {price.toLocaleString(
                              "en-IN"
                            )}{" "}
                            each
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="font-bold text-gray-900">
                            ₹
                            {itemTotal.toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            {/* DELIVERY ADDRESS */}

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-bold text-gray-900">
                Delivery Address
              </h2>

              <div className="mt-5 rounded-2xl bg-gray-50 p-5">
                <p className="font-semibold text-gray-900">
                  {address.name ||
                    "Customer"}
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {address.address ||
                    ""}
                  <br />
                  {address.city ||
                    ""}
                  {address.city &&
                  address.state
                    ? ", "
                    : ""}
                  {address.state ||
                    ""}
                  <br />
                  PIN:{" "}
                  {address.pincode ||
                    "—"}
                </p>

                <p className="mt-3 text-sm font-medium text-gray-700">
                  Phone:{" "}
                  {address.phone ||
                    "—"}
                </p>
              </div>
            </section>
          </div>

          {/* RIGHT */}

          <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Order Summary
            </h2>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">
                  Items
                </span>

                <span className="font-semibold text-gray-900">
                  {items.reduce(
                    (
                      total,
                      item
                    ) =>
                      total +
                      Number(
                        item.quantity ||
                          1
                      ),
                    0
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">
                  Payment
                </span>

                <span className="font-semibold text-gray-900">
                  {order.paymentStatus ||
                    "Pending"}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-end justify-between gap-4">
                  <span className="font-semibold text-gray-700">
                    Total
                  </span>

                  <span className="text-2xl font-black text-gray-900">
                    ₹
                    {Number(
                      order.totalAmount ||
                        0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* PAYMENT ID */}

            {order.paymentId && (
              <div className="mt-6 rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Payment ID
                </p>

                <p className="mt-1 break-all text-xs text-gray-600">
                  {order.paymentId}
                </p>
              </div>
            )}

            {/* RAZORPAY ORDER */}

            {order.razorpayOrderId && (
              <div className="mt-3 rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Payment Order
                </p>

                <p className="mt-1 break-all text-xs text-gray-600">
                  {order.razorpayOrderId}
                </p>
              </div>
            )}

            <Link
              to="/"
              className="mt-6 flex w-full items-center justify-center rounded-full bg-black px-6 py-3.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Continue Shopping
            </Link>
          </aside>
        </div>
      </main>
    </div>
  );
}