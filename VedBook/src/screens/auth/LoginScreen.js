import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

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
      // Navigation handled by Root Navigator state
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.ivory} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Icon name="logo" size={38} color={colors.primary} />
          </View>
          <Text style={styles.title}>Welcome to VedBook</Text>
          <Text style={styles.subtitle}>
            Enter your credentials to access your personal digital library and
            reading sanctuary.
          </Text>
        </View>

        {/* Auth Error */}
        {authError ? (
          <View style={styles.errorAlert}>
            <Icon name="info" size={18} color={colors.error} />
            <Text style={styles.errorAlertText}>{authError}</Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Email Address"
            placeholder="reader@vedbook.com"
            value={email}
            onChangeText={text => {
              setEmail(text);
              if (errors.email) setErrors(prev => ({ ...prev, email: null }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail"
            error={errors.email}
          />

          <Input
            label="Password"
            placeholder="••••••••••••"
            value={password}
            onChangeText={text => {
              setPassword(text);
              if (errors.password)
                setErrors(prev => ({ ...prev, password: null }));
            }}
            secureTextEntry
            icon="lock"
            error={errors.password}
          />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ForgotPassword')}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.forgotPasswordButton}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Log In"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={styles.loginButton}
          />

          {/* Demo helper */}
          <View style={styles.demoBox}>
            <View style={styles.demoBoxHeader}>
              <Icon name="star" size={14} color={colors.goldDark} />
              <Text style={styles.demoBoxTitle}>Quick Demo Auto-Fill</Text>
            </View>
            <Text style={styles.demoBoxDesc}>
              Tap below to pre-populate prototype credentials:
            </Text>
            <View style={styles.demoButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  fillDemoAccount('demo@vedbook.com', 'Password123!')
                }
                accessibilityRole="button"
                style={styles.demoPill}
              >
                <Text style={styles.demoPillText}>demo@vedbook.com</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  fillDemoAccount('reader@vedbook.com', 'Password123!')
                }
                accessibilityRole="button"
                style={styles.demoPill}
              >
                <Text style={styles.demoPillText}>reader@vedbook.com</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Register')}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.registerLink}
          >
            <Text style={styles.registerLinkText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/* styles unchanged — same as before */
const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: colors.ivory },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
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
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
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
  form: { width: '100%' },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  loginButton: { marginBottom: spacing.xl },
  demoBox: {
    backgroundColor: colors.sage,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  demoBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  demoBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoBoxDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  demoPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoPillText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  footerText: { fontSize: 14, color: colors.textSecondary },
  registerLink: { marginLeft: spacing.xs + 2, paddingVertical: spacing.xs },
  registerLinkText: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
