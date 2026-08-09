import React from 'react';
import renderer, { act } from 'react-test-renderer';
import CheckoutScreen from '../CheckoutScreen';
import * as cartContext from '../../../contexts/CartContext';
import * as authContext from '../../../contexts/AuthContext';
import * as storeContext from '../../../contexts/StoreContext';
import * as networkHook from '../../../hooks/useNetworkStatus';
import * as themeHook from '../../../hooks/useTheme';
import { lightTheme } from '../../../styles/theme';

jest.mock('../../../contexts/CartContext');
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../contexts/StoreContext');
jest.mock('../../../hooks/useNetworkStatus');
jest.mock('../../../hooks/useTheme');

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: (cb: any) => {
      React.useEffect(() => {
        const cleanup = cb();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }, []);
    },
  };
});

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], isLoading: false }),
  useMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock('../../../services/api', () => ({
  deliveryApi: {
    checkDeliveryZone: jest.fn().mockResolvedValue({ inZone: true }),
  },
  customerApi: {
    getByUserId: jest.fn().mockResolvedValue({ id: 'cust_1', addresses: [] }),
    getAddresses: jest.fn().mockResolvedValue([]),
    addAddress: jest.fn(),
  },
  orderApi: {
    create: jest.fn(),
  },
}));

describe('CheckoutScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (themeHook.useTheme as jest.Mock).mockReturnValue({
      theme: lightTheme,
      isDark: false,
    });
    (authContext.useAuth as jest.Mock).mockReturnValue({
      user: { id: 'usr_1', email: 'test@example.com', name: 'Test User' },
      isAuthenticated: true,
    });
    (storeContext.useStoreContext as jest.Mock).mockReturnValue({
      selectedStore: { id: 'DOM001', name: 'Dominick Hyderabad', address: { latitude: 17.38, longitude: 78.48 } },
    });
    (cartContext.useCart as jest.Mock).mockReturnValue({
      items: [
        { menuItemId: 'item_1', name: 'Masala Dosa', price: 12900, quantity: 1 },
      ],
      itemCount: 1,
      subtotal: 12900,
      deliveryFee: 3000,
      taxes: 645,
      total: 16545,
      clearCart: jest.fn(),
    });
  });

  it('disables Place Order button and sets title to "You\'re Offline" when offline', async () => {
    (networkHook.useNetworkStatus as jest.Mock).mockReturnValue({ isOffline: true });

    let component: any;
    await act(async () => {
      component = renderer.create(<CheckoutScreen />);
    });

    const button = component.root.findByProps({ accessibilityRole: 'button' });
    expect(button.props.disabled).toBe(true);
    expect(button.props.title).toBe("You're Offline");
    expect(button.props.accessibilityLabel).toContain('You are offline');
  });

  it('disables Place Order button when cart is empty', async () => {
    (networkHook.useNetworkStatus as jest.Mock).mockReturnValue({ isOffline: false });
    (cartContext.useCart as jest.Mock).mockReturnValue({
      items: [],
      itemCount: 0,
      subtotal: 0,
      deliveryFee: 0,
      taxes: 0,
      total: 0,
      clearCart: jest.fn(),
    });

    let component: any;
    await act(async () => {
      component = renderer.create(<CheckoutScreen />);
    });

    const button = component.root.findByProps({ accessibilityRole: 'button' });
    expect(button.props.disabled).toBe(true);
    expect(button.props.title).toBe('Place Order');
  });

  it('enables Place Order button when online with cart items', async () => {
    (networkHook.useNetworkStatus as jest.Mock).mockReturnValue({ isOffline: false });

    let component: any;
    await act(async () => {
      component = renderer.create(<CheckoutScreen />);
    });

    const button = component.root.findByProps({ accessibilityRole: 'button' });
    expect(button.props.disabled).toBe(false);
    expect(button.props.title).toBe('Place Order');
  });
});
