import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

const initialForm = {
  name: "",
  brand: "Cartify",
  category: "",
  gender: "unisex",
  price: "",
  image: "",
  description: "",
  stock: "",
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  // =====================================================
  // FILTER STATES
  // =====================================================

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // =====================================================
  // GET USER
  // =====================================================

  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("userInfo") || "null"
    );
  } catch (error) {
    user = null;
  }

  const isAdmin = user?.isAdmin === true;

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/products");

      console.log(
        "ADMIN PRODUCTS RESPONSE:",
        response.data
      );

      if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else if (
        Array.isArray(response.data?.products)
      ) {
        setProducts(response.data.products);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error(
        "FETCH PRODUCTS ERROR:",
        err?.response?.data || err
      );

      setProducts([]);

      setError(
        err?.response?.data?.message ||
          "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  // =====================================================
  // HANDLE FORM CHANGE
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setForm({ ...initialForm });
    setEditingId(null);
  };

  // =====================================================
  // VALIDATE FORM
  // =====================================================

  const validateForm = () => {
    if (!form.name.trim()) {
      alert("Product name is required.");
      return false;
    }

    if (!form.brand.trim()) {
      alert("Brand is required.");
      return false;
    }

    if (!form.category.trim()) {
      alert("Category is required.");
      return false;
    }

    if (!form.price || Number(form.price) < 0) {
      alert("Please enter a valid price.");
      return false;
    }

    if (!form.image.trim()) {
      alert("Product image URL is required.");
      return false;
    }

    if (!form.description.trim()) {
      alert("Product description is required.");
      return false;
    }

    if (
      form.stock === "" ||
      Number(form.stock) < 0
    ) {
      alert("Please enter a valid stock quantity.");
      return false;
    }

    return true;
  };

  // =====================================================
  // ADD / UPDATE PRODUCT
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        category: form.category.trim(),
        gender: form.gender,
        price: Number(form.price),
        image: form.image.trim(),
        description: form.description.trim(),
        stock: Number(form.stock),
      };

      console.log("PRODUCT PAYLOAD:", payload);

      // =================================================
      // UPDATE
      // =================================================

      if (editingId) {
        const response = await API.put(
          `/products/${editingId}`,
          payload
        );

        console.log(
          "UPDATED PRODUCT:",
          response.data
        );

        const updatedProduct =
          response.data?.product || response.data;

        setProducts((previous) =>
          previous.map((product) =>
            product._id === editingId
              ? updatedProduct
              : product
          )
        );

        alert("Product updated successfully.");

        resetForm();

        return;
      }

      // =================================================
      // ADD
      // =================================================

      const response = await API.post(
        "/products",
        payload
      );

      console.log(
        "NEW PRODUCT:",
        response.data
      );

      const newProduct =
        response.data?.product || response.data;

      setProducts((previous) => [
        newProduct,
        ...previous,
      ]);

      alert("Product added successfully.");

      resetForm();
    } catch (err) {
      console.error(
        "SAVE PRODUCT ERROR:",
        err?.response?.data || err
      );

      alert(
        err?.response?.data?.message ||
          "Unable to save product."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // EDIT PRODUCT
  // =====================================================

  const handleEdit = (product) => {
    if (!product?._id) {
      return;
    }

    setEditingId(product._id);

    setForm({
      name: product.name || "",
      brand: product.brand || "Cartify",
      category: product.category || "",
      gender: product.gender || "unisex",
      price:
        product.price !== undefined
          ? product.price
          : "",
      image: product.image || "",
      description: product.description || "",
      stock:
        product.stock !== undefined
          ? product.stock
          : "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // DELETE PRODUCT
  // =====================================================

  const handleDelete = async (id) => {
    if (!id) {
      alert("Product ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(id);

      await API.delete(`/products/${id}`);

      setProducts((previous) =>
        previous.filter(
          (product) => product._id !== id
        )
      );

      if (editingId === id) {
        resetForm();
      }

      alert("Product deleted successfully.");
    } catch (err) {
      console.error(
        "DELETE PRODUCT ERROR:",
        err?.response?.data || err
      );

      alert(
        err?.response?.data?.message ||
          "Unable to delete product."
      );
    } finally {
      setDeleting("");
    }
  };

  // =====================================================
  // FILTER CATEGORIES
  // =====================================================

  const categories = [
    ...new Set(
      products
        .map((product) => product.category)
        .filter(Boolean)
    ),
  ];

  // =====================================================
  // FILTER + SEARCH + SORT
  // =====================================================

  const filteredProducts = products
    .filter((product) => {
      const searchText = search
        .toLowerCase()
        .trim();

      if (!searchText) {
        return true;
      }

      return (
        product.name
          ?.toLowerCase()
          .includes(searchText) ||
        product.brand
          ?.toLowerCase()
          .includes(searchText) ||
        product.category
          ?.toLowerCase()
          .includes(searchText)
      );
    })
    .filter((product) => {
      if (categoryFilter === "all") {
        return true;
      }

      return (
        product.category?.toLowerCase() ===
        categoryFilter.toLowerCase()
      );
    })
    .filter((product) => {
      if (genderFilter === "all") {
        return true;
      }

      return (
        product.gender?.toLowerCase() ===
        genderFilter.toLowerCase()
      );
    })
    .filter((product) => {
      const stock = Number(product.stock || 0);

      if (stockFilter === "all") {
        return true;
      }

      if (stockFilter === "in-stock") {
        return stock > 5;
      }

      if (stockFilter === "low-stock") {
        return stock > 0 && stock <= 5;
      }

      if (stockFilter === "out-of-stock") {
        return stock <= 0;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") {
        return (
          Number(a.price || 0) -
          Number(b.price || 0)
        );
      }

      if (sortBy === "price-high") {
        return (
          Number(b.price || 0) -
          Number(a.price || 0)
        );
      }

      if (sortBy === "name") {
        return (a.name || "").localeCompare(
          b.name || ""
        );
      }

      return (
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
      );
    });

  // =====================================================
  // RESET FILTERS
  // =====================================================

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setGenderFilter("all");
    setStockFilter("all");
    setSortBy("newest");
  };

  // =====================================================
  // ADMIN PROTECTION
  // =====================================================

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">

          <div className="text-5xl">
            🔒
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Admin Access Required
          </h1>

          <p className="mt-3 text-gray-500">
            You do not have permission to manage
            products.
          </p>

          <Link
            to="/"
            className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Go Home
          </Link>

        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">

          <Link
            to="/"
            className="text-2xl font-bold tracking-tight text-black"
          >
            Cartify
          </Link>

          <nav className="flex items-center gap-5">

            <Link
              to="/"
              className="text-sm font-medium text-gray-600 transition hover:text-black"
            >
              Store
            </Link>

            <Link
              to="/admin"
              className="text-sm font-semibold text-black"
            >
              Admin
            </Link>

            <Link
              to="/admin/orders"
              className="hidden text-sm font-medium text-gray-600 transition hover:text-black sm:block"
            >
              Orders
            </Link>

          </nav>

        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              Cartify Admin
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
              Product Management
            </h1>

            <p className="mt-2 text-gray-500">
              Add new products, update existing
              products, manage stock and remove
              products.
            </p>

          </div>

          <Link
            to="/admin"
            className="inline-flex w-fit rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-black hover:text-black"
          >
            ← Admin Dashboard
          </Link>

        </div>

        {/* =================================================
            PRODUCT FORM
        ================================================= */}

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-2xl font-bold text-gray-900">
                {editingId
                  ? "Edit Product"
                  : "Add New Product"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {editingId
                  ? "Update the product information below."
                  : "Enter the product details to add it to Cartify."}
              </p>

            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="w-fit rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-black hover:text-black"
              >
                Cancel Edit
              </button>
            )}

          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 md:grid-cols-2"
          >

            {/* NAME */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Product Name *
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Classic Cotton T-Shirt"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
              />

            </div>

            {/* BRAND */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Brand *
              </label>

              <input
                type="text"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                placeholder="e.g. Nike"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
              />

            </div>

            {/* CATEGORY */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Category *
              </label>

              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. T-Shirts, Shoes, Bags"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
              />

            </div>

            {/* GENDER */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Gender
              </label>

              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
              >

                <option value="unisex">
                  Unisex
                </option>

                <option value="men">
                  Men
                </option>

                <option value="women">
                  Women
                </option>

              </select>

            </div>

            {/* PRICE */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Price *
              </label>

              <input
                type="number"
                name="price"
                min="0"
                step="1"
                value={form.price}
                onChange={handleChange}
                placeholder="e.g. 1999"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
              />

            </div>

            {/* STOCK */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Stock *
              </label>

              <input
                type="number"
                name="stock"
                min="0"
                step="1"
                value={form.stock}
                onChange={handleChange}
                placeholder="e.g. 25"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
              />

            </div>

            {/* IMAGE */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Image URL *
              </label>

              <input
                type="url"
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="https://example.com/product-image.jpg"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
              />

              {form.image && (
                <div className="mt-3">

                  <p className="mb-2 text-xs font-medium text-gray-500">
                    Image Preview
                  </p>

                  <div className="h-40 w-32 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">

                    <img
                      src={form.image}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />

                  </div>

                </div>
              )}

            </div>

            {/* DESCRIPTION */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Description *
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the product..."
                rows={5}
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
              />

            </div>

            {/* BUTTONS */}

            <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Product"
                  : "Add Product"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-black hover:text-black disabled:opacity-50"
                >
                  Cancel
                </button>
              )}

            </div>

          </form>

        </section>

        {/* =================================================
            PRODUCTS SECTION
        ================================================= */}

        <section className="mt-10">

          {/* HEADER */}

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-2xl font-bold text-gray-900">
                All Products
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Products currently available in your
                Cartify store.
              </p>

            </div>

            <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">
              {products.length}{" "}
              {products.length === 1
                ? "Product"
                : "Products"}
            </div>

          </div>

          {/* =================================================
              SEARCH + FILTER
          ================================================= */}

          <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">

              {/* SEARCH */}

              <div className="lg:col-span-2">

                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Search Products
                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                  </span>

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search name, brand or category..."
                    className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-black"
                  />

                </div>

              </div>

              {/* CATEGORY */}

              <div>

                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Category
                </label>

                <select
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
                >

                  <option value="all">
                    All Categories
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}

                </select>

              </div>

              {/* GENDER */}

              <div>

                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Gender
                </label>

                <select
                  value={genderFilter}
                  onChange={(event) =>
                    setGenderFilter(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-black"
                >

                  <option value="all">
                    All Gender
                  </option>

                  <option value="men">
                    Men
                  </option>

                  <option value="women">
                    Women
                  </option>

                  <option value="unisex">
                    Unisex
                  </option>

                </select>

              </div>

              {/* STOCK */}

              <div>

                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Stock
                </label>

                <select
                  value={stockFilter}
                  onChange={(event) =>
                    setStockFilter(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-black"
                >

                  <option value="all">
                    All Stock
                  </option>

                  <option value="in-stock">
                    In Stock
                  </option>

                  <option value="low-stock">
                    Low Stock
                  </option>

                  <option value="out-of-stock">
                    Out of Stock
                  </option>

                </select>

              </div>

            </div>

            {/* FILTER FOOTER */}

            <div className="mt-4 flex flex-col gap-4 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

                <label className="text-sm font-semibold text-gray-700">
                  Sort by
                </label>

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value)
                  }
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-black"
                >

                  <option value="newest">
                    Newest
                  </option>

                  <option value="price-low">
                    Price: Low to High
                  </option>

                  <option value="price-high">
                    Price: High to Low
                  </option>

                  <option value="name">
                    Name: A-Z
                  </option>

                </select>

              </div>

              <div className="flex flex-wrap items-center gap-3">

                <span className="text-sm text-gray-500">
                  Showing{" "}
                  <strong className="text-gray-900">
                    {filteredProducts.length}
                  </strong>{" "}
                  of{" "}
                  <strong className="text-gray-900">
                    {products.length}
                  </strong>
                </span>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-black hover:text-black"
                >
                  Reset Filters
                </button>

              </div>

            </div>

          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (
            <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm">

              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

              <p className="text-sm text-gray-500">
                Loading products...
              </p>

            </div>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {!loading && error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">

              <div className="text-4xl">
                ⚠️
              </div>

              <h3 className="mt-4 font-bold text-red-700">
                Products could not be loaded
              </h3>

              <p className="mt-2 text-sm text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchProducts}
                className="mt-5 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Retry
              </button>

            </div>
          )}

          {/* =================================================
              EMPTY DATABASE
          ================================================= */}

          {!loading &&
            !error &&
            products.length === 0 && (
              <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm">

                <div className="text-5xl">
                  🛍️
                </div>

                <h3 className="mt-5 text-xl font-bold text-gray-900">
                  No products found
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Add your first product using the
                  form above.
                </p>

              </div>
            )}

          {/* =================================================
              NO FILTER RESULTS
          ================================================= */}

          {!loading &&
            !error &&
            products.length > 0 &&
            filteredProducts.length === 0 && (
              <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm">

                <div className="text-5xl">
                  🔎
                </div>

                <h3 className="mt-5 text-xl font-bold text-gray-900">
                  No matching products
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Try changing your search or filters.
                </p>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Clear Filters
                </button>

              </div>
            )}

          {/* =================================================
              PRODUCT GRID
          ================================================= */}

          {!loading &&
            !error &&
            filteredProducts.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                {filteredProducts.map((product) => {

                  const stock = Number(
                    product.stock || 0
                  );

                  const outOfStock = stock <= 0;

                  return (
                    <div
                      key={product._id}
                      className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >

                      {/* IMAGE */}

                      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">

                        {product.image ? (
                          <img
                            src={product.image}
                            alt={
                              product.name ||
                              "Product"
                            }
                            className="h-full w-full object-cover transition duration-500 hover:scale-105"
                            onError={(event) => {
                              event.currentTarget.src =
                                "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop";
                            }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-gray-400">
                            No Image
                          </div>
                        )}

                        {/* STOCK BADGE */}

                        {outOfStock ? (
                          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white">
                            OUT OF STOCK
                          </span>
                        ) : stock <= 5 ? (
                          <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-bold text-white">
                            ONLY {stock} LEFT
                          </span>
                        ) : (
                          <span className="absolute left-3 top-3 rounded-full bg-green-600 px-3 py-1.5 text-xs font-bold text-white">
                            IN STOCK
                          </span>
                        )}

                      </div>

                      {/* INFO */}

                      <div className="p-5">

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                              {product.brand ||
                                "Cartify"}
                            </p>

                            <h3 className="mt-1 truncate text-lg font-bold text-gray-900">
                              {product.name ||
                                "Unnamed Product"}
                            </h3>

                          </div>

                          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-600">
                            {product.gender ||
                              "unisex"}
                          </span>

                        </div>

                        <p className="mt-2 text-sm capitalize text-gray-500">
                          {product.category ||
                            "Uncategorized"}
                        </p>

                        {/* PRICE */}

                        <div className="mt-4 flex items-center justify-between gap-3">

                          <span className="text-xl font-bold text-gray-900">
                            ₹
                            {Number(
                              product.price || 0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </span>

                          <span
                            className={`text-right text-xs font-semibold ${
                              outOfStock
                                ? "text-red-600"
                                : stock <= 5
                                ? "text-orange-600"
                                : "text-green-600"
                            }`}
                          >
                            {outOfStock
                              ? "Unavailable"
                              : `${stock} in stock`}
                          </span>

                        </div>

                        {/* DESCRIPTION */}

                        <p className="mt-3 line-clamp-2 text-sm leading-5 text-gray-500">
                          {product.description ||
                            "No description available."}
                        </p>

                        {/* ACTIONS */}

                        <div className="mt-5 flex gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(product)
                            }
                            className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-black hover:text-black"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                product._id
                              )
                            }
                            disabled={
                              deleting ===
                              product._id
                            }
                            className="flex-1 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deleting ===
                            product._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

        </section>

      </main>

    </div>
  );
}