import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  ShoppingBag,
  Check,
  Star,
} from "lucide-react";

import { useCart } from "../context/CartContext";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop";

export default function ProductCard({
  product,
  onAdded,
}) {
  const {
    cartItems,
    addToCart,
  } = useCart();

  const [wishlist, setWishlist] =
    useState(false);

  const [added, setAdded] =
    useState(false);

  const [imageLoaded, setImageLoaded] =
    useState(false);

  useEffect(() => {
    if (!product?._id) return;

    try {
      const saved = JSON.parse(
        localStorage.getItem(
          "cartifyWishlist"
        ) || "[]"
      );

      const exists =
        Array.isArray(saved) &&
        saved.some(
          (item) =>
            item?._id === product._id ||
            item === product._id
        );

      setWishlist(Boolean(exists));
    } catch {
      setWishlist(false);
    }
  }, [product?._id]);

  const toggleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!product?._id) return;

    try {
      const saved = JSON.parse(
        localStorage.getItem(
          "cartifyWishlist"
        ) || "[]"
      );

      const list = Array.isArray(saved)
        ? saved
        : [];

      const exists = list.some(
        (item) =>
          item?._id === product._id ||
          item === product._id
      );

      let updated;

      if (exists) {
        updated = list.filter(
          (item) =>
            item?._id !== product._id &&
            item !== product._id
        );

        setWishlist(false);
      } else {
        updated = [
          ...list,
          {
            _id: product._id,
            name: product.name,
            brand: product.brand,
            price: product.price,
            image: product.image,
            category: product.category,
          },
        ];

        setWishlist(true);
      }

      localStorage.setItem(
        "cartifyWishlist",
        JSON.stringify(updated)
      );

      window.dispatchEvent(
        new Event("cartify:wishlist")
      );
    } catch (error) {
      console.error(
        "WISHLIST ERROR =>",
        error
      );
    }
  };

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const stock = Number(
      product?.stock || 0
    );

    if (stock <= 0) return;

    const existing = cartItems.find(
      (item) =>
        item._id === product._id
    );

    const currentQty = Number(
      existing?.qty ??
        existing?.quantity ??
        0
    );

    if (currentQty >= stock) {
      return;
    }

    addToCart(product);

    setAdded(true);

    if (onAdded) {
      onAdded(product.name);
    }

    window.setTimeout(() => {
      setAdded(false);
    }, 1300);
  };

  const stock = Number(
    product?.stock || 0
  );

  const outOfStock = stock <= 0;

  const rating = Number(
    product?.rating || 0
  );

  return (
    <article className="group relative overflow-hidden rounded-[26px] border border-gray-200 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-gray-300 hover:shadow-2xl">

      {/* IMAGE */}

      <Link
        to={`/product/${product?._id}`}
        className="relative block overflow-hidden bg-gray-100"
      >

        <div className="aspect-/[4/5] overflow-hidden">

          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gray-200" />
          )}

          <img
            src={
              product?.image ||
              FALLBACK_IMAGE
            }
            alt={
              product?.name ||
              "Product"
            }
            loading="lazy"
            onLoad={() =>
              setImageLoaded(true)
            }
            onError={(event) => {
              event.currentTarget.src =
                FALLBACK_IMAGE;
              setImageLoaded(true);
            }}
            className={`h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110 ${
              imageLoaded
                ? "opacity-100"
                : "opacity-0"
            }`}
          />

        </div>

        {/* IMAGE GRADIENT */}

        <div className="absolute inset-x-0 bottom-0 h-32 .bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* BADGES */}

        <div className="absolute left-4 top-4 flex flex-col gap-2">

          {product?.isFeatured && (
            <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-900 shadow-sm backdrop-blur">
              Featured
            </span>
          )}

          {outOfStock ? (
            <span className="rounded-full bg-black/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Sold Out
            </span>
          ) : stock <= 5 ? (
            <span className="rounded-full bg-orange-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              Only {stock} left
            </span>
          ) : null}

        </div>

        {/* WISHLIST */}

        <button
          type="button"
          onClick={toggleWishlist}
          className={`absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-all duration-300 ${
            wishlist
              ? "scale-110 border-red-200 bg-red-50 text-red-500"
              : "border-white/70 bg-white/90 text-gray-600 hover:scale-110 hover:border-red-200 hover:text-red-500"
          }`}
          aria-label={
            wishlist
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
        >
          <Heart
            size={19}
            fill={
              wishlist
                ? "currentColor"
                : "none"
            }
            className={`transition-transform duration-300 ${
              wishlist
                ? "animate-[pulse_0.35s_ease-out]"
                : ""
            }`}
          />
        </button>

      </Link>

      {/* CONTENT */}

      <div className="p-5">

        <div className="flex items-start justify-between gap-3">

          <div className="min-w-0 flex-1">

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
              {product?.brand ||
                "Cartify"}
            </p>

            <Link
              to={`/product/${product?._id}`}
              className="mt-1 block"
            >
              <h3 className="line-clamp-1 text-lg font-bold text-gray-900 transition hover:text-gray-600">
                {product?.name ||
                  "Unnamed Product"}
              </h3>
            </Link>

          </div>

          {rating > 0 && (
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1">
              <Star
                size={12}
                fill="currentColor"
                className="text-yellow-500"
              />

              <span className="text-[11px] font-bold text-gray-700">
                {rating.toFixed(1)}
              </span>
            </div>
          )}

        </div>

        <p className="mt-1 text-sm capitalize text-gray-500">
          {product?.category ||
            "Fashion"}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">

          <div>
            <p className="text-xl font-black text-gray-950">
              ₹
              {Number(
                product?.price || 0
              ).toLocaleString(
                "en-IN"
              )}
            </p>
          </div>

          <button
            type="button"
            disabled={outOfStock}
            onClick={handleAddToCart}
            className={`relative flex h-11 min-w-11 items-center justify-center gap-2 overflow-hidden rounded-full px-4 text-sm font-bold transition-all duration-300 ${
              outOfStock
                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                : added
                ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                : "bg-gray-950 text-white hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-lg"
            }`}
          >

            {added ? (
              <>
                <Check
                  size={16}
                  className="animate-[bounce_0.4s_ease-out]"
                />

                <span className="hidden sm:inline">
                  Added
                </span>
              </>
            ) : (
              <>
                <ShoppingBag size={16} />

                <span className="hidden sm:inline">
                  Add
                </span>
              </>
            )}

          </button>

        </div>

      </div>

    </article>
  );
}