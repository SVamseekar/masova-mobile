import React from 'react';
import renderer, { act } from 'react-test-renderer';
import OfflineBanner from '../OfflineBanner';
import * as networkHook from '../../../hooks/useNetworkStatus';
import * as themeHook from '../../../hooks/useTheme';
import { lightTheme } from '../../../styles/theme';

jest.mock('../../../hooks/useNetworkStatus');
jest.mock('../../../hooks/useTheme');

describe('OfflineBanner Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (themeHook.useTheme as jest.Mock).mockReturnValue({
      theme: lightTheme,
      isDark: false,
    });
  });

  it('renders null when online', () => {
    (networkHook.useNetworkStatus as jest.Mock).mockReturnValue({ isOffline: false });

    let component: any;
    act(() => {
      component = renderer.create(<OfflineBanner />);
    });
    expect(component.toJSON()).toBeNull();
  });

  it('renders alert banner when offline', () => {
    (networkHook.useNetworkStatus as jest.Mock).mockReturnValue({ isOffline: true });

    let component: any;
    act(() => {
      component = renderer.create(<OfflineBanner />);
    });
    const tree = component.toJSON();

    expect(tree).not.toBeNull();
    expect(tree.props.accessibilityRole).toBe('alert');
    expect(tree.props.accessibilityLabel).toContain('You are currently offline');
  });
});
