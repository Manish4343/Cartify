import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useCart } from "../context/CartContext";

export default function Checkout() {
  const navigate = useNavigate();

  const {
    cartItems,
    totalPrice,
    clearCart,
  } = useCart();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  // =====================================================
  // HANDLE INPUT
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // GET USER INFO
  // =====================================================

  const getUserInfo = () => {
    try {
      const storedUser =
        localStorage.getItem("userInfo");

      if (!storedUser) {
        return null;
      }

      const parsedUser =
        JSON.parse(storedUser);

      return parsedUser;
    } catch (error) {
      console.error(
        "USER INFO PARSE ERROR =>",
        error
      );

      return null;
    }
  };

  // =====================================================
  // GET TOKEN
  // =====================================================

  const getToken = (userInfo) => {
    return (
      userInfo?.token ||
      localStorage.getItem("token") ||
      ""
    );
  };

  // =====================================================
  // AUTH HEADER
  // =====================================================

  const getAuthConfig = (token) => {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // =====================================================
  // VALIDATE CART
  // =====================================================

  const validateCart = () => {
    if (
      !Array.isArray(cartItems) ||
      cartItems.length === 0
    ) {
      return "Your cart is empty.";
    }

    for (const item of cartItems) {
      if (!item?._id) {
        return "One of the products in your cart is invalid.";
      }

      const quantity = Number(
        item.qty ??
          item.quantity ??
          1
      );

      if (
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return `Invalid quantity for ${
          item.name || "product"
        }.`;
      }

      const price = Number(
        item.price || 0
      );

      if (price < 0) {
        return `Invalid price for ${
          item.name || "product"
        }.`;
      }
    }

    return null;
  };

  // =====================================================
  // VALIDATE ADDRESS
  // =====================================================

  const validateAddress = () => {
    if (!form.name.trim()) {
      return "Please enter your full name.";
    }

    if (!form.phone.trim()) {
      return "Please enter your phone number.";
    }

    if (!form.address.trim()) {
      return "Please enter your address.";
    }

    if (!form.city.trim()) {
      return "Please enter your city.";
    }

    if (!form.state.trim()) {
      return "Please enter your state.";
    }

    if (!form.pincode.trim()) {
      return "Please enter your pincode.";
    }

    const phone =
      form.phone.trim();

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return "Please enter a valid 10-digit phone number.";
    }

    const pincode =
      form.pincode.trim();

    if (!/^\d{6}$/.test(pincode)) {
      return "Please enter a valid 6-digit pincode.";
    }

    return null;
  };

  // =====================================================
  // LOAD RAZORPAY SDK
  // =====================================================

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const existingScript =
        document.querySelector(
          'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
        );

      if (existingScript) {
        existingScript.onload = () =>
          resolve(true);

        existingScript.onerror = () =>
          resolve(false);

        return;
      }

      const script =
        document.createElement(
          "script"
        );

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.async = true;

      script.onload = () =>
        resolve(true);

      script.onerror = () =>
        resolve(false);

      document.body.appendChild(
        script
      );
    });
  };

  // =====================================================
  // HANDLE CHECKOUT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    // ===================================================
    // USER
    // ===================================================

    const userInfo =
      getUserInfo();

    const token =
      getToken(userInfo);

    if (!userInfo || !token) {
      alert("Please login first.");
      navigate("/login");
      return;
    }

    // ===================================================
    // CART
    // ===================================================

    const cartError =
      validateCart();

    if (cartError) {
      alert(cartError);
      return;
    }

    // ===================================================
    // ADDRESS
    // ===================================================

    const addressError =
      validateAddress();

    if (addressError) {
      alert(addressError);
      return;
    }

    // ===================================================
    // RAZORPAY SDK
    // ===================================================

    const razorpayLoaded =
      await loadRazorpay();

    if (!razorpayLoaded) {
      alert(
        "Unable to load Razorpay. Please check your internet connection and try again."
      );

      return;
    }

    try {
      setLoading(true);

      // =================================================
      // 1. CREATE RAZORPAY ORDER
      // =================================================

      const { data: razorpayOrder } =
        await API.post(
          "/payment/create-order",
          {
            amount: Number(
              totalPrice
            ),
          },
          getAuthConfig(token)
        );

      console.log(
        "RAZORPAY ORDER =>",
        razorpayOrder
      );

      if (!razorpayOrder?.id) {
        throw new Error(
          "Razorpay order ID was not returned."
        );
      }

      // =================================================
      // 2. RAZORPAY KEY
      // =================================================

      const razorpayKey =
        import.meta.env
          .VITE_RAZORPAY_KEY_ID ||
        "rzp_test_TOquZMqOPRQMhl";

      if (!razorpayKey) {
        throw new Error(
          "Razorpay key is missing."
        );
      }

      // =================================================
      // 3. RAZORPAY OPTIONS
      // =================================================

      const options = {
        key: razorpayKey,

        amount:
          razorpayOrder.amount,

        currency:
          razorpayOrder.currency ||
          "INR",

        name: "Cartify",

        description:
          "Cartify Fashion Order",

        order_id:
          razorpayOrder.id,

        prefill: {
          name:
            form.name.trim(),

          email:
            userInfo.email ||
            "",

          contact:
            form.phone.trim(),
        },

        notes: {
          userId:
            String(
              userInfo._id ||
                userInfo.id ||
                ""
            ),
        },

        theme: {
          color: "#000000",
        },

        // =================================================
        // PAYMENT SUCCESS
        // =================================================

        handler: async (
          response
        ) => {
          try {
            console.log(
              "RAZORPAY RESPONSE =>",
              response
            );

            if (
              !response
                ?.razorpay_payment_id ||
              !response
                ?.razorpay_order_id ||
              !response
                ?.razorpay_signature
            ) {
              throw new Error(
                "Incomplete Razorpay payment response."
              );
            }

            // =============================================
            // 4. VERIFY PAYMENT
            // =============================================

            const {
              data: verifyData,
            } = await API.post(
              "/payment/verify-payment",
              {
                razorpay_order_id:
                  response.razorpay_order_id,

                razorpay_payment_id:
                  response.razorpay_payment_id,

                razorpay_signature:
                  response.razorpay_signature,
              },
              getAuthConfig(token)
            );

            console.log(
              "PAYMENT VERIFIED =>",
              verifyData
            );

            if (
              !verifyData?.success
            ) {
              throw new Error(
                verifyData?.message ||
                  "Payment verification failed."
              );
            }

            // =============================================
            // 5. CREATE ORDER ITEMS
            // =============================================

            const orderItems =
              cartItems.map(
                (item) => ({
                  product:
                    item._id,

                  name:
                    item.name ||
                    "Product",

                  image:
                    item.image ||
                    "",

                  price:
                    Number(
                      item.price || 0
                    ),

                  quantity:
                    Number(
                      item.qty ??
                        item.quantity ??
                        1
                    ),
                })
              );

            // =============================================
            // 6. CREATE ORDER PAYLOAD
            // =============================================

            const orderPayload = {
              items:
                orderItems,

              totalAmount:
                Number(
                  totalPrice
                ),

              paymentId:
                response.razorpay_payment_id,

              razorpayOrderId:
                response.razorpay_order_id,

              paymentSignature:
                response.razorpay_signature,

              paymentStatus:
                "Paid",

              orderStatus:
                "Processing",

              address: {
                name:
                  form.name.trim(),

                phone:
                  form.phone.trim(),

                address:
                  form.address.trim(),

                city:
                  form.city.trim(),

                state:
                  form.state.trim(),

                pincode:
                  form.pincode.trim(),
              },
            };

            console.log(
              "ORDER PAYLOAD =>",
              orderPayload
            );

            // =============================================
            // 7. SAVE ORDER
            // =============================================

            const {
              data: savedOrderResponse,
            } = await API.post(
              "/orders",
              orderPayload,
              getAuthConfig(token)
            );

            console.log(
              "SAVED ORDER RESPONSE =>",
              savedOrderResponse
            );

            if (
              !savedOrderResponse?.success
            ) {
              throw new Error(
                savedOrderResponse
                  ?.message ||
                  "Order creation failed."
              );
            }

            // =============================================
            // 8. GET ORDER
            // =============================================

            const savedOrder =
              savedOrderResponse?.order;

            const orderId =
              savedOrder?._id ||
              savedOrderResponse?._id;

            console.log(
              "FINAL ORDER =>",
              savedOrder
            );

            console.log(
              "FINAL ORDER ID =>",
              orderId
            );

            if (!orderId) {
              throw new Error(
                "Order created but order ID was not returned."
              );
            }

            // =============================================
            // 9. CLEAR CART
            // =============================================

            clearCart();

            localStorage.removeItem(
              "cartItems"
            );

            // =============================================
            // 10. STOP LOADING
            // =============================================

            setLoading(false);

            // =============================================
            // 11. GO TO ORDER DETAILS
            // =============================================

            navigate(
              `/orders/${orderId}`,
              {
                replace: true,
              }
            );
          } catch (error) {
            console.error(
              "PAYMENT / ORDER ERROR =>",
              error?.response
                ?.data ||
                error?.message ||
                error
            );

            setLoading(false);

            const message =
              error?.response
                ?.data?.message ||
              error?.message ||
              "Payment completed but order creation failed.";

            alert(message);
          }
        },

        // =================================================
        // PAYMENT MODAL CLOSED
        // =================================================

        modal: {
          ondismiss: () => {
            console.log(
              "Razorpay payment window closed."
            );

            setLoading(false);
          },
        },
      };

      // =================================================
      // 12. OPEN RAZORPAY
      // =================================================

      const razorpay =
        new window.Razorpay(
          options
        );

      // =================================================
      // 13. PAYMENT FAILED
      // =================================================

      razorpay.on(
        "payment.failed",
        (response) => {
          console.error(
            "PAYMENT FAILED =>",
            response
          );

          setLoading(false);

          alert(
            response?.error
              ?.description ||
              "Payment failed. Please try again."
          );
        }
      );

      razorpay.open();
    } catch (error) {
      console.error(
        "CHECKOUT ERROR =>",
        error?.response
          ?.data ||
          error?.message ||
          error
      );

      setLoading(false);

      alert(
        error?.response?.data
          ?.message ||
          error?.message ||
          "Unable to start payment."
      );
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}

        <div className="mb-8">

          <button
            type="button"
            onClick={() =>
              navigate("/cart")
            }
            disabled={loading}
            className="mb-5 inline-flex items-center rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Back to Cart
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            Checkout
          </h1>

          <p className="mt-2 text-gray-500">
            Enter your delivery details
            and complete your payment.
          </p>

        </div>

        {/* CHECKOUT FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
        >

          {/* NAME */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Full Name
            </label>

            <input
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              disabled={loading}
              autoComplete="name"
              className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-black disabled:bg-gray-100"
              required
            />
          </div>

          {/* PHONE */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Phone Number
            </label>

            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="Enter 10-digit phone number"
              value={form.phone}
              onChange={handleChange}
              disabled={loading}
              autoComplete="tel"
              className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-black disabled:bg-gray-100"
              required
            />
          </div>

          {/* ADDRESS */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Address
            </label>

            <textarea
              name="address"
              placeholder="House no, street, area"
              rows={3}
              value={form.address}
              onChange={handleChange}
              disabled={loading}
              autoComplete="street-address"
              className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-black disabled:bg-gray-100"
              required
            />
          </div>

          {/* CITY + STATE */}

          <div className="grid gap-4 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                City
              </label>

              <input
                name="city"
                type="text"
                placeholder="City"
                value={form.city}
                onChange={handleChange}
                disabled={loading}
                autoComplete="address-level2"
                className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-black disabled:bg-gray-100"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                State
              </label>

              <input
                name="state"
                type="text"
                placeholder="State"
                value={form.state}
                onChange={handleChange}
                disabled={loading}
                autoComplete="address-level1"
                className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-black disabled:bg-gray-100"
                required
              />
            </div>

          </div>

          {/* PINCODE */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Pincode
            </label>

            <input
              name="pincode"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit pincode"
              value={form.pincode}
              onChange={handleChange}
              disabled={loading}
              autoComplete="postal-code"
              className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-black disabled:bg-gray-100"
              required
            />
          </div>

          {/* ORDER SUMMARY */}

          <div className="rounded-2xl bg-gray-100 p-5">

            <div className="flex items-center justify-between">

              <span className="text-lg font-medium text-gray-700">
                Total
              </span>

              <span className="text-2xl font-bold text-gray-900">
                ₹
                {Number(
                  totalPrice
                ).toLocaleString(
                  "en-IN"
                )}
              </span>

            </div>

            <p className="mt-2 text-sm text-gray-500">
              {cartItems.length}{" "}
              {cartItems.length === 1
                ? "product"
                : "products"}
            </p>

          </div>

          {/* PAYMENT INFO */}

          <div className="rounded-2xl border border-gray-200 bg-white p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                ✓
              </div>

              <div>
                <p className="font-semibold text-gray-900">
                  Secure Test Payment
                </p>

                <p className="text-sm text-gray-500">
                  Razorpay test mode is enabled.
                </p>
              </div>

            </div>

          </div>

          {/* PAYMENT BUTTON */}

          <button
            type="submit"
            disabled={
              loading ||
              cartItems.length === 0
            }
            className="w-full rounded-xl bg-black py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Processing Payment..."
              : `Pay ₹${Number(
                  totalPrice
                ).toLocaleString(
                  "en-IN"
                )}`}
          </button>

        </form>
      </div>
    </div>
  );
}