// import axios from "axios";

// const API_BASE_URL =
//   import.meta.env.VITE_API_URL ||
//   "http://localhost:5000/api";

// const API = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 15000,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // =====================================================
// // REQUEST INTERCEPTOR
// // =====================================================

// API.interceptors.request.use(
//   (config) => {
//     try {
//       const storedUser =
//         localStorage.getItem(
//           "userInfo"
//         );

//       let userInfo = null;

//       if (storedUser) {
//         try {
//           userInfo =
//             JSON.parse(storedUser);
//         } catch {
//           localStorage.removeItem(
//             "userInfo"
//           );
//         }
//       }

//       const token =
//         userInfo?.token ||
//         localStorage.getItem(
//           "token"
//         );

//       if (token) {
//         config.headers =
//           config.headers || {};

//         config.headers.Authorization =
//           `Bearer ${token}`;
//       }

//       // -------------------------------------------------
//       // Don't force JSON content type for FormData
//       // -------------------------------------------------

//       if (
//         typeof FormData !==
//           "undefined" &&
//         config.data instanceof
//           FormData
//       ) {
//         delete config.headers[
//           "Content-Type"
//         ];
//       }
//     } catch (error) {
//       console.error(
//         "API REQUEST AUTH ERROR =>",
//         error
//       );
//     }

//     return config;
//   },
//   (error) => {
//     return Promise.reject(
//       error
//     );
//   }
// );

// // =====================================================
// // RESPONSE INTERCEPTOR
// // =====================================================

// API.interceptors.response.use(
//   (response) => {
//     return response;
//   },

//   (error) => {
//     const status =
//       error?.response?.status;

//     // -------------------------------------------------
//     // INVALID / EXPIRED TOKEN
//     // -------------------------------------------------

//     if (status === 401) {
//       localStorage.removeItem(
//         "userInfo"
//       );

//       localStorage.removeItem(
//         "token"
//       );

//       // Notify AuthContext
//       window.dispatchEvent(
//         new Event(
//           "cartify:force-logout"
//         )
//       );

//       // Don't redirect if already on auth pages
//       const currentPath =
//         window.location.pathname;

//       const isAuthPage =
//         currentPath === "/login" ||
//         currentPath === "/signup";

//       if (!isAuthPage) {
//         window.location.href =
//           `/login?expired=true`;
//       }
//     }

//     return Promise.reject(
//       error
//     );
//   }
// );

// export default API;


import axios from "axios";

// =====================================================
// API BASE URL
// =====================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

// =====================================================
// AXIOS INSTANCE
// =====================================================

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type":
      "application/json",
  },
  timeout: 15000,
});

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

API.interceptors.request.use(
  (config) => {
    try {
      const userInfo =
        JSON.parse(
          localStorage.getItem(
            "userInfo"
          ) || "null"
        );

      const token =
        userInfo?.token ||
        localStorage.getItem(
          "token"
        );

      if (token) {
        config.headers =
          config.headers || {};

        config.headers.Authorization =
          `Bearer ${token}`;
      }
    } catch (error) {
      console.error(
        "API AUTH ERROR =>",
        error
      );
    }

    return config;
  },
  (error) => {
    return Promise.reject(
      error
    );
  }
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (
      error?.response?.status ===
      401
    ) {
      const currentUser =
        localStorage.getItem(
          "userInfo"
        );

      if (currentUser) {
        try {
          const user =
            JSON.parse(
              currentUser
            );

          // Only clear invalid/expired auth.
          if (user?.token) {
            localStorage.removeItem(
              "userInfo"
            );

            localStorage.removeItem(
              "token"
            );
          }
        } catch {
          localStorage.removeItem(
            "userInfo"
          );

          localStorage.removeItem(
            "token"
          );
        }
      }
    }

    return Promise.reject(
      error
    );
  }
);

export default API;