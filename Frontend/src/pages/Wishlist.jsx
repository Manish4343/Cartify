import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop";

export default function Wishlist() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  const loadWishlist = () => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("cartifyWishlist") || "[]"
      );
      setItems(Array.isArray(saved) ? saved : []);
    } catch (error) {
      console.error("WISHLIST LOAD ERROR =>", error);
      setItems([]);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const removeItem = (id) => {
    const updated = items.filter((item) => String(item?._id) !== String(id));
    setItems(updated);
    localStorage.setItem("cartifyWishlist", JSON.stringify(updated));
  };

  const clearWishlist = () => {
    setItems([]);
    localStorage.setItem("cartifyWishlist", "[]");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-6">
          <Link to="/" className="text-2xl font-black tracking-tight text-gray-950">
            Cartify
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
            >
              Home
            </Link>
            <Link
              to="/cart"
              className="cartify-action-secondary px-4 py-2 text-sm"
            >
              <ShoppingBag size={16} className="mr-2" />
              Cart
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 md:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
              Cartify
            </p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">My Wishlist</h1>
            <p className="mt-2 text-gray-500">
              {items.length} {items.length === 1 ? "item" : "items"} saved for later.
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearWishlist}
              className="rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Clear Wishlist
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
              <Heart size={34} fill="currentColor" />
            </div>
            <h2 className="mt-6 text-2xl font-bold">Your wishlist is empty</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
              Save products you love and they will appear here.
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="cartify-action-primary mt-7 px-7 py-3 text-sm"
            >
              Explore Products
            </button>
          </section>
        ) : (
          <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <article
                key={item._id}
                className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <Link to={`/product/${item._id}`} className="block overflow-hidden bg-gray-100">
                  <img
                    src={item.image || FALLBACK_IMAGE}
                    alt={item.name || "Product"}
                    className="aspect-/[4/5] w-full object-cover transition duration-500 group-hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                </Link>

                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {item.category || "Fashion"}
                  </p>
                  <Link to={`/product/${item._id}`}>
                    <h2 className="mt-2 truncate text-base font-bold text-gray-900 hover:text-gray-600">
                      {item.name || "Product"}
                    </h2>
                  </Link>
                  <p className="mt-2 text-lg font-black text-gray-900">
                    ₹{Number(item.price || 0).toLocaleString("en-IN")}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <Link
                      to={`/product/${item._id}`}
                      className="cartify-action-primary flex-1 px-4 py-2.5 text-sm"
                    >
                      View Product
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(item._id)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${item.name || "product"} from wishlist`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
