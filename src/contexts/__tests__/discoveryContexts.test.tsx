import React from 'react';
import renderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartProvider, useCart } from '../CartContext';
import { StoreProvider, useStoreContext } from '../StoreContext';
import { MenuItem, Store } from '../../types';

jest.mock('../../services/api', () => ({ storeApi: { getAll: jest.fn().mockResolvedValue([]) } }));
jest.mock('../../services/http/client', () => ({ setClientSelectedStoreContext: jest.fn() }));
const mockInvalidate = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));

const dish: MenuItem = {
  id: 'dish',
  name: 'Dish',
  description: '',
  cuisine: 'ITALIAN',
  category: 'PIZZA',
  basePrice: 1200,
  discountedPrice: 0,
  variants: [],
  customizations: [],
  dietaryInfo: [],
  imageUrl: '',
  isAvailable: true,
  preparationTime: 10,
  isRecommended: false,
};
let cart: ReturnType<typeof useCart>;
const CartProbe = () => {
  cart = useCart();
  return null;
};
let storeContext: ReturnType<typeof useStoreContext>;
const StoreProbe = () => {
  storeContext = useStoreContext();
  return null;
};

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
});
it('keeps legitimate zero-price discounts and separates differing preparation notes', async () => {
  let tree: ReturnType<typeof renderer.create>;
  await act(async () => {
    tree = renderer.create(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    );
  });
  act(() => cart.addItem(dish, 1, undefined, undefined, 'No onions'));
  expect(cart.items[0].itemTotal).toBe(0);
  act(() => cart.addItem(dish, 2, undefined, undefined, 'Extra spicy'));
  expect(cart.items).toHaveLength(2);
  expect(cart.items.map((item) => item.specialInstructions)).toEqual(['No onions', 'Extra spicy']);
  act(() => cart.addItem(dish, 1, undefined, undefined, 'No onions'));
  expect(cart.items[0].quantity).toBe(2);
  act(() => tree!.unmount());
});
it('rejects failed store persistence without changing store, headers or query scope', async () => {
  let tree: ReturnType<typeof renderer.create>;
  await act(async () => {
    tree = renderer.create(
      <StoreProvider>
        <StoreProbe />
      </StoreProvider>,
    );
  });
  const initial = { id: 'initial', name: 'Initial' } as Store;
  await act(async () => {
    await storeContext.setSelectedStore(initial);
  });
  mockInvalidate.mockClear();
  (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage full'));
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  await act(async () => {
    await expect(storeContext.setSelectedStore({ ...initial, id: 'other' })).rejects.toThrow(
      'Storage full',
    );
  });
  expect(storeContext.selectedStore?.id).toBe('initial');
  expect(mockInvalidate).not.toHaveBeenCalled();
  spy.mockRestore();
  act(() => tree!.unmount());
});

it('keeps refreshed unit prices when merged cart quantities change later', async () => {
  let tree: ReturnType<typeof renderer.create>;
  await act(async () => { tree = renderer.create(<CartProvider><CartProbe /></CartProvider>); });
  act(() => cart.addItem({ ...dish, discountedPrice: undefined, basePrice: 1000 }, 1));
  act(() => cart.addItem({ ...dish, discountedPrice: undefined, basePrice: 1400 }, 1));
  expect(cart.items[0].itemTotal).toBe(2800);
  act(() => cart.updateQuantity(cart.items[0].id, 3));
  expect(cart.items[0].itemTotal).toBe(4200);
  act(() => tree!.unmount());
});
