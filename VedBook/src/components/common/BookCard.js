import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from '../../theme';
import { Icon } from './Icon';
import { useLibrary } from '../../context/LibraryContext';

export const BookCard = ({
  book,
  variant = 'vertical', // 'vertical', 'horizontal', 'featured', 'compact'
  onPress,
  onReadPress,
  showProgress = false,
  progressData,
  style,
}) => {
  const [imageError, setImageError] = useState(false);
  const { toggleBookmark, isBookmarked } = useLibrary();

  useEffect(() => {
    setImageError(false);
  }, [book?.cover, book?.id]);

  if (!book) return null;

  const bookmarked = isBookmarked(book.id);
  const progressPercent = progressData?.percentage ?? (showProgress ? 45 : 0);

  const handleBookmarkPress = e => {
    e.stopPropagation?.();
    toggleBookmark(book.id);
  };

  // 1. FEATURED HERO VARIANT
  if (variant === 'featured') {
    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${book.title}, by ${book.author}`}
        style={[styles.featuredContainer, style]}
      >
        <View style={styles.featuredCoverWrapper}>
          {!imageError ? (
            <Image
              source={
                typeof book.cover === 'string' && book.cover.trim()
                  ? { uri: book.cover.trim() }
                  : undefined
              }
              style={styles.featuredCover}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.fallbackCoverFeatured}>
              <Icon name="book-open" size={38} color={colors.gold} />
              <Text style={styles.fallbackTitleFeatured} numberOfLines={2}>
                {book.title}
              </Text>
            </View>
          )}
          <View style={styles.featuredGradientOverlay} />
        </View>

        <View style={styles.featuredContent}>
          <View style={styles.featuredTopRow}>
            <View style={styles.categoryBadgeGold}>
              <Text style={styles.categoryBadgeTextGold}>{book.category}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleBookmarkPress}
              style={styles.bookmarkButtonCircle}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon
                name={bookmarked ? 'bookmark-filled' : 'bookmark'}
                size={18}
                color={bookmarked ? colors.gold : colors.ivory}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.featuredTitle} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={styles.featuredAuthor} numberOfLines={1}>
            By {book.author}
          </Text>

          <View style={styles.featuredMetaRow}>
            <View style={styles.ratingRow}>
              <Icon name="star-filled" size={13} color={colors.gold} />
              <Text style={styles.ratingTextWhite}>{book.rating}</Text>
              <Text style={styles.reviewTextWhite}>
                ({book.reviewCount} ratings)
              </Text>
            </View>
            <Text style={styles.metaDotWhite}>•</Text>
            <Text style={styles.pagesTextWhite}>{book.pages} pages</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onReadPress || onPress}
            style={styles.readNowButton}
          >
            <Icon name="book-open" size={15} color={colors.primaryDark} />
            <Text style={styles.readNowText}>Read Now</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  // 2. HORIZONTAL CONTINUE READING VARIANT
  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${book.title}, by ${book.author}`}
        style={[styles.horizontalContainer, style]}
      >
        <View style={styles.horizontalCoverWrapper}>
          {!imageError ? (
            <Image
              source={
                typeof book.cover === 'string' && book.cover.trim()
                  ? { uri: book.cover.trim() }
                  : undefined
              }
              style={styles.horizontalCover}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.fallbackCoverHorizontal}>
              <Icon name="book" size={24} color={colors.gold} />
            </View>
          )}
          <View style={styles.spineOverlay} />
        </View>

        <View style={styles.horizontalDetails}>
          <View style={styles.horizontalHeaderRow}>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{book.category}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleBookmarkPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon
                name={bookmarked ? 'bookmark-filled' : 'bookmark'}
                size={16}
                color={bookmarked ? colors.gold : colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.horizontalTitle} numberOfLines={1}>
            {book.title}
          </Text>
          <Text style={styles.horizontalAuthor} numberOfLines={1}>
            {book.author}
          </Text>

          {/* Reading progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.max(6, progressPercent)}%` },
                ]}
              />
            </View>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressPercentText}>
                {progressPercent}% completed
              </Text>
              {progressData?.currentPage ? (
                <Text style={styles.progressPageText}>
                  Page {progressData.currentPage} of {progressData.totalPages}
                </Text>
              ) : (
                <Text style={styles.progressPageText}>{book.pages} pages</Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // 3. VERTICAL STANDARD / GRID VARIANT
  const hasCoverUri =
    typeof book.cover === 'string' &&
    book.cover.trim().length > 0 &&
    !book.cover.includes('undefined') &&
    !book.cover.includes('null');

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${book.title}, by ${book.author}`}
      style={[styles.verticalContainer, style]}
    >
      <View style={styles.verticalCoverWrapper}>
        {hasCoverUri && !imageError ? (
          <Image
            source={{ uri: book.cover.trim() }}
            style={styles.verticalCover}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.fallbackCoverVertical}>
            <Icon name="book-open" size={26} color={colors.gold} />
            <Text style={styles.fallbackTitleVertical} numberOfLines={3}>
              {book.title}
            </Text>
          </View>
        )}

        {/* Elegant Spine & Border Highlight */}
        <View style={styles.spineOverlay} />

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleBookmarkPress}
          style={styles.verticalBookmarkBadge}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Icon
            name={bookmarked ? 'bookmark-filled' : 'bookmark'}
            size={13}
            color={bookmarked ? colors.gold : colors.ivory}
          />
        </TouchableOpacity>

        <View style={styles.verticalRatingBadge}>
          <Icon name="star-filled" size={10} color={colors.gold} />
          <Text style={styles.verticalRatingText}>{book.rating || '5.0'}</Text>
        </View>
      </View>

      <View style={styles.verticalInfo}>
        <Text style={styles.verticalCategory} numberOfLines={1}>
          {book.category}
        </Text>
        <Text style={styles.verticalTitle} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.verticalAuthor} numberOfLines={1}>
          {book.author}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // VERTICAL VARIANT
  verticalContainer: {
    width: 144,
    marginRight: spacing.md,
    marginBottom: spacing.md,
  },
  verticalCoverWrapper: {
    width: '100%',
    aspectRatio: 0.69,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.sage,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  verticalCover: {
    width: '100%',
    height: '100%',
  },
  spineOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  fallbackCoverVertical: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  fallbackTitleVertical: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ivory,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontFamily: typography.fontSerif,
  },
  verticalBookmarkBadge: {
    position: 'absolute',
    top: spacing.xs + 3,
    right: spacing.xs + 3,
    backgroundColor: 'rgba(16, 47, 40, 0.75)',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalRatingBadge: {
    position: 'absolute',
    bottom: spacing.xs + 3,
    left: spacing.xs + 3,
    backgroundColor: 'rgba(16, 47, 40, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs + 3,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  verticalRatingText: {
    color: colors.ivory,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
  verticalInfo: {
    marginTop: spacing.xs + 3,
  },
  verticalCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.goldDark,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  verticalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 19,
    fontFamily: typography.fontSerif,
  },
  verticalAuthor: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // HORIZONTAL VARIANT
  horizontalContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  horizontalCoverWrapper: {
    width: 80,
    height: 116,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.sage,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  horizontalCover: {
    width: '100%',
    height: '100%',
  },
  fallbackCoverHorizontal: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalDetails: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'space-between',
  },
  horizontalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryChip: {
    backgroundColor: colors.sage,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  horizontalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: typography.fontSerif,
    marginTop: 3,
  },
  horizontalAuthor: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.sage,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 3,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.goldDark,
  },
  progressPageText: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  // FEATURED VARIANT
  featuredContainer: {
    height: 290,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.primaryDark,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.hover,
  },
  featuredCoverWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredCover: {
    width: '100%',
    height: '100%',
  },
  fallbackCoverFeatured: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  fallbackTitleFeatured: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ivory,
    textAlign: 'center',
    marginTop: spacing.md,
    fontFamily: typography.fontSerif,
  },
  featuredGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 47, 40, 0.82)',
  },
  featuredContent: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'flex-end',
  },
  featuredTopRow: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadgeGold: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  categoryBadgeTextGold: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bookmarkButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.ivory,
    lineHeight: 30,
    fontFamily: typography.fontSerif,
  },
  featuredAuthor: {
    fontSize: 14,
    color: colors.goldLight,
    marginTop: 4,
  },
  featuredMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingTextWhite: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ivory,
    marginLeft: 4,
  },
  reviewTextWhite: {
    fontSize: 12,
    color: colors.goldLight,
    marginLeft: 3,
  },
  metaDotWhite: {
    color: colors.goldLight,
    marginHorizontal: spacing.sm,
  },
  pagesTextWhite: {
    fontSize: 12,
    color: colors.goldLight,
  },
  readNowButton: {
    backgroundColor: colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    ...shadows.soft,
  },
  readNowText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
    marginLeft: spacing.xs + 3,
    letterSpacing: 0.3,
  },
});
