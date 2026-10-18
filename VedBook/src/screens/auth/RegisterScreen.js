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

export const RegisterScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { register } = useAuth();

  // refs
  const scrollRef = useRef(null);
  const fullNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const currentScrollY = useRef(0);
  const keyboardHeightRef = useRef(0);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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

  // 🧈 SMOOTH scroll to focused input — same as LoginScreen
  const smoothScrollToInput = useCallback(
    wrapRef => {
      const wrap = wrapRef?.current;
      const scroll = scrollRef?.current;
      if (!wrap || !scroll) return;

      setTimeout(() => {
        wrap.measureInWindow((x, y, w, h) => {
          const kbHeight = keyboardHeightRef.current || 0;
          const visibleHeight = height - kbHeight;
          const inputBottom = y + h;
          const desiredMargin = 130; // a bit more for the terms section below
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

    if (!fullName.trim()) errs.fullName = 'Full name is required';

    if (!email.trim()) errs.email = 'Email address is required';
    else if (!emailRegex.test(email.trim()))
      errs.email = 'Please enter a valid email address';

    if (!password) errs.password = 'Password is required';
    else if (password.length < 6)
      errs.password = 'Password must be at least 6 characters';

    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (confirmPassword !== password)
      errs.confirmPassword = 'Passwords do not match';

    if (!agreedToTerms) errs.terms = 'You must agree to the Terms & Conditions';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    setAuthError('');
    if (!validate()) return;

    try {
      setLoading(true);
      const result = await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (!result?.token && navigation) {
        navigation.navigate('Login');
      }
    } catch (err) {
      setAuthError(
        err?.message ||
          'Registration failed. Please check the details entered.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = e => {
    currentScrollY.current = e.nativeEvent.contentOffset.y;
  };

  const toggleTerms = () => {
    setAgreedToTerms(v => !v);
    if (errors.terms) setErrors(prev => ({ ...prev, terms: null }));
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
          {/* ───────── Header ───────── */}
          <View style={styles.header}>
            <View style={styles.logoBadgeOuter}>
              <View style={styles.logoBadge}>
                <Icon name="logo" size={36} color={colors.primary} />
              </View>
            </View>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>
              Join VedBook today and embark upon a distinguished literary
              voyage.
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
            <View ref={fullNameRef} collapsable={false}>
              <Input
                label="Full Name"
                placeholder="e.g. Radhika Apte"
                value={fullName}
                onChangeText={text => {
                  setFullName(text);
                  if (errors.fullName)
                    setErrors(prev => ({ ...prev, fullName: null }));
                }}
                onFocus={() => smoothScrollToInput(fullNameRef)}
                autoCorrect={false}
                icon="user"
                error={errors.fullName}
              />
            </View>

            <View ref={emailRef} collapsable={false}>
              <Input
                label="Email Address"
                placeholder="radhika@example.com"
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  if (errors.email)
                    setErrors(prev => ({ ...prev, email: null }));
                }}
                onFocus={() => smoothScrollToInput(emailRef)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                icon="mail"
                error={errors.email}
              />
            </View>

            <View ref={passwordRef} collapsable={false}>
              <Input
                label="Password"
                placeholder="At least 6 characters"
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  if (errors.password)
                    setErrors(prev => ({ ...prev, password: null }));
                }}
                onFocus={() => smoothScrollToInput(passwordRef)}
                secureTextEntry
                icon="lock"
                error={errors.password}
              />
            </View>

            <View ref={confirmPasswordRef} collapsable={false}>
              <Input
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={text => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword)
                    setErrors(prev => ({ ...prev, confirmPassword: null }));
                }}
                onFocus={() => smoothScrollToInput(confirmPasswordRef)}
                secureTextEntry
                icon="lock"
                error={errors.confirmPassword}
              />
            </View>

            {/* ───────── Terms checkbox ───────── */}
            <Pressable
              onPress={toggleTerms}
              style={styles.checkboxContainer}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreedToTerms }}
            >
              <View
                style={[
                  styles.checkbox,
                  agreedToTerms && styles.checkboxActive,
                  errors.terms && styles.checkboxError,
                ]}
              >
                {agreedToTerms && (
                  <Icon name="check" size={14} color={colors.ivory} />
                )}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsHighlight}>Terms of Service</Text> and{' '}
                <Text style={styles.termsHighlight}>Privacy Policy</Text>.
              </Text>
            </Pressable>
            {errors.terms && (
              <Text style={styles.termsError}>{errors.terms}</Text>
            )}

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              size="lg"
              style={styles.submitButton}
            />
          </View>

          {/* ───────── Footer ───────── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable
              onPress={() => navigation.navigate('Login')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [
                styles.loginLink,
                pressed && styles.pressedLink,
              ]}
            >
              <Text style={styles.loginLinkText}>Log In</Text>
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
    marginBottom: spacing.xl,
  },
  logoBadgeOuter: {
    padding: 6,
    borderRadius: 48,
    backgroundColor: colors.ivory,
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 6,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
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

  /* Form card */
  formCard: {
    width: '100%',
    backgroundColor: colors.ivory,
    borderRadius: borderRadius.lg ?? 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight ?? colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },

  /* Checkbox */
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxError: {
    borderColor: colors.error,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  termsHighlight: {
    fontWeight: '600',
    color: colors.primary,
  },
  termsError: {
    fontSize: 12,
    color: colors.error,
    marginBottom: spacing.sm,
    marginLeft: 30,
  },

  submitButton: {
    marginTop: spacing.lg,
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
  loginLink: {
    marginLeft: spacing.xs + 2,
    paddingVertical: spacing.xs,
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  pressedLink: {
    opacity: 0.5,
  },
});
