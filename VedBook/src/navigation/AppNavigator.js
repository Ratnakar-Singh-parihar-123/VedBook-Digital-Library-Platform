import React from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { Icon } from '../components/common/Icon';
import { useAuth } from '../context/AuthContext';

// Screens
import { SplashScreen } from '../screens/splash/SplashScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { BookDetailsScreen } from '../screens/books/BookDetailsScreen';
import { ReaderScreen } from '../screens/reader/ReaderScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { CategoryDetailScreen } from '../screens/categories/CategoryDetailScreen';

const RootStack = createNativeStackNavigator();

// Clean Brand Loading Screen to prevent screen flickering during async session verification
const BrandLoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />
    <View style={styles.loadingLogoBadge}>
      <Icon name="logo" size={48} color={colors.gold} />
    </View>
    <ActivityIndicator size="small" color={colors.gold} style={styles.spinner} />
  </View>
);

export const AppNavigator = () => {
  const { isLoadingSession, hasCompletedOnboarding, isAuthenticated } = useAuth();

  if (isLoadingSession) {
    return <BrandLoadingScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
        }}
      >
        {isAuthenticated ? (
          // Authenticated Application Stack
          <RootStack.Group>
            <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
            <RootStack.Screen
              name="BookDetails"
              component={BookDetailsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <RootStack.Screen
              name="Reader"
              component={ReaderScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <RootStack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <RootStack.Screen
              name="CategoryDetail"
              component={CategoryDetailScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </RootStack.Group>
        ) : !hasCompletedOnboarding ? (
          // First-Time Launch: Splash -> Onboarding -> Auth
          <RootStack.Group>
            <RootStack.Screen name="Splash" component={SplashScreen} />
            <RootStack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <RootStack.Screen
              name="Login"
              component={LoginScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <RootStack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <RootStack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </RootStack.Group>
        ) : (
          // Subsequent Launch When Logged Out: Directly to Login (Splash is skipped!)
          <RootStack.Group>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <RootStack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </RootStack.Group>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogoBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  spinner: {
    marginTop: 24,
  },
});
