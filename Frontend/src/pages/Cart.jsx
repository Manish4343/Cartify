import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const navigate = useNavigate();

  const {
    cartItems,
    increaseQty,
    decreaseQty,
    removeFromCart,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();

  // ==========================================
  // EMPTY CART
  // ==========================================

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* NAVBAR */}

        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link
              to="/"
              className="text-2xl font-bold tracking-tight text-black"
            >
              Cartify
            </Link>

            <Link
              to="/"
              className="text-sm font-medium text-gray-600 transition hover:text-black"
            >
              Continue Shopping
            </Link>
          </div>
        </header>

        {/* EMPTY STATE */}

        <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-4xl">
              🛒
            </div>

            <h1 className="mt-6 text-2xl font-bold text-gray-900">
              Your cart is empty
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Looks like you haven't added anything to your cart yet.
              Discover something you love and add it to your cart.
            </p>

            <Link
              to="/"
              className="cartify-action-primary mt-7 px-7 py-3 text-sm"
            >
              Continue Shopping
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // CHECKOUT
  // ==========================================

  const handleCheckout = () => {
    navigate("/checkout");
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ==========================================
          NAVBAR
      ========================================== */}

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight text-black"
          >
            Cartify
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="hidden text-sm font-medium text-gray-600 transition hover:text-black sm:block"
            >
              Continue Shopping
            </Link>

            <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
              Cart ({totalItems})
            </span>
          </div>
        </div>
      </header>

      {/* ==========================================
          MAIN
      ========================================== */}

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* PAGE HEADER */}

        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
            Cartify
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900 md:text-4xl">
            Shopping Cart
          </h1>

          <p className="mt-2 text-gray-500">
            {totalItems}{" "}
            {totalItems === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        {/* ==========================================
            CART LAYOUT
        ========================================== */}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ========================================
              CART ITEMS
          ======================================== */}

          <section className="space-y-5 lg:col-span-2">
            {cartItems.map((item) => {
              const quantity = Number(item.qty || 1);
              const price = Number(item.price || 0);
              const itemTotal = price * quantity;

              return (
                <div
                  key={item._id}
                  className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
                >
                  <div className="flex gap-4 sm:gap-5">
                    {/* IMAGE */}

                    <Link
                      to={`/product/${item._id}`}
                      className="shrink-0"
                    >
                      <div className="h-28 w-24 overflow-hidden rounded-2xl bg-gray-100 sm:h-36 sm:w-28">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name || "Product"}
                            className="h-full w-full object-cover transition duration-500 hover:scale-105"
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
                    </Link>

                    {/* PRODUCT INFO */}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                            {item.brand || "Cartify"}
                          </p>

                          <Link
                            to={`/product/${item._id}`}
                            className="mt-1 block"
                          >
                            <h2 className="truncate text-base font-bold text-gray-900 transition hover:text-gray-600 sm:text-lg">
                              {item.name || "Unnamed Product"}
                            </h2>
                          </Link>

                          <p className="mt-1 text-sm capitalize text-gray-500">
                            {item.category || "Fashion"}
                          </p>
                        </div>

                        {/* REMOVE */}

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(item._id)
                          }
                          className="shrink-0 text-xs font-medium text-red-500 transition hover:text-red-700 sm:text-sm"
                        >
                          Remove
                        </button>
                      </div>

                      {/* PRICE */}

                      <div className="mt-4">
                        <p className="text-base font-bold text-gray-900">
                          ₹{price.toLocaleString("en-IN")}
                        </p>
                      </div>

                      {/* QUANTITY + TOTAL */}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                        {/* QUANTITY */}

                        <div className="flex items-center rounded-full border border-gray-200 bg-gray-50">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseQty(item._id)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-medium text-gray-700 transition hover:bg-white hover:text-black"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>

                          <span className="min-w-/[32px] text-center text-sm font-semibold text-gray-900">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              increaseQty(item._id)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-medium text-gray-700 transition hover:bg-white hover:text-black"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* ITEM TOTAL */}

                        <div className="text-right">
                          <p className="text-xs text-gray-400">
                            Item Total
                          </p>

                          <p className="text-base font-bold text-gray-900">
                            ₹
                            {itemTotal.toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* CLEAR CART */}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  const confirmed = window.confirm(
                    "Are you sure you want to clear your entire cart?"
                  );

                  if (confirmed) {
                    clearCart();
                  }
                }}
                className="text-sm font-medium text-red-500 transition hover:text-red-700"
              >
                Clear Cart
              </button>
            </div>
          </section>

          {/* ========================================
              ORDER SUMMARY
          ======================================== */}

          <aside className="h-fit lg:sticky lg:top-28">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">
                Order Summary
              </h2>

              {/* SUBTOTAL */}

              <div className="mt-6 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Subtotal
                </span>

                <span className="font-semibold text-gray-900">
                  ₹
                  {Number(totalPrice).toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>

              {/* SHIPPING */}

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Shipping
                </span>

                <span className="font-semibold text-green-600">
                  Free
                </span>
              </div>

              {/* DISCOUNT */}

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Discount
                </span>

                <span className="font-semibold text-gray-900">
                  ₹0
                </span>
              </div>

              {/* DIVIDER */}

              <div className="my-6 border-t border-gray-200" />

              {/* TOTAL */}

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">
                  Total
                </span>

                <span className="text-xl font-bold text-gray-900">
                  ₹
                  {Number(totalPrice).toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>

              {/* CHECKOUT */}

              <button
                type="button"
                onClick={handleCheckout}
                className="cartify-action-primary mt-6 w-full px-6 py-3.5 text-sm"
              >
                Proceed to Checkout
              </button>

              {/* CONTINUE SHOPPING */}

              <Link
                to="/"
                className="cartify-action-secondary mt-3 w-full px-6 py-3.5 text-center text-sm"
              >
                Continue Shopping
              </Link>

              {/* TRUST INFO */}

              <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>✓</span>
                  <span>Secure checkout</span>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>✓</span>
                  <span>Free shipping</span>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>✓</span>
                  <span>Easy returns</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}