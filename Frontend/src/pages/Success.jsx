import { Link } from 'react-router-dom';

export default function Success() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="rounded-full bg-green-100 p-6 text-5xl">
        ✅
      </div>

      <h1 className="mt-6 text-4xl font-bold">
        Order Placed Successfully!
      </h1>

      <p className="mt-3 text-gray-600">
        Thank you for shopping with Cartify.
      </p>

      <Link
        to="/"
        className="mt-8 rounded-full bg-black px-6 py-3 text-white"
      >
        Continue Shopping
      </Link>
    </div>
  );
}