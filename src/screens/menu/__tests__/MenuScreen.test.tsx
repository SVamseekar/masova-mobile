import React from 'react';
import renderer, { act } from 'react-test-renderer';
import MenuScreen from '../MenuScreen';
import * as menuQueries from '../../../hooks/useMenuQueries';
import * as themeHook from '../../../hooks/useTheme';
import { lightTheme } from '../../../styles/theme';

jest.mock('../../../hooks/useMenuQueries');
jest.mock('../../../hooks/useTheme');
jest.mock('../../../hooks/useSelectedStore', () => ({
  useSelectedStore: () => ({
    selectedStore: {
      id: 'DOM001',
      storeCode: 'DOM001',
      name: 'Berlin Mitte',
      currency: 'EUR',
      locale: 'de-DE',
      countryCode: 'DE',
    },
    selectedStoreId: 'DOM001',
    setSelectedStore: jest.fn(),
    isLoading: false,
  }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('../../../components/StoreSelector', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    StoreSelector: () => React.createElement(View, { testID: 'StoreSelector' }),
  };
});

describe('MenuScreen Component', () => {
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (themeHook.useTheme as jest.Mock).mockReturnValue({
      theme: lightTheme,
      isDark: false,
    });
  });

  it('renders menu error state with retry button when query fails', () => {
    (menuQueries.useMenuItems as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: { message: 'Network connection timeout' },
      refetch: mockRefetch,
    });

    let component: any;
    act(() => {
      component = renderer.create(<MenuScreen />);
    });

    const errorTitle = component.root.findByProps({ children: 'Failed to load menu' });
    expect(errorTitle).toBeTruthy();

    const errorMessage = component.root.findByProps({ children: 'Network connection timeout' });
    expect(errorMessage).toBeTruthy();

    const retryText = component.root.findByProps({ children: 'Retry' });
    expect(retryText).toBeTruthy();
  });

  it('renders empty menu state when no items match filters', () => {
    (menuQueries.useMenuItems as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    });

    let component: any;
    act(() => {
      component = renderer.create(<MenuScreen />);
    });

    const emptyTitle = component.root.findByProps({ children: 'No items found' });
    expect(emptyTitle).toBeTruthy();

    const emptySub = component.root.findByProps({ children: 'Try adjusting your filters or search query' });
    expect(emptySub).toBeTruthy();
  });
});
