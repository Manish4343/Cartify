import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext(null);

const USER_INFO_KEY = "userInfo";
const TOKEN_KEY = "token";

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem(USER_INFO_KEY);

    if (!storedUser) {
      return null;
    }

    const parsedUser = JSON.parse(storedUser);

    if (
      !parsedUser ||
      typeof parsedUser !== "object" ||
      !parsedUser._id ||
      !parsedUser.token
    ) {
      localStorage.removeItem(USER_INFO_KEY);
      localStorage.removeItem(TOKEN_KEY);

      return null;
    }

    return parsedUser;
  } catch (error) {
    console.error("AUTH STORAGE LOAD ERROR =>", error);

    localStorage.removeItem(USER_INFO_KEY);
    localStorage.removeItem(TOKEN_KEY);

    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);

  const login = useCallback((userData) => {
    if (!userData?.token || !userData?._id) {
      throw new Error("Invalid login response.");
    }

    const normalizedUser = {
      ...userData,
      _id: String(userData._id),
      name: String(userData.name || "").trim(),
      email: String(userData.email || "")
        .trim()
        .toLowerCase(),
      isAdmin: userData.isAdmin === true,
      token: String(userData.token),
    };

    localStorage.setItem(
      USER_INFO_KEY,
      JSON.stringify(normalizedUser)
    );

    localStorage.setItem(
      TOKEN_KEY,
      normalizedUser.token
    );

    setUser(normalizedUser);

    window.dispatchEvent(
      new Event("cartify:auth-change")
    );

    return normalizedUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_INFO_KEY);
    localStorage.removeItem(TOKEN_KEY);

    setUser(null);

    window.dispatchEvent(
      new Event("cartify:auth-change")
    );
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser((previousUser) => {
      if (!previousUser) {
        return previousUser;
      }

      const nextUser = {
        ...previousUser,
        ...updatedData,
        _id: String(
          updatedData?._id ||
            previousUser._id
        ),
        isAdmin:
          updatedData?.isAdmin === true ||
          previousUser.isAdmin === true,
      };

      localStorage.setItem(
        USER_INFO_KEY,
        JSON.stringify(nextUser)
      );

      if (nextUser.token) {
        localStorage.setItem(
          TOKEN_KEY,
          nextUser.token
        );
      }

      return nextUser;
    });

    window.dispatchEvent(
      new Event("cartify:auth-change")
    );
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(getStoredUser());
    };

    const handleStorageChange = (event) => {
      if (
        event.key === USER_INFO_KEY ||
        event.key === TOKEN_KEY
      ) {
        setUser(getStoredUser());
      }
    };

    window.addEventListener(
      "cartify:auth-change",
      handleAuthChange
    );

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "cartify:auth-change",
        handleAuthChange
      );

      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);

  useEffect(() => {
    const handleForcedLogout = () => {
      localStorage.removeItem(
        USER_INFO_KEY
      );

      localStorage.removeItem(
        TOKEN_KEY
      );

      setUser(null);
    };

    window.addEventListener(
      "cartify:force-logout",
      handleForcedLogout
    );

    return () => {
      window.removeEventListener(
        "cartify:force-logout",
        handleForcedLogout
      );
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated:
        Boolean(user?.token && user?._id),
      isAdmin:
        user?.isAdmin === true,
      login,
      logout,
      updateUser,
    }),
    [
      user,
      login,
      logout,
      updateUser,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
};

export default AuthContext;