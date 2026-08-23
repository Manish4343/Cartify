// import { createContext, useContext, useEffect, useState } from 'react';

// const CartContext = createContext();

// export const CartProvider = ({ children }) => {
//   const [cartItems, setCartItems] = useState(() => {
//     const saved = localStorage.getItem('cartItems');
//     return saved ? JSON.parse(saved) : [];
//   });

//   useEffect(() => {
//     localStorage.setItem('cartItems', JSON.stringify(cartItems));
//   }, [cartItems]);

//   const addToCart = (product) => {
//     setCartItems((prev) => {
//       const existing = prev.find((item) => item._id === product._id);

//       if (existing) {
//         return prev.map((item) =>
//           item._id === product._id
//             ? { ...item, qty: item.qty + 1 }
//             : item
//         );
//       }

//       return [...prev, { ...product, qty: 1 }];
//     });
//   };

//   const increaseQty = (id) => {
//     setCartItems((prev) =>
//       prev.map((item) =>
//         item._id === id ? { ...item, qty: item.qty + 1 } : item
//       )
//     );
//   };

//   const decreaseQty = (id) => {
//     setCartItems((prev) =>
//       prev
//         .map((item) =>
//           item._id === id ? { ...item, qty: item.qty - 1 } : item
//         )
//         .filter((item) => item.qty > 0)
//     );
//   };

//   const removeFromCart = (id) => {
//     setCartItems((prev) => prev.filter((item) => item._id !== id));
//   };

//   const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);

//   const totalPrice = cartItems.reduce(
//     (sum, item) => sum + item.price * item.qty,
//     0
//   );

//   return (
//     <CartContext.Provider
//       value={{
//         cartItems,
//         addToCart,
//         increaseQty,
//         decreaseQty,
//         removeFromCart,
//         totalItems,
//         totalPrice,
//       }}
//     >
//       {children}
//     </CartContext.Provider>
//   );
// };

// export const useCart = () => useContext(CartContext);


import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

const CART_STORAGE_KEY = "cartItems";

const normalizeQuantity = (value) => {
  const quantity = Number(value);

  if (!Number.isFinite(quantity) || quantity < 1) {
    return 1;
  }

  return Math.floor(quantity);
};

const normalizeItem = (item) => {
  if (!item || !item._id) {
    return null;
  }

  return {
    ...item,
    qty: normalizeQuantity(
      item.qty ?? item.quantity ?? 1
    ),
    selectedSize: item.selectedSize || "",
    selectedColor: item.selectedColor || "",
  };
};

const getVariantKey = (item) => {
  if (!item?._id) {
    return "";
  }

  return [
    String(item._id),
    item.selectedSize || "",
    item.selectedColor || "",
  ].join("__");
};

