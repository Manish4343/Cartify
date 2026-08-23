import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // GET CURRENT USER
  // =====================================================

  const getUserInfo = () => {
    try {
      return JSON.parse(
        localStorage.getItem("userInfo") || "null"
      );
    } catch {
      return null;
    }
  };

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/products");

      console.log("ADMIN PRODUCTS =>", response.data);

      let productList = [];

      if (Array.isArray(response.data)) {
        productList = response.data;
      } else if (
        Array.isArray(response.data?.products)
      ) {
        productList = response.data.products;
      }

      setProducts(productList);
    } catch (error) {
      console.error(
        "FETCH PRODUCTS ERROR =>",
        error?.response?.data || error
      );

      setProducts([]);

      setError(
        error?.response?.data?.message ||
          "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchProducts();
  }, []);

  // =====================================================
  // DELETE PRODUCT
  // =====================================================

  const deleteProduct = async (id) => {
    if (!id) {
      alert("Product ID is missing.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeleting(id);

      const userInfo = getUserInfo();

      if (!userInfo) {
        alert("Please login as admin.");
        return;
      }

      /*
        If your API interceptor already sends the token,
        this request will work directly.

        We also support userInfo.token here so the
        dashboard works with your current setup.
      */

      const token =
        userInfo?.token ||
        localStorage.getItem("token");

      const config = token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : {};

      await API.delete(
        `/products/${id}`,
        config
      );

      // Remove product immediately from UI
      setProducts((currentProducts) =>
        currentProducts.filter(
          (product) => product._id !== id
        )
      );

      alert("Product deleted successfully.");
    } catch (error) {
      console.error(
        "DELETE PRODUCT ERROR =>",
        error?.response?.data || error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to delete product."
      );
    } finally {
      setDeleting("");
    }
  };

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const totalProducts = products.length;

  const outOfStockProducts = products.filter(
    (product) =>
      Number(product.stock ?? 0) <= 0
  ).length;

  const lowStockProducts = products.filter(
    (product) => {
      const stock = Number(product.stock ?? 0);

      return stock > 0 && stock <= 5;
    }
  ).length;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              Cartify Admin
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-gray-500">
              Manage your products and customer orders.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-black hover:text-black"
            >
              ← Back to Store
            </Link>

            <button
              type="button"
              onClick={fetchProducts}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>

          </div>
        </div>

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* TOTAL PRODUCTS */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Products
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalProducts}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                🛍️
              </div>

            </div>
          </div>

          {/* LOW STOCK */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Low Stock
                </p>

                <p className="mt-2 text-3xl font-bold text-orange-500">
                  {lowStockProducts}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-2xl">
                ⚠️
              </div>

            </div>
          </div>

          {/* OUT OF STOCK */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Out of Stock
                </p>

                <p className="mt-2 text-3xl font-bold text-red-500">
                  {outOfStockProducts}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-2xl">
                🚫
              </div>

            </div>
          </div>

          {/* STORE */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Store Status
                </p>

                <p className="mt-2 text-xl font-bold text-green-600">
                  Live
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
                ✅
              </div>

            </div>
          </div>

        </div>

        {/* =================================================
            ADMIN ACTION CARDS
        ================================================= */}

        <div className="mb-10 grid gap-5 md:grid-cols-2">

          {/* MANAGE PRODUCTS */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">

            <div className="flex flex-col">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-3xl">
                🛍️
              </div>

              <h2 className="mt-5 text-xl font-bold text-gray-900">
                Manage Products
              </h2>

              <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">
                Add new products, update existing products,
                manage pricing, stock and product information.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">

                <Link
                  to="/admin/products"
                  className="inline-flex items-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Manage Products
                  <span className="ml-2">
                    →
                  </span>
                </Link>

                <Link
                  to="/admin/products"
                  className="inline-flex items-center rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-black hover:text-black"
                >
                  Add Product
                </Link>

              </div>

              <p className="mt-5 text-sm font-semibold text-gray-900">
                {totalProducts}{" "}
                {totalProducts === 1
                  ? "product"
                  : "products"}{" "}
                available
              </p>

            </div>

          </div>

          {/* MANAGE ORDERS */}

          <Link
            to="/admin/orders"
            className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
          >

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-3xl transition-transform duration-200 group-hover:scale-110">
              📦
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              Manage Orders
            </h2>

            <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">
              View customer orders, payment information
              and update order status.
            </p>

            <span className="mt-5 inline-flex items-center text-sm font-semibold text-black">
              Open Orders

              <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </span>

          </Link>

        </div>

        {/* =================================================
            PRODUCTS SECTION HEADER
        ================================================= */}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-sm font-medium uppercase tracking-[0.15em] text-gray-400">
              Inventory
            </p>

            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              Products
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage products currently available in your
              Cartify store.
            </p>

          </div>

          <div className="w-fit rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">
            {totalProducts}{" "}
            {totalProducts === 1
              ? "Product"
              : "Products"}
          </div>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {!loading && error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h3 className="font-bold text-red-700">
                  Products could not be loaded
                </h3>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={fetchProducts}
                className="w-fit rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Try Again
              </button>

            </div>

          </div>
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

            <p className="text-sm font-medium text-gray-500">
              Loading products...
            </p>

          </div>
        )}

        {/* =================================================
            NO PRODUCTS
        ================================================= */}

        {!loading &&
          !error &&
          products.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

              <div className="mb-5 text-6xl">
                🛍️
              </div>

              <h2 className="text-2xl font-bold text-gray-900">
                No products found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-gray-500">
                There are currently no products in your
                Cartify store.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">

                <Link
                  to="/admin/products"
                  className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Add Product
                </Link>

                <button
                  type="button"
                  onClick={fetchProducts}
                  className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-black hover:text-black"
                >
                  Refresh
                </button>

              </div>

            </div>
          )}

        {/* =================================================
            PRODUCT TABLE
        ================================================= */}

        {!loading &&
          !error &&
          products.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1000px]">

                  {/* TABLE HEADER */}

                  <thead className="bg-gray-50">

                    <tr>

                      <th className="p-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                        Image
                      </th>

                      <th className="p-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                        Product
                      </th>

                      <th className="p-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                        Price
                      </th>

                      <th className="p-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                        Category
                      </th>

                      <th className="p-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                        Stock
                      </th>

                      <th className="p-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  {/* TABLE BODY */}

                  <tbody>

                    {products.map((product) => {

                      const stock =
                        Number(
                          product.stock ?? 0
                        );

                      const outOfStock =
                        stock <= 0;

                      const lowStock =
                        stock > 0 &&
                        stock <= 5;

                      return (
                        <tr
                          key={product._id}
                          className="border-t border-gray-100 transition hover:bg-gray-50"
                        >

                          {/* IMAGE */}

                          <td className="p-4">

                            <div className="h-16 w-16 overflow-hidden rounded-xl bg-gray-100">

                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={
                                    product.name ||
                                    "Product"
                                  }
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop";
                                  }}
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                  No Image
                                </div>
                              )}

                            </div>

                          </td>

                          {/* PRODUCT */}

                          <td className="p-4">

                            <p className="font-semibold text-gray-900">
                              {product.name ||
                                "Unnamed Product"}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {product.brand ||
                                "Cartify"}
                            </p>

                            {product._id && (
                              <p className="mt-1 max-w-[220px] truncate text-xs text-gray-300">
                                ID: {product._id}
                              </p>
                            )}

                          </td>

                          {/* PRICE */}

                          <td className="p-4">

                            <p className="font-bold text-gray-900">
                              ₹
                              {Number(
                                product.price || 0
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </p>

                          </td>

                          {/* CATEGORY */}

                          <td className="p-4">

                            <div className="flex flex-col items-start gap-1">

                              <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold capitalize text-gray-700">
                                {product.category ||
                                  "Uncategorized"}
                              </span>

                              {product.gender && (
                                <span className="text-xs capitalize text-gray-400">
                                  {product.gender}
                                </span>
                              )}

                            </div>

                          </td>

                          {/* STOCK */}

                          <td className="p-4">

                            {outOfStock ? (
                              <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600">
                                Out of Stock
                              </span>
                            ) : lowStock ? (
                              <div className="flex flex-col items-start gap-1">

                                <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-600">
                                  Low Stock
                                </span>

                                <span className="text-xs text-gray-500">
                                  {stock} left
                                </span>

                              </div>
                            ) : (
                              <div className="flex flex-col items-start gap-1">

                                <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-600">
                                  In Stock
                                </span>

                                <span className="text-xs text-gray-500">
                                  {stock} available
                                </span>

                              </div>
                            )}

                          </td>

                          {/* ACTIONS */}

                          <td className="p-4">

                            <div className="flex flex-wrap gap-2">

                              {/* VIEW */}

                              <Link
                                to={`/product/${product._id}`}
                                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-black hover:text-black"
                              >
                                View
                              </Link>

                              {/* EDIT */}

                              <Link
                                to={`/admin/products/edit/${product._id}`}
                                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
                              >
                                Edit
                              </Link>

                              {/* DELETE */}

                              <button
                                type="button"
                                onClick={() =>
                                  deleteProduct(
                                    product._id
                                  )
                                }
                                disabled={
                                  deleting ===
                                  product._id
                                }
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deleting ===
                                product._id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    })}

                  </tbody>

                </table>

              </div>

            </div>
          )}

        {/* =================================================
            FOOTER NOTE
        ================================================= */}

        {!loading &&
          !error &&
          products.length > 0 && (
            <div className="mt-6 flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">

              <p>
                Showing {products.length} products
                in your store.
              </p>

              <Link
                to="/admin/products"
                className="font-semibold text-gray-900 hover:underline"
              >
                Open Product Manager →
              </Link>

            </div>
          )}

      </div>
    </div>
  );
}