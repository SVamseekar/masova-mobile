/**
 * Cart Context
 * Manages shopping cart state and operations
 */

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MenuItem, MenuVariant, CustomizationOption } from '../types';
import { calculateDeliveryFeeMinor, calculateTaxMinor } from '../utils/pricing';

const CART_STORAGE_KEY = 'masova_cart';

interface CartItem {
  id: string; // Unique ID for this cart item (menuItem.id + variant + customizations)
  menuItem: MenuItem;
  quantity: number;
  selectedVariant?: MenuVariant;
  selectedCustomizations?: Map<string, CustomizationOption[]>;
  specialInstructions?: string;
  itemTotal: number; // Total price for this item (including quantity)
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  total: number;
  addItem: (
    menuItem: MenuItem,
    quantity: number,
    variant?: MenuVariant,
    customizations?: Map<string, CustomizationOption[]>,
    specialInstructions?: string
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemById: (cartItemId: string) => CartItem | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from storage on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    saveCart();
  }, [items]);

  const loadCart = async () => {
    try {
      const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (cartData) {
        const parsedCart = JSON.parse(cartData);
        // Convert customizations back to Map
        const cartWithMaps = parsedCart.map((item: any) => ({
          ...item,
          selectedCustomizations: item.selectedCustomizations
            ? new Map(Object.entries(item.selectedCustomizations))
            : undefined,
        }));
        setItems(cartWithMaps);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  };

  const saveCart = async () => {
    try {
      // Convert Maps to plain objects for JSON serialization
      const cartForStorage = items.map((item) => ({
        ...item,
        selectedCustomizations: item.selectedCustomizations
          ? Object.fromEntries(item.selectedCustomizations)
          : undefined,
      }));
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartForStorage));
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  };

  const calculateItemPrice = (
    menuItem: MenuItem,
    variant?: MenuVariant,
    customizations?: Map<string, CustomizationOption[]>
  ): number => {
    let price = menuItem.discountedPrice || menuItem.basePrice;

    // Add variant price
    if (variant?.priceModifier) {
      price += variant.priceModifier;
    }

    // Add customization prices
    if (customizations) {
      customizations.forEach((options) => {
        options.forEach((option) => {
          if (option.priceModifier) {
            price += option.priceModifier;
          }
        });
      });
    }

    return price;
  };

  const generateCartItemId = (
    menuItem: MenuItem,
    variant?: MenuVariant,
    customizations?: Map<string, CustomizationOption[]>
  ): string => {
    // Create unique ID based on menu item + variant + customizations
    let id = menuItem.id;

    if (variant) {
      id += `_v${variant.id}`;
    }

    if (customizations && customizations.size > 0) {
      const customizationIds: string[] = [];
      customizations.forEach((options) => {
        options.forEach((option) => {
          customizationIds.push(option.id);
        });
      });
      id += `_c${customizationIds.sort().join('_')}`;
    }

    return id;
  };

  const addItem = (
    menuItem: MenuItem,
    quantity: number,
    variant?: MenuVariant,
    customizations?: Map<string, CustomizationOption[]>,
    specialInstructions?: string
  ) => {
    const itemPrice = calculateItemPrice(menuItem, variant, customizations);
    const cartItemId = generateCartItemId(menuItem, variant, customizations);

    setItems((currentItems) => {
      // Check if item with same configuration already exists
      const existingItemIndex = currentItems.findIndex((item) => item.id === cartItemId);

      if (existingItemIndex !== -1) {
        // Update quantity of existing item
        const updatedItems = [...currentItems];
        const existingItem = updatedItems[existingItemIndex];
        existingItem.quantity += quantity;
        existingItem.itemTotal = itemPrice * existingItem.quantity;
        return updatedItems;
      } else {
        // Add new item
        const newItem: CartItem = {
          id: cartItemId,
          menuItem,
          quantity,
          selectedVariant: variant,
          selectedCustomizations: customizations,
          specialInstructions,
          itemTotal: itemPrice * quantity,
        };
        return [...currentItems, newItem];
      }
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }

    setItems((currentItems) => {
      return currentItems.map((item) => {
        if (item.id === cartItemId) {
          const itemPrice = calculateItemPrice(
            item.menuItem,
            item.selectedVariant,
            item.selectedCustomizations
          );
          return {
            ...item,
            quantity,
            itemTotal: itemPrice * quantity,
          };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemById = (cartItemId: string): CartItem | undefined => {
    return items.find((item) => item.id === cartItemId);
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Delivery fee logic (free above certain amount, otherwise fixed fee)
  // Note: Delivery fee is calculated here but NOT included in cart total
  // It's only added on checkout screen when user selects DELIVERY order type
  // Platform-aligned EUR demo: DE takeaway/delivery food VAT 7%; free delivery ≥ €25
  const deliveryFee = calculateDeliveryFeeMinor(subtotal);
  const taxes = calculateTaxMinor(subtotal, 'DE', 'DELIVERY');

  // Cart total excludes delivery fee — added at checkout based on order type
  const total = subtotal + taxes;

  const value: CartContextType = {
    items,
    itemCount,
    subtotal,
    deliveryFee,
    taxes,
    total,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemById,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
