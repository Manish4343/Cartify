import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import { useCart } from "../context/CartContext";
import {
  Heart,
  Star,
  ShoppingBag,
  Check,
  ZoomIn,
} from "lucide-react";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop";

const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];

const DEFAULT_COLORS = [
  {
    name: "Black",
    value: "#111111",
  },
  {
    name: "White",
    value: "#ffffff",
  },
  {
    name: "Blue",
    value: "#2563eb",
  },
];

// =====================================================
// COLOR NAME -> REAL CSS COLOR
// =====================================================

const COLOR_MAP = {
  black: "#111111",
  white: "#ffffff",
  blue: "#2563eb",
  navy: "#0f172a",
  "navy blue": "#0f172a",
  "sky blue": "#38bdf8",
  red: "#ef4444",
  green: "#22c55e",
  yellow: "#facc15",
  orange: "#f97316",
  purple: "#a855f7",
  pink: "#ec4899",
  brown: "#92400e",
  maroon: "#7f1d1d",
  burgundy: "#800020",
  grey: "#6b7280",
  gray: "#6b7280",
  silver: "#c0c0c0",
  gold: "#d4af37",
  beige: "#d6c3a5",
  cream: "#fffdd0",
  ivory: "#fffff0",
  teal: "#0d9488",
  cyan: "#06b6d4",
  turquoise: "#14b8a6",
  olive: "#808000",
  khaki: "#c3b091",
  violet: "#8b5cf6",
  lavender: "#c4b5fd",
  lime: "#84cc16",
  charcoal: "#36454f",
};

// =====================================================
// NORMALIZE COLOR
// Supports:
// "Black"
// "#111111"
// "rgb(...)"
// { name: "Black", value: "#111111" }
// { name: "Black", hex: "#111111" }
// =====================================================

const normalizeColor = (color) => {
  // String color
  if (typeof color === "string") {
    const name = color.trim();
    const key = name.toLowerCase();

    return {
      name: name || "Color",
      value:
        COLOR_MAP[key] ||
        (name.startsWith("#")
          ? name
          : /^rgb/i.test(name) ||
            /^hsl/i.test(name) ||
            /^oklch/i.test(name)
          ? name
          : "#111111"),
    };
  }

  // Object color
  const name = String(
    color?.name ||
      color?.label ||
      color?.color ||
      "Color"
  ).trim();

  const key = name.toLowerCase();

  const rawValue = String(
    color?.value ||
      color?.hex ||
      color?.code ||
      ""
  ).trim();

  return {
    name: name || "Color",
    value:
      rawValue ||
      COLOR_MAP[key] ||
      "#111111",
  };
};

// =====================================================
// LIGHT COLOR CHECK
// Used to make check icon visible on white/light colors
// =====================================================

const isLightColor = (value) => {
  const color = String(value || "").toLowerCase();

  const lightColors = [
    "#ffffff",
    "#fff",
    "#facc15",
    "#fffdd0",
    "#fffff0",
    "#d6c3a5",
    "#c4b5fd",
    "#c0c0c0",
    "white",
    "yellow",
    "cream",
    "ivory",
    "beige",
    "silver",
    "lavender",
  ];

  return lightColors.includes(color);
};

