import React from 'react';
import { Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { MenuBrowse } from '../MenuBrowse';
import { DishRow } from '../DiscoveryUI';
import { BottomSheet } from '../../ui/BottomSheet';
import { Chip, Button, SearchBar } from '../../ui';
import { MenuItem } from '../../../types';
import { lightTheme as mockTheme } from '../../../styles/theme';
const mockRefetch = jest.fn();
let mockStoreId = 'Berlin';
let mockOffline = false;
const items = [
  { id: 'one', name: 'Paneer Pizza', category: 'PIZZA', cuisine: 'ITALIAN', dietaryInfo: ['VEGETARIAN'], isAvailable: true, basePrice: 1200 },
  { id: 'two', name: 'Chicken Pizza', category: 'PIZZA', cuisine: 'ITALIAN', dietaryInfo: ['NON_VEGETARIAN'], isAvailable: true, basePrice: 1300 },
  { id: 'three', name: 'Paneer Pasta', category: 'PASTA', cuisine: 'ITALIAN', dietaryInfo: ['VEGETARIAN'], isAvailable: true, basePrice: 1000 },
] as MenuItem[];
jest.mock('../../../hooks/useMenuQueries', () => ({ useMenuItems: () => ({ data: items, refetch: mockRefetch, dataUpdatedAt: 1000 }) }));
jest.mock('../../../hooks/useSelectedStore', () => ({ useSelectedStore: () => ({ selectedStoreId: mockStoreId, selectedStore: { currency: 'EUR', locale: 'de-DE' } }) }));
jest.mock('../../../hooks/useTheme', () => ({ useTheme: () => ({ theme: mockTheme }) }));
jest.mock('../../../hooks/useNetworkStatus', () => ({ useNetworkStatus: () => ({ isOffline: mockOffline }) }));
jest.mock('../../../contexts/CartContext', () => ({ useCart: () => ({ itemCount: 0 }) }));
jest.mock('../../StoreSelector', () => ({ StoreSelector: () => null }));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));
let tree: ReturnType<typeof renderer.create>;
beforeEach(async () => { mockStoreId = 'Berlin'; mockOffline = false; jest.clearAllMocks(); await act(async () => { tree = renderer.create(<MenuBrowse initialCategory="PIZZA" />); }); });
afterEach(async () => { await act(async () => tree.unmount()); });
const names = () => tree.root.findAllByType(DishRow).map((row: { props: { item: MenuItem } }) => row.props.item.name);
it('keeps route category combined with search; clear search reveals the same category', () => {
  expect(names()).toEqual(['Paneer Pizza', 'Chicken Pizza']);
  act(() => tree.root.findByType(SearchBar).props.onChangeText('paneer'));
  expect(names()).toEqual(['Paneer Pizza']);
  act(() => tree.root.findByType(SearchBar).props.onChangeText(''));
  expect(names()).toEqual(['Paneer Pizza', 'Chicken Pizza']);
});
it('does not apply draft filters until Apply; Clear all removes applied filters', async () => {
  const filter = tree.root.findAll((node: { props: { onPress?: unknown; accessibilityLabel?: string } }) => node.props.accessibilityLabel === 'Filter and sort menu' && typeof node.props.onPress === 'function')[0];
  await act(async () => { filter.props.onPress(); });
  const sheet = tree.root.findByType(BottomSheet);
  act(() => sheet.findAllByType(Chip).find((chip: { props: { label?: string } }) => chip.props.label === 'Vegetarian')!.props.onPress());
  expect(names()).toEqual(['Paneer Pizza', 'Chicken Pizza']);
  act(() => sheet.findAllByType(Button).find((button: { props: { title?: string } }) => button.props.title === 'Apply (1)')!.props.onPress());
  expect(names()).toEqual(['Paneer Pizza']);
  act(() => tree.root.findAllByType(Button).find((button: { props: { title?: string } }) => button.props.title === 'Clear all')!.props.onPress());
  expect(names()).toHaveLength(3);
});
it('retains cached menu offline, offers retry, and clears store-specific category after a switch', () => {
  mockOffline = true; act(() => tree.update(<MenuBrowse initialCategory="PIZZA" />));
  expect(names()).toHaveLength(2);
  expect(tree.root.findAllByType(Text).some((node: { props: { children?: unknown } }) =>
    typeof node.props.children === 'string' && node.props.children.includes('You’re offline'))).toBe(true);
  act(() => tree.root.findAllByType(Button).find((button: { props: { title?: string } }) => button.props.title === 'Retry')!.props.onPress());
  expect(mockRefetch).toHaveBeenCalledTimes(1);
  mockStoreId = 'Paris'; act(() => tree.update(<MenuBrowse initialCategory="PIZZA" />));
  expect(names()).toHaveLength(3);
});
