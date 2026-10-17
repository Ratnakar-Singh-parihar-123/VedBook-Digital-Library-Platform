import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { mockAuthService } from '../../services/mockAuthService';

export const ForgotPasswordScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  const handleReset = async () => {
    setError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setError('Please provide your registered email address.');
      return;
    } else if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email format.');
      return;
    }

    try {
      setLoading(true);
      const res = await mockAuthService.forgotPassword(email);
      setSuccessInfo(res.message);
    } catch (err) {
      setError(err.message || 'Unable to process reset request.');
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
          { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back to Login"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={20} color={colors.primary} />
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Icon
              name={successInfo ? 'check' : 'lock'}
              size={36}
              color={successInfo ? colors.success : colors.primary}
            />
          </View>

          <Text style={styles.title}>
            {successInfo ? 'Reset Instructions Sent' : 'Reset Password'}
          </Text>

          <Text style={styles.subtitle}>
            {successInfo
              ? successInfo
              : 'Enter the email address associated with your VedBook account. We will dispatch instructions to restore your access.'}
          </Text>

          {error ? (
            <View style={styles.errorAlert}>
              <Icon name="info" size={16} color={colors.error} />
              <Text style={styles.errorAlertText}>{error}</Text>
            </View>
          ) : null}

          {!successInfo ? (
            <View style={styles.form}>
              <Input
                label="Registered Email"
                placeholder="your.email@example.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail"
              />

              <Button
                title="Send Reset Link"
                onPress={handleReset}
                loading={loading}
                size="lg"
                style={styles.actionButton}
              />
            </View>
          ) : (
            <View style={styles.successContainer}>
              <Button
                title="Return to Login"
                variant="primary"
                size="lg"
                onPress={() => navigation.navigate('Login')}
                style={styles.actionButton}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: spacing.xxl,
    paddingVertical: spacing.xs,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
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
    lineHeight: 22,
    marginBottom: spacing.xl,
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
    width: '100%',
  },
  errorAlertText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: spacing.sm,
    flex: 1,
  },
  form: {
    width: '100%',
  },
  successContainer: {
    width: '100%',
  },
  actionButton: {
    marginTop: spacing.md,
  },
});
