import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  Keyboard,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { login } = useAuth();

  // refs
  const scrollRef = useRef(null);
  const emailWrapRef = useRef(null);
  const passwordWrapRef = useRef(null);
  const currentScrollY = useRef(0);
  const keyboardHeightRef = useRef(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✨ Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // ⌨️ Track keyboard height
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      keyboardHeightRef.current = e.endCoordinates.height;
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      keyboardHeightRef.current = 0;
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const formMaxWidth = Math.min(width - spacing.xl * 2, 480);

  // 🧈 SMOOTH scroll to input — the main fix
  const smoothScrollToInput = useCallback(
    wrapRef => {
      const wrap = wrapRef?.current;
      const scroll = scrollRef?.current;
      if (!wrap || !scroll) return;

      // wait for keyboard animation to settle
      setTimeout(() => {
        wrap.measureInWindow((x, y, w, h) => {
          const kbHeight = keyboardHeightRef.current || 0;
          const visibleHeight = height - kbHeight;
          const inputBottom = y + h;
          const desiredMargin = 110; // breathing room above keyboard
          const targetBottom = visibleHeight - desiredMargin;

          if (inputBottom > targetBottom) {
            const delta = inputBottom - targetBottom;
            const targetY = Math.max(0, currentScrollY.current + delta);
            scroll.scrollTo({ y: targetY, animated: true });
          }
        });
      }, 220);
    },
    [height],
  );

  const validate = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) errs.email = 'Email is required';
    else if (!emailRegex.test(email.trim()))
      errs.email = 'Please enter a valid email address';

    if (!password) errs.password = 'Password is required';
    else if (password.length < 6)
      errs.password = 'Password must be at least 6 characters';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    setAuthError('');
    if (!validate()) return;
    try {
      setLoading(true);
      await login(email, password);
    } catch (err) {
      setAuthError(
        err?.message || 'Login failed. Please check your credentials.',
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrors({});
    setAuthError('');
  };

  const handleScroll = e => {
    currentScrollY.current = e.nativeEvent.contentOffset.y;
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.ivory} />

      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24) + 160,
            minHeight: height,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets
        bounces
      >
        <Animated.View
          style={[
            styles.innerWrapper,
            {
              maxWidth: formMaxWidth,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* ───────── Brand Header ───────── */}
          <View style={styles.header}>
            <View style={styles.logoBadgeOuter}>
              <View style={styles.logoBadge}>
                <Icon name="logo" size={38} color={colors.primary} />
              </View>
            </View>
            <Text style={styles.title}>Welcome to VedBook</Text>
            <Text style={styles.subtitle}>
              Your personal digital library and reading sanctuary.
            </Text>
          </View>

          {/* ───────── Auth Error ───────── */}
          {authError ? (
            <View style={styles.errorAlert}>
              <Icon name="info" size={18} color={colors.error} />
              <Text style={styles.errorAlertText}>{authError}</Text>
            </View>
          ) : null}

          {/* ───────── Form Card ───────── */}
          <View style={styles.formCard}>
            <View ref={emailWrapRef} collapsable={false}>
              <Input
                label="Email Address"
                placeholder="reader@vedbook.com"
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  if (errors.email)
                    setErrors(prev => ({ ...prev, email: null }));
                }}
                onFocus={() => smoothScrollToInput(emailWrapRef)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                icon="mail"
                error={errors.email}
              />
            </View>

            <View ref={passwordWrapRef} collapsable={false}>
              <Input
                label="Password"
                placeholder="••••••••••••"
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  if (errors.password)
                    setErrors(prev => ({ ...prev, password: null }));
                }}
                onFocus={() => smoothScrollToInput(passwordWrapRef)}
                secureTextEntry
                icon="lock"
                error={errors.password}
              />
            </View>

            <Pressable
              onPress={() => navigation.navigate('ForgotPassword')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [
                styles.forgotPasswordButton,
                pressed && styles.pressedLink,
              ]}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </Pressable>

            <Button
              title="Log In"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={styles.loginButton}
            />
          </View>

          {/* ───────── Footer ───────── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Pressable
              onPress={() => navigation.navigate('Register')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [
                styles.registerLink,
                pressed && styles.pressedLink,
              ]}
            >
              <Text style={styles.registerLinkText}>Create Account</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/* ───────────────── Styles ───────────────── */
const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerWrapper: {
    width: '100%',
    alignSelf: 'center',
  },

  /* Header */
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoBadgeOuter: {
    padding: 6,
    borderRadius: 48,
    backgroundColor: colors.ivory,
    marginBottom: spacing.md,
    // soft glow / shadow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 6,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fontSerif,
    marginBottom: spacing.xs,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },

  /* Error alert */
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  errorAlertText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: spacing.sm,
    flex: 1,
  },

  /* Form card — soft container */
  formCard: {
    width: '100%',
    backgroundColor: colors.ivory,
    borderRadius: borderRadius.lg ?? 16,
    padding: spacing.lg,
    // subtle border + shadow
    borderWidth: 1,
    borderColor: colors.borderLight ?? colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  loginButton: {
    marginBottom: spacing.xs,
  },
  pressedLink: {
    opacity: 0.5,
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  registerLink: {
    marginLeft: spacing.xs + 2,
    paddingVertical: spacing.xs,
  },
  registerLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