const getStock = (item) => {
  const stock = Number(item?.stock);

  if (!Number.isFinite(stock)) {
    return 0;
  }

  return Math.max(0, Math.floor(stock));
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem(
        CART_STORAGE_KEY
      );

      if (!savedCart) {
        return [];
      }

      const parsedCart = JSON.parse(savedCart);

      if (!Array.isArray(parsedCart)) {
        localStorage.removeItem(
          CART_STORAGE_KEY
        );

        return [];
      }

      return parsedCart
        .map(normalizeItem)
        .filter(Boolean);
    } catch (error) {
      console.error(
        "CART LOAD ERROR:",
        error
      );

      localStorage.removeItem(
        CART_STORAGE_KEY
      );

      return [];
    }
  });

  // =====================================================
  // SAVE CART
  // =====================================================

  useEffect(() => {
    try {
      if (!cartItems.length) {
        localStorage.removeItem(
          CART_STORAGE_KEY
        );

        return;
      }

      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cartItems)
      );
    } catch (error) {
      console.error(
        "CART SAVE ERROR:",
        error
      );
    }
  }, [cartItems]);

  // =====================================================
  // ADD TO CART
  // =====================================================

  const addToCart = (product) => {
    if (!product?._id) {
      console.error(
        "INVALID PRODUCT:",
        product
      );

      return false;
    }

    const stock = getStock(product);

    if (stock <= 0) {
      return false;
    }

    const normalizedProduct =
      normalizeItem(product);

    if (!normalizedProduct) {
      return false;
    }

    const variantKey =
      getVariantKey(normalizedProduct);

    let wasAdded = false;

    setCartItems((previousItems) => {
      const existingIndex =
        previousItems.findIndex(
          (item) =>
            getVariantKey(item) ===
            variantKey
        );

      // Existing product + same variant
      if (existingIndex !== -1) {
        const existingItem =
          previousItems[existingIndex];

        const currentQuantity =
          normalizeQuantity(
            existingItem.qty
          );

        const availableStock =
          getStock(existingItem);

        if (
          availableStock > 0 &&
          currentQuantity >=
            availableStock
        ) {
          return previousItems;
        }

        wasAdded = true;

        return previousItems.map(
          (item, index) =>
            index === existingIndex
              ? {
                  ...item,
                  qty:
                    currentQuantity + 1,
                }
              : item
        );
      }

      // New product
      wasAdded = true;

      return [
        ...previousItems,
        {
          ...normalizedProduct,
          qty: 1,
        },
      ];
    });

    return wasAdded;
  };

  // =====================================================
  // INCREASE QUANTITY
  // =====================================================

  const increaseQty = (
    id,
    selectedSize = "",
    selectedColor = ""
  ) => {
    if (!id) {
      return false;
    }

    let increased = false;

    setCartItems((previousItems) =>
      previousItems.map((item) => {
        const sameVariant =
          String(item._id) === String(id) &&
          (item.selectedSize || "") ===
            selectedSize &&
          (item.selectedColor || "") ===
            selectedColor;

        if (!sameVariant) {
          return item;
        }

        const currentQuantity =
          normalizeQuantity(item.qty);

        const stock = getStock(item);

        if (
          stock > 0 &&
          currentQuantity >= stock
        ) {
          return item;
        }

        increased = true;

        return {
          ...item,
          qty: currentQuantity + 1,
        };
      })
    );

    return increased;
  };

  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  const decreaseQty = (
    id,
    selectedSize = "",
    selectedColor = ""
  ) => {
    if (!id) {
      return false;
    }

    let decreased = false;

    setCartItems((previousItems) =>
      previousItems
        .map((item) => {
          const sameVariant =
            String(item._id) === String(id) &&
            (item.selectedSize || "") ===
              selectedSize &&
            (item.selectedColor || "") ===
              selectedColor;

          if (!sameVariant) {
            return item;
          }

          const currentQuantity =
            normalizeQuantity(item.qty);

          const nextQuantity =
            currentQuantity - 1;

          decreased = true;

          return {
            ...item,
            qty: nextQuantity,
          };
        })
        .filter(
          (item) =>
            Number(item.qty) > 0
        )
    );

    return decreased;
  };

  // =====================================================
  // REMOVE FROM CART
  // =====================================================

  const removeFromCart = (
    id,
    selectedSize = "",
    selectedColor = ""
  ) => {
    if (!id) {
      return false;
    }

    let removed = false;

    setCartItems((previousItems) =>
      previousItems.filter((item) => {
        const sameVariant =
          String(item._id) === String(id) &&
          (item.selectedSize || "") ===
            selectedSize &&
          (item.selectedColor || "") ===
            selectedColor;

        if (sameVariant) {
          removed = true;
          return false;
        }

        return true;
      })
    );

    return removed;
  };

  // =====================================================
  // CLEAR CART
  // =====================================================

  const clearCart = () => {
    setCartItems([]);

    try {
      localStorage.removeItem(
        CART_STORAGE_KEY
      );
    } catch (error) {
      console.error(
        "CLEAR CART ERROR:",
        error
      );
    }
  };

  // =====================================================
  // TOTAL ITEMS
  // =====================================================

  const totalItems = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total +
        normalizeQuantity(item.qty),
      0
    );
  }, [cartItems]);

  // =====================================================
  // TOTAL PRICE
  // =====================================================

  const totalPrice = useMemo(() => {
    return cartItems.reduce(
      (total, item) => {
        const price =
          Number(item.price) || 0;

        const quantity =
          normalizeQuantity(item.qty);

        return (
          total +
          price * quantity
        );
      },
      0
    );
  }, [cartItems]);

  // =====================================================
  // PROVIDER
  // =====================================================

  const value = useMemo(
    () => ({
      cartItems,
      addToCart,
      increaseQty,
      decreaseQty,
      removeFromCart,
      clearCart,
      totalItems,
      totalPrice,
    }),
    [
      cartItems,
      totalItems,
      totalPrice,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// =====================================================
// HOOK
// =====================================================

export const useCart = () => {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider."
    );
  }

  return context;
};