// =====================================================
// PRODUCT DETAILS
// =====================================================

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { addToCart } = useCart();

  // =====================================================
  // STATE
  // =====================================================

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [error, setError] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  const [wishlist, setWishlist] = useState(false);
  const [toast, setToast] = useState("");

  const [selectedImage, setSelectedImage] = useState("");
  const [zoomOpen, setZoomOpen] = useState(false);

  const [reviews, setReviews] = useState([]);

  const [reviewForm, setReviewForm] = useState({
    name: "",
    rating: 5,
    comment: "",
  });

  // =====================================================
  // TOAST
  // =====================================================

  const showToast = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 2200);
  };

  // =====================================================
  // FETCH PRODUCT
  // =====================================================

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get(
          `/products/${id}`
        );

        const productData =
          response.data?.product ||
          response.data;

        if (!productData) {
          throw new Error(
            "Product not found"
          );
        }

        setProduct(productData);

        // -------------------------------------------------
        // IMAGE
        // -------------------------------------------------

        setSelectedImage(
          productData.image ||
            FALLBACK_IMAGE
        );

        // -------------------------------------------------
        // SIZE
        // -------------------------------------------------

        const productSizes =
          Array.isArray(productData.sizes) &&
          productData.sizes.length > 0
            ? productData.sizes
            : DEFAULT_SIZES;

        setSelectedSize(
          productSizes[0] || ""
        );

        // -------------------------------------------------
        // COLOR
        // -------------------------------------------------

        const productColors =
          Array.isArray(productData.colors) &&
          productData.colors.length > 0
            ? productData.colors
            : DEFAULT_COLORS;

        const firstColor =
          normalizeColor(
            productColors[0]
          );

        setSelectedColor(
          firstColor.name
        );

        // Reset quantity whenever product changes
        setQuantity(1);
      } catch (err) {
        console.error(
          "PRODUCT DETAILS ERROR:",
          err?.response?.data || err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load product."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // =====================================================
  // WISHLIST
  // =====================================================

  useEffect(() => {
    if (!id) return;

    try {
      const savedWishlist =
        JSON.parse(
          localStorage.getItem(
            "cartifyWishlist"
          ) || "[]"
        );

      const exists =
        Array.isArray(savedWishlist) &&
        savedWishlist.some(
          (item) =>
            item?._id === id ||
            item === id
        );

      setWishlist(Boolean(exists));
    } catch (err) {
      console.error(
        "WISHLIST LOAD ERROR:",
        err
      );

      setWishlist(false);
    }
  }, [id]);

  const toggleWishlist = () => {
    if (!product?._id) return;

    try {
      const saved =
        JSON.parse(
          localStorage.getItem(
            "cartifyWishlist"
          ) || "[]"
        );

      const wishlistArray =
        Array.isArray(saved)
          ? saved
          : [];

      const exists =
        wishlistArray.some(
          (item) =>
            item?._id ===
              product._id ||
            item === product._id
        );

      let updated;

      if (exists) {
        updated =
          wishlistArray.filter(
            (item) =>
              item?._id !==
                product._id &&
              item !== product._id
          );

        setWishlist(false);
        showToast(
          "Removed from wishlist"
        );
      } else {
        updated = [
          ...wishlistArray,
          {
            _id: product._id,
            name: product.name,
            price: product.price,
            image: product.image,
            category:
              product.category,
          },
        ];

        setWishlist(true);
        showToast(
          "Added to wishlist ❤️"
        );
      }

      localStorage.setItem(
        "cartifyWishlist",
        JSON.stringify(updated)
      );
    } catch (err) {
      console.error(
        "WISHLIST ERROR:",
        err
      );
    }
  };

  // =====================================================
  // RECENTLY VIEWED
  // =====================================================

  useEffect(() => {
    if (!product?._id) return;

    try {
      const saved =
        JSON.parse(
          localStorage.getItem(
            "cartifyRecentlyViewed"
          ) || "[]"
        );

      const list = Array.isArray(saved)
        ? saved
        : [];

      const currentProduct = {
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        category:
          product.category,
        brand: product.brand,
      };

      const filtered =
        list.filter(
          (item) =>
            item?._id !==
            product._id
        );

      const updated = [
        currentProduct,
        ...filtered,
      ].slice(0, 6);

      localStorage.setItem(
        "cartifyRecentlyViewed",
        JSON.stringify(updated)
      );

      setRecentProducts(
        updated.filter(
          (item) =>
            item?._id !==
            product._id
        )
      );
    } catch (err) {
      console.error(
        "RECENTLY VIEWED ERROR:",
        err
      );
    }
  }, [product]);

  // =====================================================
  // RELATED PRODUCTS
  // =====================================================

  useEffect(() => {
    const fetchRelatedProducts =
      async () => {
        if (!product?._id) return;

        try {
          setRelatedLoading(true);

          const response =
            await API.get(
              "/products"
            );

          const data =
            Array.isArray(
              response.data
            )
              ? response.data
              : response.data
                  ?.products || [];

          const sameCategory =
            data.filter(
              (item) =>
                item?._id !==
                  product._id &&
                item?.category &&
                product?.category &&
                String(
                  item.category
                ).toLowerCase() ===
                  String(
                    product.category
                  ).toLowerCase()
            );

          const otherProducts =
            data.filter(
              (item) =>
                item?._id !==
                  product._id &&
                !sameCategory.some(
                  (related) =>
                    related._id ===
                    item._id
                )
            );

          setRelatedProducts(
            [
              ...sameCategory,
              ...otherProducts,
            ].slice(0, 4)
          );
        } catch (err) {
          console.error(
            "RELATED PRODUCTS ERROR:",
            err
          );

          setRelatedProducts([]);
        } finally {
          setRelatedLoading(false);
        }
      };

    fetchRelatedProducts();
  }, [product]);

  // =====================================================
  // REVIEWS
  // =====================================================

  useEffect(() => {
    if (!product?._id) return;

    try {
      const saved =
        JSON.parse(
          localStorage.getItem(
            `cartifyReviews_${product._id}`
          ) || "[]"
        );

      setReviews(
        Array.isArray(saved)
          ? saved
          : []
      );
    } catch (err) {
      console.error(
        "REVIEWS LOAD ERROR:",
        err
      );

      setReviews([]);
    }
  }, [product]);

  const averageRating =
    useMemo(() => {
      if (!reviews.length) {
        return 4.5;
      }

      const total =
        reviews.reduce(
          (sum, review) =>
            sum +
            Number(
              review.rating || 0
            ),
          0
        );

      return total / reviews.length;
    }, [reviews]);

  const submitReview = (event) => {
    event.preventDefault();

    if (!product?._id) return;

    if (!reviewForm.name.trim()) {
      showToast(
        "Please enter your name"
      );
      return;
    }

    if (
      !reviewForm.comment.trim()
    ) {
      showToast(
        "Please write a review"
      );
      return;
    }

    const newReview = {
      id: Date.now(),
      name: reviewForm.name.trim(),
      rating: Number(
        reviewForm.rating
      ),
      comment:
        reviewForm.comment.trim(),
      date: new Date().toLocaleDateString(
        "en-IN"
      ),
    };

    const updated = [
      newReview,
      ...reviews,
    ];

    setReviews(updated);

    localStorage.setItem(
      `cartifyReviews_${product._id}`,
      JSON.stringify(updated)
    );

    setReviewForm({
      name: "",
      rating: 5,
      comment: "",
    });

    showToast(
      "Review submitted ⭐"
    );
  };

  // =====================================================
  // PRODUCT VARIANTS
  // =====================================================

  const sizes =
    Array.isArray(product?.sizes) &&
    product.sizes.length > 0
      ? product.sizes
      : DEFAULT_SIZES;

  const colors =
    Array.isArray(product?.colors) &&
    product.colors.length > 0
      ? product.colors
      : DEFAULT_COLORS;

  // =====================================================
  // STOCK / PRICE
  // =====================================================

  const stock = Number(
    product?.stock ?? 0
  );

  const price = Number(
    product?.price ?? 0
  );

  const outOfStock =
    stock <= 0;

  const totalPrice =
    price * quantity;

  // =====================================================
  // QUANTITY
  // =====================================================

  const increaseQuantity = () => {
    if (quantity < stock) {
      setQuantity(
        (current) =>
          current + 1
      );
    } else {
      showToast(
        `Only ${stock} items available`
      );
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(
        (current) =>
          current - 1
      );
    }
  };

  // =====================================================
  // CART PRODUCT
  // =====================================================

  const createCartProduct = () => {
    return {
      ...product,
      selectedSize,
      selectedColor,
    };
  };

  // =====================================================
  // VALIDATE PURCHASE
  // =====================================================

  const validatePurchase = () => {
    if (!product || outOfStock) {
      showToast(
        "Product is out of stock"
      );

      return false;
    }

    if (!selectedSize) {
      showToast(
        "Please select a size"
      );

      return false;
    }

    if (!selectedColor) {
      showToast(
        "Please select a color"
      );

      return false;
    }

    if (quantity > stock) {
      showToast(
        `Only ${stock} items available`
      );

      return false;
    }

    return true;
  };

  // =====================================================
  // ADD TO CART
  // =====================================================

  const handleAddToCart = () => {
    if (!validatePurchase()) {
      return;
    }

    setAdding(true);

    const cartProduct =
      createCartProduct();

    for (
      let i = 0;
      i < quantity;
      i += 1
    ) {
      addToCart(cartProduct);
    }

    showToast(
      "Added to cart ✓"
    );

    setQuantity(1);

    setTimeout(() => {
      setAdding(false);
    }, 700);
  };

  // =====================================================
  // BUY NOW
  // =====================================================

  const handleBuyNow = () => {
    if (!validatePurchase()) {
      return;
    }

    setBuying(true);

    const cartProduct =
      createCartProduct();

    for (
      let i = 0;
      i < quantity;
      i += 1
    ) {
      addToCart(cartProduct);
    }

    setTimeout(() => {
      navigate("/checkout");
    }, 300);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link
              to="/"
              className="text-2xl font-bold text-black"
            >
              Cartify
            </Link>

            <Link
              to="/"
              className="text-sm text-gray-600"
            >
              Back to Store
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-2">
            <div className="aspect-[4/5] animate-pulse rounded-3xl bg-gray-200" />

            <div className="space-y-5 py-8">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />

              <div className="h-10 w-3/4 animate-pulse rounded bg-gray-200" />

              <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />

              <div className="h-24 w-full animate-pulse rounded bg-gray-200" />

              <div className="h-12 w-full animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="text-5xl">
            🛍️
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Product Not Found
          </h1>

          <p className="mt-3 text-gray-500">
            {error ||
              "This product is not available."}
          </p>

          <Link
            to="/"
            className="mt-6 inline-block rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  // =====================================================
  // IMAGE GALLERY
  // =====================================================

  const galleryImages = [
    product.image,
    ...(Array.isArray(
      product.images
    )
      ? product.images
      : []),
  ].filter(Boolean);

  const uniqueImages = [
    ...new Set(galleryImages),
  ];

  if (!uniqueImages.length) {
    uniqueImages.push(
      FALLBACK_IMAGE
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-white">
      {/* =====================================================
          TOAST
          ===================================================== */}

      {toast && (
        <div className="fixed right-5 top-5 z-[100] flex items-center gap-3 rounded-2xl bg-black px-5 py-4 text-sm font-semibold text-white shadow-2xl">
          <Check
            size={18}
            className="text-green-400"
          />

          {toast}
        </div>
      )}

      {/* =====================================================
          NAVBAR
          ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-6">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight text-black"
          >
            Cartify
          </Link>

          <div className="flex items-center gap-3 md:gap-5">
            <Link
              to="/"
              className="hidden text-sm font-medium text-gray-600 transition hover:text-black sm:block"
            >
              Home
            </Link>

            <Link
              to="/cart"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-black hover:text-black"
            >
              Cart
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-12">
        {/* BREADCRUMB */}

        <div className="mb-7 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <Link
            to="/"
            className="transition hover:text-black"
          >
            Home
          </Link>

          <span>/</span>

          <span className="text-gray-900">
            {product.name}
          </span>
        </div>

        {/* =================================================
            PRODUCT GRID
            ================================================= */}

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* =================================================
              IMAGE SECTION
              ================================================= */}

          <div>
            <div className="relative overflow-hidden rounded-3xl bg-gray-100">
              <img
                src={
                  selectedImage ||
                  FALLBACK_IMAGE
                }
                alt={
                  product.name ||
                  "Product"
                }
                className="aspect-[4/5] h-full w-full cursor-zoom-in object-cover transition duration-500 hover:scale-[1.02]"
                onClick={() =>
                  setZoomOpen(true)
                }
                onError={(event) => {
                  event.currentTarget.src =
                    FALLBACK_IMAGE;
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setZoomOpen(true)
                }
                className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-gray-800 shadow-lg transition hover:bg-white"
              >
                <ZoomIn size={16} />
                Zoom
              </button>

              {outOfStock && (
                <div className="absolute left-5 top-5 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white">
                  OUT OF STOCK
                </div>
              )}

              {!outOfStock &&
                stock <= 5 && (
                  <div className="absolute left-5 top-5 rounded-full bg-orange-500 px-4 py-2 text-xs font-bold text-white">
                    ONLY {stock} LEFT
                  </div>
                )}
            </div>

            {/* THUMBNAILS */}

            {uniqueImages.length >
              1 && (
              <div className="mt-4 grid grid-cols-5 gap-3">
                {uniqueImages.map(
                  (
                    image,
                    index
                  ) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() =>
                        setSelectedImage(
                          image
                        )
                      }
                      className={`overflow-hidden rounded-xl border-2 transition ${
                        selectedImage ===
                        image
                          ? "border-black"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`View ${
                          index + 1
                        }`}
                        className="aspect-square w-full object-cover"
                        onError={(
                          event
                        ) => {
                          event.currentTarget.src =
                            FALLBACK_IMAGE;
                        }}
                      />
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* =================================================
              PRODUCT INFO
              ================================================= */}

          <div className="flex flex-col justify-center">
            {/* BRAND */}

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
              {product.brand ||
                "Cartify"}
            </p>

            {/* TITLE */}

            <div className="mt-3 flex items-start justify-between gap-5">
              <h1 className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
                {product.name}
              </h1>

              <button
                type="button"
                onClick={
                  toggleWishlist
                }
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition ${
                  wishlist
                    ? "border-red-200 bg-red-50 text-red-500"
                    : "border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500"
                }`}
                aria-label="Wishlist"
              >
                <Heart
                  size={22}
                  fill={
                    wishlist
                      ? "currentColor"
                      : "none"
                  }
                />
              </button>
            </div>

            {/* RATING */}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <Star
                  size={18}
                  fill="#f59e0b"
                  className="text-yellow-500"
                />

                <span className="font-semibold text-gray-900">
                  {averageRating.toFixed(
                    1
                  )}
                </span>
              </div>

              <span className="text-gray-300">
                |
              </span>

              <span className="text-sm text-gray-500">
                {reviews.length}{" "}
                {reviews.length ===
                1
                  ? "review"
                  : "reviews"}
              </span>
            </div>

            {/* TAGS */}

            <div className="mt-5 flex flex-wrap gap-3">
              <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium capitalize text-gray-700">
                {product.category ||
                  "Fashion"}
              </span>

              {product.gender && (
                <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium capitalize text-gray-700">
                  {product.gender}
                </span>
              )}
            </div>

            {/* PRICE */}

            <div className="mt-7">
              <p className="text-3xl font-bold text-gray-900">
                ₹
                {price.toLocaleString(
                  "en-IN"
                )}
              </p>

              {!outOfStock && (
                <p
                  className={`mt-2 text-sm font-medium ${
                    stock <= 5
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {stock <= 5
                    ? `Only ${stock} left in stock`
                    : `${stock} items available`}
                </p>
              )}
            </div>

            {/* DESCRIPTION */}

            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-lg font-semibold text-gray-900">
                Product Description
              </h2>

              <p className="mt-3 leading-7 text-gray-600">
                {product.description ||
                  "Premium quality product designed for everyday comfort and style."}
              </p>
            </div>

            {/* =================================================
                PURCHASE OPTIONS
                ================================================= */}

            {!outOfStock && (
              <div className="mt-8 space-y-7 border-t border-gray-200 pt-8">
                {/* SIZE */}

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">
                      Select Size
                    </h3>

                    <button
                      type="button"
                      className="text-xs font-medium text-gray-500 underline transition hover:text-black"
                      onClick={() =>
                        showToast(
                          "Choose your usual size"
                        )
                      }
                    >
                      Size Guide
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {sizes.map(
                      (size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() =>
                            setSelectedSize(
                              size
                            )
                          }
                          className={`min-w-[54px] rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                            selectedSize ===
                            size
                              ? "border-black bg-black text-white"
                              : "border-gray-300 bg-white text-gray-700 hover:border-black"
                          }`}
                        >
                          {size}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* COLOR */}

                <div>
                  <h3 className="mb-3 text-sm font-bold text-gray-900">
                    Color

                    {selectedColor && (
                      <span className="ml-2 font-normal text-gray-500">
                        —{" "}
                        {selectedColor}
                      </span>
                    )}
                  </h3>

                  <div className="flex flex-wrap gap-4">
                    {colors.map(
                      (
                        rawColor,
                        index
                      ) => {
                        const color =
                          normalizeColor(
                            rawColor
                          );

                        const active =
                          selectedColor ===
                          color.name;

                        const light =
                          isLightColor(
                            color.value
                          );

                        return (
                          <button
                            key={`${color.name}-${index}`}
                            type="button"
                            onClick={() =>
                              setSelectedColor(
                                color.name
                              )
                            }
                            aria-label={`Select ${color.name}`}
                            className={`group flex items-center gap-2 rounded-full border bg-white px-3 py-2 transition ${
                              active
                                ? "border-black shadow-sm"
                                : "border-gray-200 hover:border-gray-500"
                            }`}
                          >
                            {/* COLOR CIRCLE */}

                            <span
                              className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-300 shadow-sm"
                              style={{
                                backgroundColor:
                                  color.value,
                              }}
                            >
                              {light && (
                                <span className="absolute inset-0 rounded-full border border-gray-300" />
                              )}

                              {active && (
                                <Check
                                  size={
                                    15
                                  }
                                  strokeWidth={
                                    3
                                  }
                                  className={
                                    light
                                      ? "text-gray-900"
                                      : "text-white"
                                  }
                                />
                              )}
                            </span>

                            {/* COLOR NAME */}

                            <span className="text-sm font-medium text-gray-700">
                              {
                                color.name
                              }
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* QUANTITY */}

                <div>
                  <h3 className="mb-3 text-sm font-bold text-gray-900">
                    Quantity
                  </h3>

                  <div className="flex h-12 w-fit items-center overflow-hidden rounded-full border border-gray-300 bg-white">
                    <button
                      type="button"
                      onClick={
                        decreaseQuantity
                      }
                      disabled={
                        quantity <= 1
                      }
                      className="flex h-full w-12 items-center justify-center bg-white text-xl text-gray-900 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                    >
                      −
                    </button>

                    <span className="flex h-full min-w-[56px] items-center justify-center border-x border-gray-200 px-3 text-sm font-semibold text-gray-900">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      onClick={
                        increaseQuantity
                      }
                      disabled={
                        quantity >= stock
                      }
                      className="flex h-full w-12 items-center justify-center bg-white text-xl text-gray-900 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* TOTAL */}

                <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-5 py-4">
                  <span className="text-sm text-gray-500">
                    Total
                  </span>

                  <span className="text-lg font-bold text-gray-900">
                    ₹
                    {totalPrice.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>

                {/* ACTIONS */}

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={
                      handleAddToCart
                    }
                    disabled={
                      adding ||
                      buying
                    }
                    className="flex h-14 items-center justify-center gap-2 rounded-full border border-black bg-white px-6 text-sm font-semibold text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShoppingBag
                      size={18}
                    />

                    {adding
                      ? "Added ✓"
                      : "Add to Cart"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleBuyNow
                    }
                    disabled={
                      buying ||
                      adding
                    }
                    className="h-14 rounded-full bg-black px-6 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {buying
                      ? "Processing..."
                      : "Buy Now"}
                  </button>
                </div>
              </div>
            )}

            {/* OUT OF STOCK */}

            {outOfStock && (
              <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="font-semibold text-red-700">
                  This product is currently
                  out of stock.
                </p>

                <p className="mt-1 text-sm text-red-600">
                  Please explore other
                  products.
                </p>
              </div>
            )}

            <Link
              to="/"
              className="mt-8 inline-flex w-fit text-sm font-semibold text-gray-600 transition hover:text-black"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* =====================================================
            REVIEWS
            ===================================================== */}

        <section className="mt-20 border-t border-gray-200 pt-14">
          <div className="grid gap-10 lg:grid-cols-3">
            {/* REVIEW SUMMARY */}

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Customer Reviews
              </h2>

              <div className="mt-6 flex items-center gap-4">
                <span className="text-5xl font-bold text-gray-900">
                  {averageRating.toFixed(
                    1
                  )}
                </span>

                <div>
                  <div className="flex gap-1">
                    {[
                      1,
                      2,
                      3,
                      4,
                      5,
                    ].map(
                      (star) => (
                        <Star
                          key={star}
                          size={18}
                          fill={
                            star <=
                            Math.round(
                              averageRating
                            )
                              ? "#f59e0b"
                              : "none"
                          }
                          className="text-yellow-500"
                        />
                      )
                    )}
                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    Based on{" "}
                    {reviews.length}{" "}
                    reviews
                  </p>
                </div>
              </div>
            </div>

            {/* REVIEW FORM */}

            <form
              onSubmit={
                submitReview
              }
              className="rounded-3xl border border-gray-200 bg-gray-50 p-6 lg:col-span-2"
            >
              <h3 className="text-lg font-bold text-gray-900">
                Write a Review
              </h3>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Your name"
                  value={
                    reviewForm.name
                  }
                  onChange={(event) =>
                    setReviewForm(
                      (previous) => ({
                        ...previous,
                        name: event.target
                          .value,
                      })
                    )
                  }
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black"
                />

                <select
                  value={
                    reviewForm.rating
                  }
                  onChange={(event) =>
                    setReviewForm(
                      (previous) => ({
                        ...previous,
                        rating:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
                >
                  <option value="5">
                    ⭐⭐⭐⭐⭐ Excellent
                  </option>

                  <option value="4">
                    ⭐⭐⭐⭐ Very Good
                  </option>

                  <option value="3">
                    ⭐⭐⭐ Good
                  </option>

                  <option value="2">
                    ⭐⭐ Average
                  </option>

                  <option value="1">
                    ⭐ Poor
                  </option>
                </select>
              </div>

              <textarea
                rows={4}
                placeholder="Share your experience..."
                value={
                  reviewForm.comment
                }
                onChange={(event) =>
                  setReviewForm(
                    (previous) => ({
                      ...previous,
                      comment:
                        event.target
                          .value,
                    })
                  )
                }
                className="mt-4 w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black"
              />

              <button
                type="submit"
                className="mt-4 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Submit Review
              </button>
            </form>
          </div>

          {/* REVIEW LIST */}

          <div className="mt-10 space-y-4">
            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                No reviews yet. Be the
                first to review this
                product.
              </div>
            ) : (
              reviews.map(
                (review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-gray-200 p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {review.name}
                        </p>

                        <p className="text-xs text-gray-400">
                          {review.date}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        {[
                          1,
                          2,
                          3,
                          4,
                          5,
                        ].map(
                          (star) => (
                            <Star
                              key={star}
                              size={15}
                              fill={
                                star <=
                                Number(
                                  review.rating
                                )
                                  ? "#f59e0b"
                                  : "none"
                              }
                              className="text-yellow-500"
                            />
                          )
                        )}
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-gray-600">
                      {review.comment}
                    </p>
                  </div>
                )
              )
            )}
          </div>
        </section>

        {/* =====================================================
            RELATED PRODUCTS
            ===================================================== */}

        <section className="mt-20 border-t border-gray-200 pt-14">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                You may also like
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                Related Products
              </h2>
            </div>

            <Link
              to="/"
              className="text-sm font-semibold text-gray-600 transition hover:text-black"
            >
              View All →
            </Link>
          </div>

          {relatedLoading ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                1,
                2,
                3,
                4,
              ].map(
                (item) => (
                  <div
                    key={item}
                    className="overflow-hidden rounded-3xl border border-gray-200"
                  >
                    <div className="aspect-[4/5] animate-pulse bg-gray-200" />

                    <div className="space-y-3 p-5">
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />

                      <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />

                      <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : relatedProducts.length ===
            0 ? (
            <div className="mt-8 rounded-3xl border border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
              No related products available.
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map(
                (item) => (
                  <Link
                    key={item._id}
                    to={`/product/${item._id}`}
                    className="group overflow-hidden rounded-3xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="aspect-[4/5] overflow-hidden bg-gray-100">
                      <img
                        src={
                          item.image ||
                          FALLBACK_IMAGE
                        }
                        alt={
                          item.name ||
                          "Product"
                        }
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        onError={(
                          event
                        ) => {
                          event.currentTarget.src =
                            FALLBACK_IMAGE;
                        }}
                      />
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        {item.brand ||
                          "Cartify"}
                      </p>

                      <h3 className="mt-1 line-clamp-1 text-lg font-bold text-gray-900">
                        {item.name ||
                          "Product"}
                      </h3>

                      <p className="mt-2 text-xl font-bold text-gray-900">
                        ₹
                        {Number(
                          item.price ||
                            0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>
                  </Link>
                )
              )}
            </div>
          )}
        </section>

        {/* =====================================================
            RECENTLY VIEWED
            ===================================================== */}

        {recentProducts.length >
          0 && (
          <section className="mt-20 border-t border-gray-200 pt-14">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Continue browsing
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                Recently Viewed
              </h2>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {recentProducts
                .slice(0, 4)
                .map((item) => (
                  <Link
                    key={item._id}
                    to={`/product/${item._id}`}
                    className="group overflow-hidden rounded-3xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="aspect-[4/5] overflow-hidden bg-gray-100">
                      <img
                        src={
                          item.image ||
                          FALLBACK_IMAGE
                        }
                        alt={
                          item.name ||
                          "Product"
                        }
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        onError={(
                          event
                        ) => {
                          event.currentTarget.src =
                            FALLBACK_IMAGE;
                        }}
                      />
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        {item.brand ||
                          "Cartify"}
                      </p>

                      <h3 className="mt-1 line-clamp-1 text-lg font-bold text-gray-900">
                        {item.name ||
                          "Product"}
                      </h3>

                      <p className="mt-2 font-bold text-gray-900">
                        ₹
                        {Number(
                          item.price ||
                            0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        )}
      </main>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="mt-20 border-t border-gray-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8 text-sm text-gray-500">
          <p>
            © 2026 Cartify. All rights reserved.
          </p>

          <Link
            to="/"
            className="transition hover:text-black"
          >
            Continue Shopping
          </Link>
        </div>
      </footer>

      {/* =====================================================
          IMAGE ZOOM MODAL
          ===================================================== */}

      {zoomOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-5"
          onClick={() =>
            setZoomOpen(false)
          }
        >
          <button
            type="button"
            onClick={() =>
              setZoomOpen(false)
            }
            className="absolute right-5 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-bold text-black transition hover:bg-gray-200"
          >
            ×
          </button>

          <img
            src={
              selectedImage ||
              FALLBACK_IMAGE
            }
            alt={
              product.name ||
              "Product"
            }
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
            onClick={(event) =>
              event.stopPropagation()
            }
            onError={(event) => {
              event.currentTarget.src =
                FALLBACK_IMAGE;
            }}
          />
        </div>
      )}
    </div>
  );
}