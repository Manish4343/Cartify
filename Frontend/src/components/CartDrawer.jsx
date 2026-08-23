import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  ArrowRight,
} from "lucide-react";

import { useCart } from "../context/CartContext";

export default function CartDrawer({
  open,
  onClose,
}) {
  const {
    cartItems,
    increaseQty,
    decreaseQty,
    removeFromCart,
    totalItems,
    totalPrice,
  } = useCart();

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-\[100]">
      {/* BACKDROP */}

      <button
        type="button"
        aria-label="Close cart"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-[2px]"
      />

      {/* DRAWER */}

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-5">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Cartify
            </p>

            <h2 className="mt-1 text-xl font-black text-gray-900">
              Your Cart
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-black hover:text-black"
            aria-label="Close cart"
          >
            <X size={19} />
          </button>

        </div>

        {/* CONTENT */}

        <div className="flex-1 overflow-y-auto px-5 py-5">

          {cartItems.length === 0 ? (
            <div className="flex min-h-\[420px] flex-col items-center justify-center text-center">

              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                <ShoppingBag
                  size={30}
                  className="text-gray-500"
                />
              </div>

              <h3 className="mt-5 text-xl font-bold text-gray-900">
                Your cart is empty
              </h3>

              <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                Looks like you haven't added
                anything yet. Let's find something
                you love.
              </p>

              <Link
                to="/"
                onClick={onClose}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Start Shopping
                <ArrowRight size={16} />
              </Link>

            </div>
          ) : (
            <div className="space-y-4">

              {cartItems.map((item) => {

                const quantity = Number(
                  item.qty ||
                    item.quantity ||
                    1
                );

                const stock = Number(
                  item.stock || 0
                );

                return (
                  <div
                    key={`${item._id}-${item.selectedSize || ""}-${item.selectedColor || ""}`}
                    className="rounded-2xl border border-gray-200 bg-white p-3"
                  >

                    <div className="flex gap-3">

                      {/* IMAGE */}

                      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">

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
                            No image
                          </div>
                        )}

                      </div>

                      {/* INFO */}

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-2">

                          <div className="min-w-0">

                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              {item.brand ||
                                "Cartify"}
                            </p>

                            <Link
                              to={`/product/${item._id}`}
                              onClick={onClose}
                              className="mt-1 block truncate text-sm font-bold text-gray-900 hover:underline"
                            >
                              {item.name ||
                                "Product"}
                            </Link>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(
                                item._id
                              )
                            }
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                            aria-label={`Remove ${item.name || "product"}`}
                          >
                            <Trash2 size={15} />
                          </button>

                        </div>

                        {/* VARIANTS */}

                        {(item.selectedSize ||
                          item.selectedColor) && (
                          <div className="mt-2 flex flex-wrap gap-2">

                            {item.selectedSize && (
                              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                                Size:{" "}
                                {
                                  item.selectedSize
                                }
                              </span>
                            )}

                            {item.selectedColor && (
                              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                                Color:{" "}
                                {
                                  item.selectedColor
                                }
                              </span>
                            )}

                          </div>
                        )}

                        {/* PRICE / QUANTITY */}

                        <div className="mt-3 flex items-center justify-between">

                          <p className="text-sm font-black text-gray-900">
                            ₹
                            {Number(
                              item.price || 0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </p>

                          <div className="flex items-center overflow-hidden rounded-full border border-gray-200">

                            <button
                              type="button"
                              onClick={() =>
                                decreaseQty(
                                  item._id
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center text-gray-600 transition hover:bg-gray-100 hover:text-black"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={13} />
                            </button>

                            <span className="flex h-8 min-w-8 items-center justify-center border-x border-gray-200 px-2 text-xs font-bold text-gray-900">
                              {quantity}
                            </span>

                            <button
                              type="button"
                              disabled={
                                stock > 0 &&
                                quantity >= stock
                              }
                              onClick={() =>
                                increaseQty(
                                  item._id
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center text-gray-600 transition hover:bg-gray-100 hover:text-black disabled:cursor-not-allowed disabled:text-gray-300"
                              aria-label="Increase quantity"
                            >
                              <Plus size={13} />
                            </button>

                          </div>

                        </div>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>

        {/* FOOTER */}

        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 bg-white px-5 py-5">

            <div className="flex items-center justify-between text-sm">

              <span className="text-gray-500">
                {totalItems}{" "}
                {totalItems === 1
                  ? "item"
                  : "items"}
              </span>

              <span className="text-xl font-black text-gray-900">
                ₹
                {Number(
                  totalPrice || 0
                ).toLocaleString(
                  "en-IN"
                )}
              </span>

            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">

              <Link
                to="/cart"
                onClick={onClose}
                className="flex items-center justify-center rounded-full border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-800 transition hover:border-black hover:text-black"
              >
                View Cart
              </Link>

              <Link
                to="/checkout"
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Checkout
                <ArrowRight size={15} />
              </Link>

            </div>

          </div>
        )}

      </aside>
    </div>
  );
}