import React from 'react';
import renderer, { act } from 'react-test-renderer';

import ItemDetailScreen from '../ItemDetailScreen';
import Button from '../../../components/ui/Button';
import { MenuItem, Store } from '../../../types';
import { lightTheme as mockLightTheme } from '../../../styles/theme';

const mockNavigate = jest.fn();
const mockAddItem = jest.fn();
const mockRefetch = jest.fn();
let mockOffline = false;
let mockCurrentStore = {
  id: 'store',
  storeCode: 'store',
  name: 'Berlin',
  isOpen: true,
  currency: 'EUR',
  locale: 'de-DE',
} as Store;
let mockCurrentItem: MenuItem;
const baseItem: MenuItem = {
  id: 'dish',
  name: 'Pizza',
  description: '',
  cuisine: 'ITALIAN',
  category: 'PIZZA',
  basePrice: 1200,
  variants: [{ id: 'small', name: 'Small', priceModifier: 0 }],
  customizations: [
    {
      id: 'crust',
      name: 'Crust',
      required: true,
      maxSelections: 1,
      options: [{ id: 'thin', name: 'Thin', priceModifier: 100 }],
    },
  ],
  dietaryInfo: [],
  imageUrl: '',
  isAvailable: true,
  preparationTime: 10,
  isRecommended: false,
};
jest.mock('../../../hooks/useTheme', () => ({ useTheme: () => ({ theme: mockLightTheme }) }));
jest.mock('../../../hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isOffline: mockOffline }),
}));
jest.mock('../../../hooks/useSelectedStore', () => ({
  useSelectedStore: () => ({
    selectedStore: mockCurrentStore,
    selectedStoreId: mockCurrentStore.id,
  }),
}));
jest.mock('../../../hooks/useMenuQueries', () => ({
  useMenuItem: () => ({ data: mockCurrentItem, refetch: jest.fn() }),
  useMenuItems: () => ({ data: [mockCurrentItem], refetch: mockRefetch }),
}));
jest.mock('../../../contexts/CartContext', () => ({ useCart: () => ({ addItem: mockAddItem }) }));
jest.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
jest.mock('../../../services/favoritesService', () => ({
  favoritesService: { isFavorite: jest.fn().mockResolvedValue(false) },
}));
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { itemId: 'dish' } }),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));
let tree: ReturnType<typeof renderer.create>;
beforeEach(async () => {
  jest.clearAllMocks();
  mockOffline = false;
  mockCurrentItem = { ...baseItem };
  mockCurrentStore = { ...mockCurrentStore, id: 'store', isOpen: true };
  await act(async () => {
    tree = renderer.create(<ItemDetailScreen />);
  });
});
afterEach(() => act(() => tree.unmount()));
const button = () =>
  tree.root.findAllByType(Button).find((value: { props: { title?: string } }) => value.props.title === 'Add to cart')!;
const select = () => {
  act(() =>
    tree.root
      .findAll((node: { props: { onPress?: unknown } }) => typeof node.props.onPress === "function")
      .find((value: { props: { accessibilityLabel?: string } }) => value.props.accessibilityLabel?.startsWith('Small,'))!
      .props.onPress(),
  );
  act(() =>
    tree.root
      .findAll((node: { props: { onPress?: unknown } }) => typeof node.props.onPress === "function")
      .find((value: { props: { accessibilityLabel?: string } }) => value.props.accessibilityLabel?.startsWith('Thin,'))!
      .props.onPress(),
  );
};
it('blocks add until size and required modifier are chosen; rebinds prices to refreshed menu', async () => {
  expect(button().props.disabled).toBe(true);
  select();
  expect(button().props.disabled).toBe(false);
  mockRefetch.mockResolvedValue({
    data: [
      {
        ...baseItem,
        basePrice: 1400,
        customizations: [
          {
            ...baseItem.customizations[0],
            options: [{ ...baseItem.customizations[0].options[0], priceModifier: 200 }],
          },
        ],
      },
    ],
  });
  await act(async () => {
    button().props.onPress();
  });
  expect(mockAddItem).toHaveBeenCalledTimes(1);
  expect(mockAddItem.mock.calls[0][0].basePrice).toBe(1400);
  expect(mockAddItem.mock.calls[0][3].get('crust')[0].priceModifier).toBe(200);
  expect(mockNavigate).toHaveBeenCalledWith('Cart');
});
it('keeps unavailable refreshed dish out of cart and shows recovery error', async () => {
  select();
  mockRefetch.mockResolvedValue({ data: [{ ...baseItem, isAvailable: false }] });
  await act(async () => {
    button().props.onPress();
  });
  expect(mockAddItem).not.toHaveBeenCalled();
  expect(JSON.stringify(tree.toJSON())).toContain('This dish is currently unavailable.');
});
it('disables add offline and for a closed selected store', () => {
  select();
  mockOffline = true;
  act(() => tree.update(<ItemDetailScreen />));
  expect(button().props.disabled).toBe(true);
  mockOffline = false;
  mockCurrentStore = { ...mockCurrentStore, isOpen: false };
  act(() => tree.update(<ItemDetailScreen />));
  expect(button().props.disabled).toBe(true);
});
it('allows local cart selection when the active store API omits an opening status', () => {
  mockCurrentStore = { ...mockCurrentStore, status: 'ACTIVE' };
  delete (mockCurrentStore as Partial<Store>).isOpen;
  act(() => tree.update(<ItemDetailScreen />));
  select();
  expect(button().props.disabled).toBe(false);
});
it('ignores store switch during availability request and prevents duplicate insertion', async () => {
  select();
  let resolve: (value: unknown) => void = () => {};
  mockRefetch.mockReturnValue(
    new Promise((value) => {
      resolve = value;
    }),
  );
  act(() => {
    button().props.onPress();
    button().props.onPress();
  });
  expect(mockRefetch).toHaveBeenCalledTimes(1);
  mockCurrentStore = { ...mockCurrentStore, id: 'other' };
  act(() => tree.update(<ItemDetailScreen />));
  await act(async () => {
    resolve({ data: [baseItem] });
  });
  expect(mockAddItem).not.toHaveBeenCalled();
});
