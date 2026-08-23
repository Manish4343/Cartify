import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // ==========================================
  // CHECK ADMIN
  // ==========================================
  const userInfo = JSON.parse(
    localStorage.getItem("userInfo") || "null"
  );

  const isAdmin = userInfo?.isAdmin === true;

  // ==========================================
  // FETCH ALL ORDERS
  // ==========================================
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      if (!userInfo) {
        setError("Please login first.");
        return;
      }

      if (!isAdmin) {
        setError("Access denied. Admin only.");
        return;
      }

      const { data } = await API.get("/orders/admin/all");

      console.log("ADMIN ORDERS RESPONSE =>", data);

      if (Array.isArray(data)) {
        setOrders(data);
      } else if (Array.isArray(data?.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
        setError("Invalid orders response.");
      }
    } catch (err) {
      console.error("ADMIN ORDERS ERROR =>", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ==========================================
  // UPDATE STATUS
  // ==========================================
  const updateStatus = async (orderId, status) => {
    try {
      setUpdatingId(orderId);

      const { data } = await API.put(
        `/orders/admin/${orderId}/status`,
        {
          orderStatus: status,
        }
      );

      console.log("STATUS UPDATE RESPONSE =>", data);

      if (data?.order) {
        setOrders((previousOrders) =>
          previousOrders.map((order) =>
            order._id === orderId
              ? data.order
              : order
          )
        );
      } else {
        await fetchOrders();
      }
    } catch (err) {
      console.error("UPDATE STATUS ERROR =>", err);

      alert(
        err?.response?.data?.message ||
          "Unable to update order status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

          <p className="text-gray-500">
            Loading orders...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-3xl">

          <div className="rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm">

            <div className="mb-4 text-5xl">
              ⚠️
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              {error}
            </h1>

            <div className="mt-7 flex justify-center gap-3">

              <button
                onClick={fetchOrders}
                className="rounded-full border border-gray-300 px-6 py-3 text-sm font-medium hover:border-black"
              >
                Try Again
              </button>

              <Link
                to="/"
                className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Home
              </Link>

            </div>

          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // ADMIN PAGE
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <Link
            to="/"
            className="text-2xl font-bold tracking-tight text-gray-900"
          >
            Cartify
          </Link>

          <div className="flex items-center gap-5">

            <Link
              to="/"
              className="text-sm font-medium text-gray-600 hover:text-black"
            >
              Home
            </Link>

            <Link
              to="/orders"
              className="text-sm font-medium text-gray-600 hover:text-black"
            >
              My Orders
            </Link>

            <Link
              to="/admin"
              className="text-sm font-semibold text-black"
            >
              Admin
            </Link>

          </div>

        </div>

      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          <div>

            <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
              Cartify Admin
            </p>

            <h1 className="mt-2 text-4xl font-bold text-gray-900">
              Order Management
            </h1>

            <p className="mt-2 text-gray-500">
              Manage customer orders and update delivery status.
            </p>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">

            <p className="text-xs uppercase tracking-wider text-gray-400">
              Total Orders
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-900">
              {orders.length}
            </p>

          </div>

        </div>

        {/* ORDERS */}
        {orders.length === 0 ? (

          <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center">

            <div className="mb-4 text-5xl">
              📦
            </div>

            <h2 className="text-2xl font-bold">
              No orders found
            </h2>

            <p className="mt-2 text-gray-500">
              Customer orders will appear here.
            </p>

          </div>

        ) : (

          <div className="space-y-6">

            {orders.map((order) => {

              const customerName =
                order?.user?.name || "Unknown Customer";

              const customerEmail =
                order?.user?.email || "No email";

              const items = Array.isArray(order?.items)
                ? order.items
                : [];

              return (
                <div
                  key={order._id}
                  className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
                >

                  {/* ORDER HEADER */}
                  <div className="border-b border-gray-100 px-6 py-5">

                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">

                      {/* ID */}
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-400">
                          Order ID
                        </p>

                        <p className="mt-1 break-all text-sm font-semibold text-gray-900">
                          #{order._id}
                        </p>
                      </div>

                      {/* CUSTOMER */}
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-400">
                          Customer
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {customerName}
                        </p>

                        <p className="text-xs text-gray-500">
                          {customerEmail}
                        </p>
                      </div>

                      {/* DATE */}
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-400">
                          Date
                        </p>

                        <p className="mt-1 font-medium text-gray-900">
                          {order.createdAt
                            ? new Date(
                                order.createdAt
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "N/A"}
                        </p>
                      </div>

                      {/* PAYMENT */}
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-400">
                          Payment
                        </p>

                        <span
                          className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            order.paymentStatus ===
                            "Paid"
                              ? "bg-green-100 text-green-700"
                              : order.paymentStatus ===
                                "Failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {order.paymentStatus ||
                            "Pending"}
                        </span>
                      </div>

                      {/* TOTAL */}
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-400">
                          Total
                        </p>

                        <p className="mt-1 text-lg font-bold text-gray-900">
                          ₹
                          {Number(
                            order.totalAmount || 0
                          ).toLocaleString("en-IN")}
                        </p>
                      </div>

                    </div>

                  </div>

                  {/* PRODUCTS */}
                  <div className="px-6 py-6">

                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
                      Products
                    </h2>

                    <div className="space-y-3">

                      {items.map((item, index) => {

                        const quantity =
                          Number(item?.quantity) || 1;

                        const price =
                          Number(item?.price) || 0;

                        return (
                          <div
                            key={`${order._id}-${index}`}
                            className="flex items-center gap-4 rounded-2xl bg-gray-50 p-4"
                          >

                            {/* IMAGE */}
                            <div className="h-16 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-200">

                              {item?.image ? (
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
                                  No Image
                                </div>
                              )}

                            </div>

                            {/* INFO */}
                            <div className="min-w-0 flex-1">

                              <p className="font-semibold text-gray-900">
                                {item?.name ||
                                  "Product"}
                              </p>

                              <p className="mt-1 text-sm text-gray-500">
                                ₹
                                {price.toLocaleString(
                                  "en-IN"
                                )}{" "}
                                × {quantity}
                              </p>

                            </div>

                            {/* TOTAL */}
                            <p className="font-semibold text-gray-900">
                              ₹
                              {(
                                price *
                                quantity
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </p>

                          </div>
                        );
                      })}

                    </div>

                  </div>

                  {/* FOOTER */}
                  <div className="border-t border-gray-100 bg-gray-50 px-6 py-5">

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                      {/* CURRENT STATUS */}
                      <div>

                        <p className="text-xs uppercase tracking-wider text-gray-400">
                          Current Status
                        </p>

                        <span
                          className={`mt-2 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                            order.orderStatus ===
                            "Delivered"
                              ? "bg-green-100 text-green-700"
                              : order.orderStatus ===
                                "Cancelled"
                              ? "bg-red-100 text-red-700"
                              : order.orderStatus ===
                                "Shipped"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {order.orderStatus ||
                            "Processing"}
                        </span>

                      </div>

                      {/* UPDATE */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                        <select
                          value={
                            order.orderStatus ||
                            "Processing"
                          }
                          disabled={
                            updatingId === order._id
                          }
                          onChange={(e) =>
                            updateStatus(
                              order._id,
                              e.target.value
                            )
                          }
                          className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-black"
                        >

                          <option value="Processing">
                            Processing
                          </option>

                          <option value="Shipped">
                            Shipped
                          </option>

                          <option value="Delivered">
                            Delivered
                          </option>

                          <option value="Cancelled">
                            Cancelled
                          </option>

                        </select>

                        {updatingId ===
                          order._id && (
                          <span className="text-sm text-gray-500">
                            Updating...
                          </span>
                        )}

                        <Link
                          to={`/orders/${order._id}`}
                          className="rounded-xl bg-black px-5 py-3 text-center text-sm font-semibold text-white hover:bg-gray-800"
                        >
                          View Order
                        </Link>

                      </div>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </main>

    </div>
  );
}