/**
 * Root Navigator
 * Main stack navigator with auth flow
 */

import React, { forwardRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RootStackParamList } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../contexts/AuthContext';

// Navigators
import MainTabNavigator from './MainTabNavigator';
import AuthNavigator from './AuthNavigator';

// Screens
import ItemDetailScreen from '../screens/menu/ItemDetailScreen';
import CheckoutOptionsScreen from '../screens/cart/CheckoutOptionsScreen';
import GuestCheckoutScreen from '../screens/cart/GuestCheckoutScreen';
import CheckoutScreen from '../screens/cart/CheckoutScreen';
import PaymentSuccessScreen from '../screens/payment/PaymentSuccessScreen';
import PaymentFailedScreen from '../screens/payment/PaymentFailedScreen';
import OrderTrackingScreen from '../screens/order/OrderTrackingScreen';
import OrderHistoryScreen from '../screens/order/OrderHistoryScreen';
import OrderDetailScreen from '../screens/order/OrderDetailScreen';
import OrderReviewScreen from '../screens/order/OrderReviewScreen';
import AddressManagementScreen from '../screens/profile/AddressManagementScreen';
import AddAddressScreen from '../screens/profile/AddAddressScreen';
import SearchScreen from '../screens/home/SearchScreen';
import NotificationsScreen from '../screens/home/NotificationsScreen';
import ChatScreen from '../screens/support/ChatScreen';
import PreferencesScreen from '../screens/profile/PreferencesScreen';
import NotificationSettingsScreen from '../screens/profile/NotificationSettingsScreen';
import LoyaltyHistoryScreen from '../screens/profile/LoyaltyHistoryScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {}

const RootNavigator = forwardRef<NavigationContainerRef<RootStackParamList>, RootNavigatorProps>(
  (_props, ref) => {
    const { theme } = useTheme();
    const { isLoading } = useAuth();

    // Show loading screen while checking auth status
    if (isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
          <ActivityIndicator size="large" color={theme.colors.brand.primary} />
        </View>
      );
    }

    return (
      <NavigationContainer ref={ref}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'slide_from_right',
        }}
      >
        {/* Main app screens - available to all users (guest and authenticated) */}
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen
          name="ItemDetail"
          component={ItemDetailScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="CheckoutOptions"
          component={CheckoutOptionsScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen name="GuestCheckout" component={GuestCheckoutScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{
            animation: 'fade',
          }}
        />

        {/* Auth screens - for login/register when needed */}
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />

        {/* Payment result screens */}
        <Stack.Screen
          name="PaymentSuccess"
          component={PaymentSuccessScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="PaymentFailed"
          component={PaymentFailedScreen}
          options={{
            headerShown: false,
          }}
        />

        {/* Protected screens - require authentication */}
        <Stack.Screen
          name="OrderTracking"
          component={OrderTrackingScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <Stack.Screen
          name="OrderReview"
          component={OrderReviewScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="AddressManagement"
          component={AddressManagementScreen}
        />
        <Stack.Screen
          name="AddAddress"
          component={AddAddressScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen name="Preferences" component={PreferencesScreen} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
        <Stack.Screen name="LoyaltyHistory" component={LoyaltyHistoryScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
});

RootNavigator.displayName = 'RootNavigator';

export default RootNavigator;
