import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  LogOut,
  Heart,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

import { useCart } from "../context/CartContext";
import API from "../services/api";
import HeroSlider from "../components/HeroSlider";
import ProductCard from "../components/ProductCard";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] =
    useState(true);
  const [productError, setProductError] =
    useState("");

  const [searchQuery, setSearchQuery] =
    useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [cartMessage, setCartMessage] =
    useState("");

  const [wishlistCount, setWishlistCount] =
    useState(0);

  const {
    totalItems,
    cartItems,
    addToCart,
    increaseQty,
    decreaseQty,
  } = useCart();

  // =====================================================
  // USER
  // =====================================================

  const getUser = () => {
    try {
      const savedUser =
        localStorage.getItem("userInfo");

      if (!savedUser) {
        return null;
      }

      const parsed = JSON.parse(savedUser);

      if (
        !parsed ||
        typeof parsed !== "object"
      ) {
        return null;
      }

      return parsed;
    } catch (error) {
      console.error(
        "USER PARSE ERROR =>",
        error
      );

      return null;
    }
  };

  const user = getUser();
  const isAdmin =
    user?.isAdmin === true;

  // =====================================================
  // WISHLIST COUNT
  // =====================================================

  const updateWishlistCount = () => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(
          "cartifyWishlist"
        ) || "[]"
      );

      setWishlistCount(
        Array.isArray(saved)
          ? saved.length
          : 0
      );
    } catch {
      setWishlistCount(0);
    }
  };

  useEffect(() => {
    updateWishlistCount();

    const handleWishlistChange = () => {
      updateWishlistCount();
    };

    window.addEventListener(
      "cartify:wishlist",
      handleWishlistChange
    );

    window.addEventListener(
      "storage",
      handleWishlistChange
    );

    return () => {
      window.removeEventListener(
        "cartify:wishlist",
        handleWishlistChange
      );

      window.removeEventListener(
        "storage",
        handleWishlistChange
      );
    };
  }, []);

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductError("");

      const response =
        await API.get("/products");

      console.log(
        "PRODUCT API RESPONSE =>",
        response.data
      );

      let productList = [];

      if (
        Array.isArray(response.data)
      ) {
        productList =
          response.data;
      } else if (
        Array.isArray(
          response.data?.products
        )
      ) {
        productList =
          response.data.products;
      }

      setProducts(productList);
    } catch (error) {
      console.error(
        "PRODUCT FETCH ERROR =>",
        error
      );

      console.error(
        "SERVER RESPONSE =>",
        error?.response?.data
      );

      setProducts([]);

      setProductError(
        error?.response?.data
          ?.message ||
          "Unable to load products."
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "userInfo"
    );

    localStorage.removeItem(
      "token"
    );

    window.location.href = "/";
  };

  // =====================================================
  // NORMALIZE TEXT
  // =====================================================

  const normalizeText = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");
  };

  // =====================================================
  // CATEGORY MATCH
  // =====================================================

  const categoryMatches = (
    product,
    selected
  ) => {
    if (selected === "All") {
      return true;
    }

    const gender =
      normalizeText(
        product?.gender
      );

    const category =
      normalizeText(
        product?.category
      );

    const name =
      normalizeText(
        product?.name
      );

    if (selected === "Men") {
      return gender === "men";
    }

    if (selected === "Women") {
      return gender === "women";
    }

    if (selected === "Footwear") {
      const footwearWords = [
        "footwear",
        "shoe",
        "shoes",
        "sneaker",
        "sneakers",
        "boot",
        "boots",
        "sandal",
        "sandals",
        "heel",
        "heels",
        "flat",
        "flats",
        "loafer",
        "loafers",
        "slipper",
        "slippers",
        "slide",
        "slides",
      ];

      return footwearWords.some(
        (word) =>
          category === word ||
          category.includes(word) ||
          name.includes(word)
      );
    }

    if (
      selected === "Accessories"
    ) {
      const accessoryWords = [
        "accessories",
        "accessory",
        "bag",
        "bags",
        "handbag",
        "handbags",
        "backpack",
        "backpacks",
        "wallet",
        "wallets",
        "watch",
        "watches",
        "jewelry",
        "jewellery",
        "belt",
        "belts",
        "sunglasses",
        "glasses",
        "scarf",
        "scarves",
        "cap",
        "caps",
        "hat",
        "hats",
        "purse",
        "purses",
      ];

      return accessoryWords.some(
        (word) =>
          category === word ||
          category.includes(word) ||
          name.includes(word)
      );
    }

    return true;
  };

  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  const filteredProducts =
    useMemo(() => {
      const query =
        normalizeText(
          searchQuery
        );

      return products.filter(
        (product) => {
          if (
            !categoryMatches(
              product,
              selectedCategory
            )
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchableText = [
            product?.name,
            product?.brand,
            product?.category,
            product?.description,
            product?.gender,
          ]
            .map(normalizeText)
            .join(" ");

          return searchableText.includes(
            query
          );
        }
      );
    }, [
      products,
      searchQuery,
      selectedCategory,
    ]);

  const searchHasNoResult =
    !loadingProducts &&
    !productError &&
    products.length > 0 &&
    searchQuery.trim() !== "" &&
    filteredProducts.length === 0;

  // =====================================================
  // CATEGORY CLICK
  // =====================================================

  const handleCategoryClick = (
    category
  ) => {
    setSelectedCategory(
      category
    );

    setSearchQuery("");

    setTimeout(() => {
      document
        .getElementById(
          "products"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearchSubmit = (
    event
  ) => {
    event.preventDefault();

    document
      .getElementById("products")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
  };

  // =====================================================
  // CART MESSAGE
  // =====================================================

  const showCartMessage = (
    message
  ) => {
    setCartMessage(message);

    setTimeout(() => {
      setCartMessage("");
    }, 2500);
  };

  // =====================================================
  // ADD TO CART
  // =====================================================

  const handleAddToCart = (
    product
  ) => {
    const stock = Number(
      product?.stock ?? 0
    );

    if (stock <= 0) {
      showCartMessage(
        "This product is currently out of stock."
      );

      return;
    }

    const cartItem =
      cartItems.find(
        (item) =>
          item._id ===
          product._id
      );

    const currentQuantity =
      Number(
        cartItem?.qty ??
          cartItem?.quantity ??
          0
      );

    if (
      currentQuantity >= stock
    ) {
      showCartMessage(
        `Only ${stock} item${
          stock === 1
            ? ""
            : "s"
        } available for ${
          product?.name ||
          "this product"
        }.`
      );

      return;
    }

    addToCart(product);

    showCartMessage(
      `${
        product?.name ||
        "Product"
      } added to your cart`
    );
  };

  // =====================================================
  // CART QUANTITY
  // =====================================================

  const getCartQuantity = (
    productId
  ) => {
    const item =
      cartItems.find(
        (cartItem) =>
          cartItem._id ===
          productId
      );

    return Number(
      item?.qty ??
        item?.quantity ??
        0
    );
  };

  // =====================================================
  // INCREASE
  // =====================================================

  const handleIncreaseQuantity =
    (product) => {
      const stock = Number(
        product?.stock ?? 0
      );

      const currentQuantity =
        getCartQuantity(
          product._id
        );

      if (
        currentQuantity >= stock
      ) {
        showCartMessage(
          `Only ${stock} item${
            stock === 1
              ? ""
              : "s"
          } available.`
        );

        return;
      }

      increaseQty(
        product._id
      );
    };

  // =====================================================
  // DECREASE
  // =====================================================

  const handleDecreaseQuantity =
    (product) => {
      const currentQuantity =
        getCartQuantity(
          product._id
        );

      if (
        currentQuantity <= 0
      ) {
        return;
      }

      decreaseQty(
        product._id
      );
    };

  // =====================================================
  // CATEGORIES
  // =====================================================

  const categories = [
    {
      name: "Men",
      icon: "👔",
      description:
        "Modern styles for men",
    },
    {
      name: "Women",
      icon: "👗",
      description:
        "Trending styles for women",
    },
    {
      name: "Footwear",
      icon: "👟",
      description:
        "Step into style",
    },
    {
      name: "Accessories",
      icon: "👜",
      description:
        "Complete your look",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* =====================================================
          CART TOAST
      ===================================================== */}

      {cartMessage && (
        <div className="fixed right-5 top-24 z-[9999] animate-[fadeInUp_0.3s_ease-out]">
          <div className="flex min-w-[300px] items-center gap-3 rounded-2xl border border-green-200 bg-white px-5 py-4 shadow-2xl">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-600">
              ✓
            </div>

            <div>
              <p className="text-sm font-semibold !text-gray-900">
                {cartMessage}
              </p>

              <p className="mt-0.5 text-xs !text-gray-500">
                Cart updated successfully.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-6">

          {/* LOGO */}

          <Link
            to="/"
            className="shrink-0 text-2xl font-black tracking-tight !text-black"
          >
            Cartify
          </Link>

          {/* DESKTOP NAV */}

          <nav className="hidden items-center gap-7 md:flex">

            {categories.map(
              (category) => (
                <button
                  key={
                    category.name
                  }
                  type="button"
                  onClick={() =>
                    handleCategoryClick(
                      category.name
                    )
                  }
                  className={`!bg-transparent text-sm font-medium transition ${
                    selectedCategory ===
                    category.name
                      ? "!text-black"
                      : "!text-gray-600 hover:!text-black"
                  }`}
                >
                  {
                    category.name
                  }
                </button>
              )
            )}

            <button
              type="button"
              onClick={() =>
                handleCategoryClick(
                  "All"
                )
              }
              className="!bg-transparent text-sm font-medium !text-gray-600 transition hover:!text-black"
            >
              New Arrivals
            </button>

            <a
              href="#offer"
              className="text-sm font-medium !text-gray-600 transition hover:!text-black"
            >
              Sale
            </a>

          </nav>

          {/* RIGHT NAV */}

          <div className="flex items-center gap-2 sm:gap-3">

            {user ? (
              <>
                <span className="hidden whitespace-nowrap text-sm font-semibold !text-gray-900 lg:block">
                  Hi,{" "}
                  {user?.name ||
                    "User"}
                </span>

                <Link
                  to="/orders"
                  className="hidden whitespace-nowrap text-sm font-medium !text-gray-700 transition hover:!text-black sm:block"
                >
                  Orders
                </Link>

                {isAdmin && (
                  <>
                    <Link
                      to="/admin"
                      className="hidden whitespace-nowrap rounded-full !bg-[#111827] px-4 py-2 text-sm font-semibold !text-white shadow-sm transition duration-200 hover:bg-[#374151] hover:shadow-md sm:block"
                    >
                      Admin
                    </Link>

                    <Link
                      to="/admin/products"
                      className="hidden whitespace-nowrap rounded-full border border-[#111827] bg-white px-4 py-2 text-sm font-semibold text-[#111827] shadow-sm transition duration-200 hover:bg-[#111827] hover:text-white hover:shadow-md lg:block"
                    >
                      Manage Products
                    </Link>
                  </>
                )}

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  className="hidden whitespace-nowrap bg-transparent text-sm font-medium text-red-500 transition hover:text-red-700 sm:block"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/signup"
                className="hidden text-sm font-medium text-gray-700 transition hover:text-black sm:block"
              >
                Account
              </Link>
            )}

            {/* WISHLIST */}

            <Link
              to="/wishlist"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:scale-105 hover:border-black hover:text-black"
              aria-label="Wishlist"
            >
              <Heart
                size={18}
              />

              {wishlistCount >
                0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {
                    wishlistCount
                  }
                </span>
              )}
            </Link>

            {/* CART */}

            <Link
              to="/cart"
              className="flex items-center gap-2 whitespace-nowrap rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-black hover:text-black"
            >
              <ShoppingBag
                size={16}
              />

              <span className="hidden sm:inline">
                Cart
              </span>

              ({totalItems})
            </Link>

          </div>
        </div>
      </header>

      {/* =====================================================
          HERO SLIDER
      ===================================================== */}

      <HeroSlider />

      {/* =====================================================
          QUICK SEARCH
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-6">

        <form
          onSubmit={
            handleSearchSubmit
          }
          className="mx-auto flex max-w-3xl overflow-hidden rounded-full border border-gray-300 bg-white shadow-sm transition focus-within:border-black focus-within:shadow-lg"
        >

          <div className="flex flex-1 items-center">

            <Search
              size={19}
              className="ml-5 shrink-0 text-gray-400"
            />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search shirts, shoes, bags, Nike..."
              className="w-full border-0 bg-transparent px-3 py-4 text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />

          </div>

          <button
            type="submit"
            className="bg-[#111827] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#374151]"
          >
            Search
          </button>

        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">

          <span>
            Popular:
          </span>

          {[
            "T-Shirt",
            "Shirt",
            "Sneakers",
            "Dress",
            "Bag",
          ].map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setSearchQuery(
                    item
                  );

                  setTimeout(
                    () => {
                      document
                        .getElementById(
                          "products"
                        )
                        ?.scrollIntoView(
                          {
                            behavior:
                              "smooth",
                            block:
                              "start",
                          }
                        );
                    },
                    50
                  );
                }}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-gray-600 transition hover:-translate-y-0.5 hover:border-black hover:text-black"
              >
                {item}
              </button>
            )
          )}

        </div>

      </section>

      {/* =====================================================
          CATEGORIES
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-6">

        <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
          Shop by category
        </p>

        <div className="mt-2 flex items-center justify-between gap-4">

          <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Find What You Love
          </h2>

          <button
            type="button"
            onClick={() =>
              handleCategoryClick(
                "All"
              )
            }
            className="hidden items-center gap-1 text-sm font-semibold text-gray-700 transition hover:text-black sm:flex"
          >
            View All
            <ChevronRight
              size={16}
            />
          </button>

        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">

          {categories.map(
            (category) => {
              const active =
                selectedCategory ===
                category.name;

              return (
                <button
                  key={
                    category.name
                  }
                  type="button"
                  onClick={() =>
                    handleCategoryClick(
                      category.name
                    )
                  }
                  className={`group rounded-2xl border p-6 text-left transition duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    active
                      ? "border-[#111827] bg-[#111827] text-white shadow-lg"
                      : "border-gray-200 bg-white text-gray-900"
                  }`}
                >

                  <div className="text-3xl transition duration-300 group-hover:scale-110">
                    {
                      category.icon
                    }
                  </div>

                  <p className="mt-4 font-semibold">
                    {
                      category.name
                    }
                  </p>

                  <p
                    className={`mt-1 text-sm ${
                      active
                        ? "text-gray-300"
                        : "text-gray-500"
                    }`}
                  >
                    {
                      category.description
                    }
                  </p>

                </button>
              );
            }
          )}

        </div>
      </section>

      {/* =====================================================
          PRODUCTS
      ===================================================== */}

      <section
        id="products"
        className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 md:px-6"
      >

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <Sparkles
                size={16}
                className="text-orange-500"
              />

              <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
                {searchQuery
                  ? "Search Results"
                  : selectedCategory ===
                    "All"
                  ? "Trending"
                  : selectedCategory}
              </p>

            </div>

            <h2 className="mt-2 text-3xl font-black text-gray-900 md:text-4xl">
              {searchQuery
                ? `Results for "${searchQuery}"`
                : selectedCategory ===
                  "All"
                ? "New Arrivals"
                : `${selectedCategory} Collection`}
            </h2>

            <p className="mt-2 max-w-xl text-sm text-gray-500">
              Curated styles designed
              for everyday confidence.
            </p>

          </div>

          <div className="flex items-center gap-4">

            <span className="text-sm text-gray-500">
              {
                filteredProducts.length
              }{" "}
              {filteredProducts.length ===
              1
                ? "Product"
                : "Products"}
            </span>

            {(searchQuery ||
              selectedCategory !==
                "All") && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
              >
                Clear
              </button>
            )}

          </div>
        </div>

        {/* LOADING */}

        {loadingProducts && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="animate-pulse overflow-hidden rounded-3xl border border-gray-200"
                >
                  <div className="aspect-/[4/5] bg-gray-200" />

                  <div className="space-y-3 p-5">

                    <div className="h-3 w-20 rounded bg-gray-200" />

                    <div className="h-5 w-32 rounded bg-gray-200" />

                    <div className="h-4 w-24 rounded bg-gray-200" />

                    <div className="h-8 w-full rounded bg-gray-200" />

                  </div>
                </div>
              )
            )}

          </div>
        )}

        {/* ERROR */}

        {!loadingProducts &&
          productError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">

              <h3 className="font-semibold text-red-700">
                Products could
                not be loaded
              </h3>

              <p className="mt-2 text-sm text-red-600">
                {productError}
              </p>

              <button
                type="button"
                onClick={
                  fetchProducts
                }
                className="mt-5 rounded-full bg-[#111827] px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
              >
                Retry
              </button>

            </div>
          )}

        {/* NO PRODUCTS */}

        {!loadingProducts &&
          !productError &&
          products.length ===
            0 && (
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-12 text-center">

              <div className="text-5xl">
                🛍️
              </div>

              <h3 className="mt-5 text-xl font-semibold text-gray-900">
                No products
                available
              </h3>

              <p className="mt-2 text-gray-500">
                Admin needs to
                add products
                first.
              </p>

              {isAdmin && (
                <div className="mt-6 flex flex-wrap justify-center gap-3">

                  <Link
                    to="/admin"
                    className="rounded-full bg-[#111827] px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
                  >
                    Admin Dashboard
                  </Link>

                  <Link
                    to="/admin/products"
                    className="rounded-full border border-[#111827] bg-white px-6 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#111827] hover:text-white"
                  >
                    Manage
                    Products
                  </Link>

                </div>
              )}

            </div>
          )}

        {/* SEARCH EMPTY */}

        {searchHasNoResult && (
          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-12 text-center">

            <div className="text-5xl">
              🔍
            </div>

            <h3 className="mt-5 text-2xl font-semibold text-gray-900">
              No products
              found
            </h3>

            <p className="mx-auto mt-3 max-w-lg text-gray-500">
              We couldn't find a
              product matching{" "}
              <strong className="text-gray-900">
                "{searchQuery}"
              </strong>
              .
            </p>

            <p className="mt-2 text-sm text-gray-400">
              Try another product
              name, brand or
              category.
            </p>

            <button
              type="button"
              onClick={
                clearFilters
              }
              className="mt-6 rounded-full bg-[#111827] px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
            >
              View All
              Products
            </button>

          </div>
        )}

        {/* FILTER EMPTY */}

        {!loadingProducts &&
          !productError &&
          products.length > 0 &&
          !searchQuery &&
          filteredProducts.length ===
            0 && (
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-12 text-center">

              <div className="text-5xl">
                🛍️
              </div>

              <h3 className="mt-5 text-xl font-semibold text-gray-900">
                No products in
                this category
              </h3>

              <p className="mt-2 text-gray-500">
                Try another
                category.
              </p>

              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="mt-6 rounded-full bg-[#111827] px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
              >
                View All
              </button>

            </div>
          )}

        {/* =====================================================
            NEW PRODUCT GRID
        ===================================================== */}

        {!loadingProducts &&
          !productError &&
          filteredProducts.length >
            0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

              {filteredProducts.map(
                (
                  product,
                  index
                ) => (
                  <div
                    key={
                      product._id
                    }
                    className="animate-[fadeInUp_0.5s_ease-out_both]"
                    style={{
                      animationDelay: `${Math.min(
                        index * 70,
                        500
                      )}ms`,
                    }}
                  >
                    <ProductCard
                      product={
                        product
                      }
                      onAdded={(
                        name
                      ) => {
                        showCartMessage(
                          `${name} added to your cart`
                        );
                      }}
                    />
                  </div>
                )
              )}

            </div>
          )}

      </section>

      {/* =====================================================
          OFFER
      ===================================================== */}

      <section
        id="offer"
        className="bg-[#f7f3ee]"
      >

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:px-6">

          <div className="group overflow-hidden rounded-3xl">

            <img
              src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1600&auto=format&fit=crop"
              alt="Cartify fashion collection"
              className="h-/[450px] w-full object-cover transition duration-700 group-hover:scale-105"
              onError={(
                event
              ) => {
                event.currentTarget.src =
                  FALLBACK_IMAGE;
              }}
            />

          </div>

          <div>

            <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
              Limited Offer
            </p>

            <h2 className="mt-2 text-4xl font-black text-gray-900">
              Fresh Fits for
              Men & Women
            </h2>

            <p className="mt-4 text-lg text-gray-600">
              Discover versatile
              everyday essentials
              designed for comfort,
              style and confidence.
            </p>

            <button
              type="button"
              onClick={() =>
                handleCategoryClick(
                  "All"
                )
              }
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#111827] px-6 py-3 text-white transition hover:-translate-y-1 hover:bg-gray-700 hover:shadow-lg"
            >
              Shop the Edit
              <ArrowRight
                size={17}
              />
            </button>

          </div>

        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-gray-200">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-gray-500 md:flex-row md:px-6">

          <p>
            © 2026 Cartify.
            All rights reserved.
          </p>

          <div className="flex gap-6">

            <a
              href="#"
              className="transition hover:text-black"
            >
              Instagram
            </a>

            <a
              href="#"
              className="transition hover:text-black"
            >
              WhatsApp
            </a>

            <a
              href="#"
              className="transition hover:text-black"
            >
              Support
            </a>

          </div>

        </div>
      </footer>

    </div>
  );
}