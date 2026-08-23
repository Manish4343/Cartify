import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import API from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const email =
      form.email.trim().toLowerCase();

    const password = form.password;

    if (!email || !password) {
      setError(
        "Email and password are required."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await API.post(
        "/auth/login",
        {
          email,
          password,
        }
      );

      const user = response?.data;

      if (!user?.token) {
        throw new Error(
          "Login token was not returned by server."
        );
      }

      /*
       * Keep both values because other existing
       * Cartify pages may read either one.
       */

      localStorage.setItem(
        "userInfo",
        JSON.stringify(user)
      );

      localStorage.setItem(
        "token",
        user.token
      );

      /*
       * Remove any stale checkout/order state.
       */

      sessionStorage.removeItem(
        "checkoutInProgress"
      );

      /*
       * Admin goes to dashboard.
       */

      if (user.isAdmin === true) {
        navigate("/admin", {
          replace: true,
        });

        return;
      }

      /*
       * If user was redirected to login from a
       * protected page, return there.
       */

      const from =
        location.state?.from;

      const redirectPath =
        typeof from === "string"
          ? from
          : from?.pathname || "/";

      navigate(redirectPath, {
        replace: true,
      });
    } catch (error) {
      console.error(
        "LOGIN ERROR =>",
        error?.response?.data || error
      );

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-5 py-10">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-gray-200 bg-white p-7 shadow-xl sm:p-9"
        >
          {/* BRAND */}

          <Link
            to="/"
            className="block text-center text-2xl font-black tracking-tight text-gray-900"
          >
            Cartify
          </Link>

          {/* HEADING */}

          <h1 className="mt-7 text-center text-3xl font-bold text-gray-900">
            Welcome Back
          </h1>

          <p className="mt-2 text-center text-sm text-gray-500">
            Login to continue shopping.
          </p>

          {/* ERROR */}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {/* EMAIL */}

          <div className="mt-7">
            <label
              htmlFor="login-email"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Email
            </label>

            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-100"
              required
            />
          </div>

          {/* PASSWORD */}

          <div className="mt-5">
            <label
              htmlFor="login-password"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Password
            </label>

            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-100"
              required
            />
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full rounded-xl bg-black py-3.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

          {/* SIGNUP */}

          <p className="mt-6 text-center text-sm text-gray-500">
            New to Cartify?{" "}
            <Link
              to="/signup"
              className="font-bold text-gray-900 hover:underline"
            >
              Create account
            </Link>
          </p>

          {/* HOME */}

          <Link
            to="/"
            className="mt-4 block text-center text-sm font-medium text-gray-400 transition hover:text-gray-900"
          >
            ← Back to store
          </Link>
        </form>
      </div>
    </div>
  );
}