import { Navigate, Outlet, useLocation } from "react-router-dom";

const getUserInfo = () => {
  try {
    const rawUser = localStorage.getItem("userInfo");

    if (!rawUser) {
      return null;
    }

    const user = JSON.parse(rawUser);

    if (!user || typeof user !== "object") {
      return null;
    }

    return user;
  } catch (error) {
    console.error("AUTH USER PARSE ERROR =>", error);

    localStorage.removeItem("userInfo");
    localStorage.removeItem("token");

    return null;
  }
};

const isLoggedIn = (user) => {
  return Boolean(user?.token && user?._id);
};

// =====================================================
// USER PROTECTED ROUTE
// =====================================================

export function ProtectedRoute() {
  const location = useLocation();
  const userInfo = getUserInfo();

  if (!isLoggedIn(userInfo)) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
}

// =====================================================
// ADMIN PROTECTED ROUTE
// =====================================================

export function AdminRoute() {
  const location = useLocation();
  const userInfo = getUserInfo();

  if (!isLoggedIn(userInfo)) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  if (userInfo.isAdmin !== true) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          from: location.pathname,
          forbidden: true,
        }}
      />
    );
  }

  return <Outlet />;
}

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default ProtectedRoute;