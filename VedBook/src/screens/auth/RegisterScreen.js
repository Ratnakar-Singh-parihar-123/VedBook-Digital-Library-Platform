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

export const RegisterScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

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

      // If backend does not return token to auto-login, navigate to Login screen
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
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Icon name="logo" size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>
            Join VedBook today and embark upon a distinguished literary voyage.
          </Text>
        </View>

        {authError ? (
          <View style={styles.errorAlert}>
            <Icon name="info" size={18} color={colors.error} />
            <Text style={styles.errorAlertText}>{authError}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="e.g. Radhika Apte"
            value={fullName}
            onChangeText={text => {
              setFullName(text);
              if (errors.fullName)
                setErrors(prev => ({ ...prev, fullName: null }));
            }}
            icon="user"
            error={errors.fullName}
          />

          <Input
            label="Email Address"
            placeholder="radhika@example.com"
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
            placeholder="At least 6 characters"
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

          <Input
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={text => {
              setConfirmPassword(text);
              if (errors.confirmPassword)
                setErrors(prev => ({ ...prev, confirmPassword: null }));
            }}
            secureTextEntry
            icon="lock"
            error={errors.confirmPassword}
          />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setAgreedToTerms(!agreedToTerms);
              if (errors.terms) setErrors(prev => ({ ...prev, terms: null }));
            }}
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
          </TouchableOpacity>
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.loginLink}
          >
            <Text style={styles.loginLinkText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/* styles unchanged */
const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: colors.ivory },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
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
  checkboxError: { borderColor: colors.error },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  termsHighlight: { fontWeight: '600', color: colors.primary },
  termsError: {
    fontSize: 12,
    color: colors.error,
    marginBottom: spacing.sm,
    marginLeft: 30,
  },
  submitButton: { marginTop: spacing.lg, marginBottom: spacing.xl },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: { fontSize: 14, color: colors.textSecondary },
  loginLink: { marginLeft: spacing.xs + 2, paddingVertical: spacing.xs },
  loginLinkText: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
