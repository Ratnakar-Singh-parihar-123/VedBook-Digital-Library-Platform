import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { SectionHeader } from '../../components/common/SectionHeader';
import { BookCard } from '../../components/common/BookCard';
import { useLibrary } from '../../context/LibraryContext';

/* ✅ FIX: Do alag files se import */
import { booksAPI } from '../../api/booksApi';
import { libraryAPI } from '../../api/libraryApi';

/* ------------------------------------------------------------------ */
/*  Fallback cover                                                    */
/* ------------------------------------------------------------------ */
const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop';

export const BookDetailsScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();

  const { bookId, book: passedBook } = route.params || {};

  const { isBookmarked, toggleBookmark, recordBookOpened, readingProgress } =
    useLibrary();

  const [book, setBook] = useState(passedBook || null);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [loading, setLoading] = useState(!passedBook);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [error, setError] = useState('');

  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const requestIdRef = useRef(0);

  /* ------------------------------------------------------------------ */
  /*  Fetch book details                                                */
  /* ------------------------------------------------------------------ */
  const fetchBook = useCallback(async () => {
    if (!bookId) {
      setError('Book id missing.');
      setLoading(false);
      return;
    }

    const myReqId = ++requestIdRef.current;
    if (!passedBook) setLoading(true);
    setError('');

    try {
      const data = await booksAPI.getBookById(bookId);
      if (myReqId !== requestIdRef.current) return;
      if (!data) {
        setError('Book not found.');
        return;
      }
      setBook(data);
    } catch (e) {
      if (myReqId !== requestIdRef.current) return;
      setError(
        e?.response?.data?.message ||
          'Could not load book details. Please try again.',
      );
    } finally {
      if (myReqId === requestIdRef.current) setLoading(false);
    }
  }, [bookId, passedBook]);

  useEffect(() => {
    setImageError(false);
    fetchBook();
  }, [fetchBook]);

  /* ------------------------------------------------------------------ */
  /*  Fetch related books                                               */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!book?.category || !book?.id) return;

    let cancelled = false;
    setRelatedLoading(true);

    (async () => {
      try {
        const list = await booksAPI.getRelated({
          category: book.category,
          excludeId: book.id,
          limit: 8,
        });
        if (!cancelled) setRelatedBooks(list);
      } catch {
        if (!cancelled) setRelatedBooks([]);
      } finally {
        if (!cancelled) setRelatedLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [book?.category, book?.id]);

  /* ------------------------------------------------------------------ */
  /*  Derived values                                                    */
  /* ------------------------------------------------------------------ */
  const bookmarked = book ? isBookmarked?.(book.id) : false;
  const currentProgress = book ? readingProgress?.[book.id] : null;

  const readingMinutes = book?.pages ? Math.round(book.pages * 1.4) : 0;
  const readingHours = Math.floor(readingMinutes / 60);
  const remainingMins = readingMinutes % 60;
  const estimatedTimeStr = book?.pages
    ? `${readingHours}h ${remainingMins}m`
    : '—';

  /* ------------------------------------------------------------------ */
  /*  Handlers — sab safe with optional chaining + try/catch            */
  /* ------------------------------------------------------------------ */
  const handleReadPress = async () => {
    if (!book) return;

    try {
      recordBookOpened?.(book);
    } catch {}

    navigation.navigate('Reader', { bookId: book.id, book });
  };

  const handleRelatedBookPress = item => {
    try {
      recordBookOpened?.(item);
    } catch {}
    navigation.push('BookDetails', { bookId: item.id, book: item });
  };

  const handleToggleBookmark = async () => {
    if (!book) return;

    try {
      toggleBookmark?.(book);
    } catch {}
  };

  /* ------------------------------------------------------------------ */
  /*  Loading state                                                     */
  /* ------------------------------------------------------------------ */
  if (loading && !book) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.ivory} />
        <View
          style={[
            styles.floatingHeader,
            { paddingTop: Math.max(insets.top, 14) },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={styles.headerIconButton}
          >
            <Icon name="arrow-left" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading book...</Text>
        </View>
      </View>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Error state                                                       */
  /* ------------------------------------------------------------------ */
  if (error && !book) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.ivory} />
        <View
          style={[
            styles.floatingHeader,
            { paddingTop: Math.max(insets.top, 14) },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={styles.headerIconButton}
          >
            <Icon name="arrow-left" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerBox}>
          <View style={styles.stateIconCircle}>
            <Icon name="alert-circle" size={26} color={colors.goldDark} />
          </View>
          <Text style={styles.stateTitle}>Unable to load</Text>
          <Text style={styles.stateMsg}>{error}</Text>
          <TouchableOpacity onPress={fetchBook} style={styles.retryButton}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!book) return null;

  /* ------------------------------------------------------------------ */
  /*  Main render                                                       */
  /* ------------------------------------------------------------------ */
  const coverUri = book.cover || book.coverImage || FALLBACK_COVER;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.ivory} />

      {/* ============ FLOATING HEADER ============ */}
      <View
        style={[
          styles.floatingHeader,
          { paddingTop: Math.max(insets.top, 14) },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.headerIconButton}
        >
          <Icon name="arrow-left" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleToggleBookmark}
          style={[
            styles.headerIconButton,
            bookmarked && styles.headerIconButtonActive,
          ]}
        >
          <Icon
            name={bookmarked ? 'bookmark-filled' : 'bookmark'}
            size={20}
            color={bookmarked ? colors.goldDark : colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 90 },
        ]}
      >
        {/* ============ COVER ============ */}
        <View style={styles.coverPresentationArea}>
          <View style={styles.coverFrame}>
            {!imageError ? (
              <Image
                source={{ uri: coverUri }}
                style={styles.coverImage}
                onError={() => setImageError(true)}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.fallbackCover}>
                <Icon name="book-open" size={48} color={colors.gold} />
                <Text style={styles.fallbackTitle}>{book.title}</Text>
              </View>
            )}
            <View style={styles.goldSpineAccent} />
          </View>
        </View>

        {/* ============ METADATA ============ */}
        <View style={styles.detailsHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{book.category}</Text>
          </View>

          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>By {book.author}</Text>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <View style={styles.statIconRow}>
                <Icon name="star-filled" size={15} color={colors.gold} />
                <Text style={styles.statMainText}>
                  {Number(book.rating || 0).toFixed(1)}
                </Text>
              </View>
              <Text style={styles.statSubText}>
                {book.reviewCount || book.ratingCount || 0} reviews
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statMainText}>{book.pages || '—'}</Text>
              <Text style={styles.statSubText}>Pages</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statMainText}>{estimatedTimeStr}</Text>
              <Text style={styles.statSubText}>Est. Reading</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statMainText}>
                {book.publishedYear || '—'}
              </Text>
              <Text style={styles.statSubText}>Published</Text>
            </View>
          </View>
        </View>

        {/* ============ PROGRESS ============ */}
        {currentProgress &&
          (currentProgress.percentage > 0 ||
            currentProgress.currentPage > 0) && (
            <View style={styles.progressCard}>
              <View style={styles.progressHeaderRow}>
                <Text style={styles.progressCardTitle}>
                  Your Reading Progress
                </Text>
                <Text style={styles.progressCardPercent}>
                  {Math.round(currentProgress.percentage || 0)}%
                </Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(
                        100,
                        Math.max(0, currentProgress.percentage || 0),
                      )}%`,
                    },
                  ]}
                />
              </View>
              {currentProgress.currentPage && currentProgress.totalPages ? (
                <Text style={styles.progressCardSubtitle}>
                  Page {currentProgress.currentPage} of{' '}
                  {currentProgress.totalPages}
                </Text>
              ) : null}
            </View>
          )}

        {/* ============ DESCRIPTION ============ */}
        {book.description ? (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Overview & Synopsis</Text>
            <Text
              style={styles.descriptionText}
              numberOfLines={descriptionExpanded ? undefined : 4}
            >
              {book.description}
            </Text>
            {book.description.length > 180 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setDescriptionExpanded(v => !v)}
                style={styles.expandButton}
              >
                <Text style={styles.expandButtonText}>
                  {descriptionExpanded ? 'Show Less' : 'Read Full Synopsis'}
                </Text>
                <Icon
                  name={descriptionExpanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* ============ RELATED BOOKS ============ */}
        {(relatedBooks.length > 0 || relatedLoading) && (
          <View style={styles.relatedSection}>
            <SectionHeader
              title="Related in this Discipline"
              subtitle={`More works in ${book.category}`}
            />
            {relatedLoading && relatedBooks.length === 0 ? (
              <View style={styles.relatedLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <FlatList
                data={relatedBooks}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedScrollContent}
                ItemSeparatorComponent={() => (
                  <View style={{ width: spacing.sm }} />
                )}
                renderItem={({ item }) => (
                  <View style={{ width: 130 }}>
                    <BookCard
                      book={item}
                      variant="vertical"
                      style={{ width: '100%', marginRight: 0 }}
                      onPress={() => handleRelatedBookPress(item)}
                    />
                  </View>
                )}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* ============ BOTTOM DOCK ============ */}
      <View
        style={[
          styles.bottomDock,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <Button
          title={
            currentProgress && currentProgress.percentage > 0
              ? 'Resume Reading'
              : 'Read Book Now'
          }
          variant="primary"
          size="lg"
          icon="book-open"
          onPress={handleReadPress}
          style={styles.readBookButton}
        />
      </View>
    </View>
  );
};

/* ================================================================== */
/*  STYLES                                                            */
/* ================================================================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },

  floatingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.ivory,
    zIndex: 10,
  },
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerIconButtonActive: {
    backgroundColor: colors.goldLight,
    borderColor: colors.gold,
  },

  scrollContent: { paddingTop: spacing.xs },

  /* COVER */
  coverPresentationArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  coverFrame: {
    width: 175,
    height: 255,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    position: 'relative',
    ...shadows.elevated,
  },
  coverImage: { width: '100%', height: '100%' },
  goldSpineAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 6,
    backgroundColor: colors.gold,
    opacity: 0.85,
  },
  fallbackCover: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  fallbackTitle: {
    color: colors.ivory,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  /* DETAILS */
  detailsHeader: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: colors.sage,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
    marginBottom: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fontSerif,
    textAlign: 'center',
    lineHeight: 30,
  },
  author: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.lg,
  },

  /* STATS BAR */
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statIconRow: { flexDirection: 'row', alignItems: 'center' },
  statMainText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 3,
  },
  statSubText: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderLight,
  },

  /* PROGRESS */
  progressCard: {
    backgroundColor: colors.sage,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  progressCardPercent: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.goldDark,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 3,
  },
  progressCardSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },

  /* DESCRIPTION */
  descriptionSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs + 2,
    fontFamily: typography.fontSerif,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 4,
  },

  /* RELATED */
  relatedSection: { marginTop: spacing.lg },
  relatedScrollContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
  },
  relatedLoader: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },

  /* BOTTOM DOCK */
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    ...shadows.medium,
  },
  readBookButton: { width: '100%' },

  /* LOADERS / STATES */
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 60,
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 13,
  },
  stateIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  stateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fontSerif,
    marginBottom: 4,
  },
  stateMsg: {
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: colors.ivory,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.4,
  },
});
