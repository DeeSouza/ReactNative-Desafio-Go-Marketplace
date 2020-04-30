import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsCart = await AsyncStorage.getItem('@Marketplace:cart');

      if (productsCart) setProducts(JSON.parse(productsCart));
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const hasProduct = products.find(item => item.id === product.id);
      let cartProducts = [];

      if (hasProduct) {
        cartProducts = products.map(item => {
          if (item.id === product.id) {
            return { ...item, quantity: item.quantity + 1 };
          }

          return item;
        });
      } else {
        cartProducts = [...products, { ...product, quantity: 1 }];
      }

      setProducts(cartProducts);

      AsyncStorage.setItem('@Marketplace:cart', JSON.stringify(cartProducts));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const cartProducts = products.map(item =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      );

      setProducts(cartProducts);

      await AsyncStorage.setItem(
        '@Marketplace:cart',
        JSON.stringify(cartProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(item => item.id === id);

      if (product?.quantity === 1) return;

      const cartProducts = products.map(item =>
        item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
      );

      setProducts(cartProducts);

      await AsyncStorage.setItem(
        '@Marketplace:cart',
        JSON.stringify(cartProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
