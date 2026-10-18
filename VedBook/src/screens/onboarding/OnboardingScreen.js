import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Discover Your Next Read',
    subtitle: 'Curated World Literature & Ancient Wisdom',
    description:
      'Immerse yourself in handpicked masterpieces across philosophy, literature, science, and history. Find works that inspire profound insight.',
    icon: 'compass',
    accentTitle: 'EXPLORE',
  },
  {
    id: '2',
    title: 'Your Personal Library',
    subtitle: 'Track Your Intellectual Journey',
    description:
      'Bookmark rare volumes, organize your active reading queue, and monitor your compounding knowledge over time with elegant reading metrics.',
    icon: 'library',
    accentTitle: 'ORGANIZE',
  },
  {
    id: '3',
    title: 'A Better Reading Experience',
    subtitle: 'Calm, Distraction-Free Typography',
    description:
      'Engineered for clarity and peaceful contemplation. Customize typography, contrast, and layout for seamless reading across all your devices.',
    icon: 'book-open',
    accentTitle: 'ENJOY',
  },
];

export const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuth();

  const handleFinishOnboarding = async () => {
    await completeOnboarding();
    // Navigate to Login
    navigation.replace('Login');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinishOnboarding();
    }
  };

  const handleSkip = () => {
    handleFinishOnboarding();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.ivory} />

      {/* Top Header with Brand & Skip */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Icon name="logo" size={26} color={colors.primary} />
          <Text style={styles.brandTitle}>VedBook</Text>
        </View>

        {currentIndex < SLIDES.length - 1 ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSkip}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {/* Visual Composition Card */}
            <View style={styles.illustrationCard}>
              <View style={styles.outerCircle}>
                <View style={styles.innerCircle}>
                  <Icon name={item.icon} size={64} color={colors.primary} />
                </View>
              </View>
              <View style={styles.accentBadge}>
                <Text style={styles.accentBadgeText}>{item.accentTitle}</Text>
              </View>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideDescription}>{item.description}</Text>
            </View>
          </View>
        )}
      />

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Pagination Dots */}
        <View style={styles.paginationRow}>
          {SLIDES.map((_, index) => {
            const isActive = index === currentIndex;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            variant={currentIndex === SLIDES.length - 1 ? 'gold' : 'primary'}
            size="lg"
            icon="chevron-right"
            iconPosition="right"
            onPress={handleNext}
            style={styles.actionButton}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginLeft: spacing.sm,
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  illustrationCard: {
    width: SCREEN_WIDTH - 64,
    height: SCREEN_WIDTH * 0.72,
    backgroundColor: colors.sage,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: spacing.md,
  },
  outerCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.ivory,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.goldLight,
  },
  innerCircle: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentBadge: {
    position: 'absolute',
    bottom: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
  },
  accentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 1,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  slideSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.goldDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  slideTitle: {
    fontFamily: typography.fontSerif,
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: spacing.md,
  },
  slideDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomControls: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.sageDark,
  },
  buttonContainer: {
    width: '100%',
  },
  actionButton: {
    width: '100%',
  },
});
