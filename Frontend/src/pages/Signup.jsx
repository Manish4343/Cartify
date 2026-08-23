import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import API from "../services/api";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    const name =
      form.name.trim();

    const email =
      form.email.trim().toLowerCase();

    const password =
      form.password;

    const confirmPassword =
      form.confirmPassword;

    if (!name) {
      setError(
        "Please enter your full name."
      );

      return;
    }

    if (!email) {
      setError(
        "Please enter your email."
      );

      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await API.post(
        "/auth/signup",
        {
          name,
          email,
          password,
        }
      );

      const user = response?.data;

      if (!user?.token) {
        throw new Error(
          "Signup token was not returned by server."
        );
      }

      /*
       * Automatically login the newly-created user.
       */

      localStorage.setItem(
        "userInfo",
        JSON.stringify(user)
      );

      localStorage.setItem(
        "token",
        user.token
      );

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "SIGNUP ERROR =>",
        error?.response?.data || error
      );

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create account."
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
            Create Account
          </h1>

          <p className="mt-2 text-center text-sm text-gray-500">
            Join Cartify and start shopping.
          </p>

          {/* ERROR */}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {/* NAME */}

          <div className="mt-7">
            <label
              htmlFor="signup-name"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Full Name
            </label>

            <input
              id="signup-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-100"
              required
            />
          </div>

          {/* EMAIL */}

          <div className="mt-5">
            <label
              htmlFor="signup-email"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Email
            </label>

            <input
              id="signup-email"
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
              htmlFor="signup-password"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Password
            </label>

            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-100"
              required
            />
          </div>

          {/* CONFIRM PASSWORD */}

          <div className="mt-5">
            <label
              htmlFor="signup-confirm-password"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Confirm Password
            </label>

            <input
              id="signup-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange}
              minLength={6}
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
              ? "Creating account..."
              : "Create Account"}
          </button>

          {/* LOGIN */}

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-gray-900 hover:underline"
            >
              Login
            </Link>
          </p>

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