import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';

const { width } = Dimensions.get('window');

export const SplashScreen = ({ navigation, onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  const handleProceed = () => {
    if (onFinish) {
      onFinish();
    } else if (navigation) {
      navigation.replace('Onboarding');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primaryDark}
      />

      {/* Decorative Gold Radiance Rings */}
      <View style={styles.radianceCircleLarge} />
      <View style={styles.radianceCircleSmall} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <View style={styles.iconEmblem}>
            <Icon name="logo" size={54} color={colors.gold} />
          </View>
        </View>

        <Text style={styles.brandName}>VedBook</Text>
        <View style={styles.taglineDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.taglineOrnament}>✦</Text>
          <View style={styles.dividerLine} />
        </View>
        <Text style={styles.tagline}>
          The Sovereign Digital Sanctuary for Timeless Minds
        </Text>

        <View style={styles.buttonWrapper}>
          <Button
            title="Begin Exploration"
            variant="gold"
            size="lg"
            icon="chevron-right"
            iconPosition="right"
            onPress={handleProceed}
            style={styles.startButton}
          />
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Crafted with Ancient Wisdom & Modern Grace
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  radianceCircleLarge: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: (width * 1.5) / 2,
    borderWidth: 1,
    borderColor: 'rgba(198, 164, 92, 0.08)',
  },
  radianceCircleSmall: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    borderWidth: 1,
    borderColor: 'rgba(198, 164, 92, 0.16)',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  iconEmblem: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  brandName: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.ivory,
    fontFamily: typography.fontSerif,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  taglineDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    width: 140,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.goldDark,
    opacity: 0.6,
  },
  taglineOrnament: {
    color: colors.gold,
    fontSize: 12,
    marginHorizontal: spacing.sm,
  },
  tagline: {
    fontSize: 15,
    color: colors.goldLight,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  buttonWrapper: {
    marginTop: spacing.xxxl,
    width: '100%',
    maxWidth: 280,
  },
  startButton: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  footer: {
    position: 'absolute',
    bottom: spacing.xxl,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(250, 247, 240, 0.5)',
    letterSpacing: 0.5,
  },
});
