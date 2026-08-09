import React from 'react';
import renderer, { act } from 'react-test-renderer';
import LoginScreen from '../LoginScreen';
import * as authContext from '../../../contexts/AuthContext';
import * as themeHook from '../../../hooks/useTheme';
import { lightTheme } from '../../../styles/theme';

jest.mock('../../../contexts/AuthContext');
jest.mock('../../../hooks/useTheme');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    dispatch: jest.fn(),
  }),
  CommonActions: { goBack: jest.fn() },
}));

describe('LoginScreen Component', () => {
  const mockLogin = jest.fn();
  const mockLoginWithGoogle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (themeHook.useTheme as jest.Mock).mockReturnValue({
      theme: lightTheme,
      isDark: false,
    });
    (authContext.useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      loginWithGoogle: mockLoginWithGoogle,
      isAuthenticated: false,
      user: null,
    });
  });

  it('renders login form with title and input fields', () => {
    let component: any;
    act(() => {
      component = renderer.create(<LoginScreen />);
    });
    const tree = component.toJSON();

    expect(tree).not.toBeNull();
  });

  it('displays error message when login fails due to invalid credentials', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid email or password'));

    let component: any;
    act(() => {
      component = renderer.create(<LoginScreen />);
    });

    const inputs = component.root.findAllByType('TextInput' as any);
    expect(inputs.length).toBeGreaterThanOrEqual(2);

    // Simulate entering credentials and pressing login
    await act(async () => {
      inputs[0].props.onChangeText('test@example.com');
      inputs[1].props.onChangeText('wrongpassword');
    });

    const button = component.root.findByProps({ title: 'Sign In' });
    await act(async () => {
      button.props.onPress();
    });

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    const errorText = component.root.findByProps({ children: 'Invalid email or password' });
    expect(errorText).toBeTruthy();
  });
});
