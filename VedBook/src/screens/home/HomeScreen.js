// HomeScreen.js

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Image,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Keyboard,
  Platform,
  useWindowDimensions,
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
import { SectionHeader } from '../../components/common/SectionHeader';
import { BookCard } from '../../components/common/BookCard';

import { quotes } from '../../data/booksData';
import { categories } from '../../data/categoriesData';

import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { homeAPI } from '../../api/homeApi';
import { booksAPI } from '../../api/booksApi';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop';

const SEARCH_DEBOUNCE_MS = 400;

/* ================================================================== */
/*  Home Screen                                                       */
/* ================================================================== */
export const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { user } = useAuth();

  const HORIZONTAL_PADDING = spacing.lg;
  const COLUMN_GAP = spacing.md;
  const gridCardWidth = Math.max(
    130,
    Math.floor((windowWidth - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / 2),
  );

  const {
    unreadNotificationsCount,
    getContinueReadingBooks,
    readingProgress,
    registerBooks,
  } = useLibrary();

  /* ---------- Greeting ---------- */
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  /* ---------- Home data state ---------- */
  const [featured, setFeatured] = useState([]);
  const [popular, setPopular] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [continueReading, setContinueReading] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  /* ---------- Search state ---------- */
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const searchInputRef = useRef(null);
  const searchRequestIdRef = useRef(0);

  const isSearchMode = searchQuery.trim().length > 0;

  /* ================================================================== */
  /*  Fetch all home data + auto-register books metadata                */
  /* ================================================================== */
  const fetchAll = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const promises = [
        homeAPI.getFeatured(),
        homeAPI.getPopularThisWeek(),
        homeAPI.getRecommended(),
        homeAPI.getRecentlyCatalogued(8),
      ];
      if (user?.id) {
        promises.push(homeAPI.getContinueReading());
      }

      const results = await Promise.allSettled(promises);

      const [featuredRes, popularRes, recRes, recentRes, continueRes] = results;

      const featuredList =
        featuredRes?.status === 'fulfilled' ? featuredRes.value || [] : [];
      const popularList =
        popularRes?.status === 'fulfilled' ? popularRes.value || [] : [];
      const recList =
        recRes?.status === 'fulfilled' ? recRes.value || [] : [];
      const recentList =
        recentRes?.status === 'fulfilled' ? recentRes.value || [] : [];
      const continueList =
        user?.id && continueRes?.status === 'fulfilled'
          ? continueRes.value || []
          : [];

      setFeatured(featuredList);
      setPopular(popularList);
      setRecommended(recList);
      setRecentlyAdded(recentList);
      setContinueReading(continueList);

      /* ✅ AUTO-REGISTER — sab books ka metadata cache karo */
      try {
        registerBooks?.([
          ...featuredList,
          ...popularList,
          ...recList,
          ...recentList,
          ...continueList,
        ]);
      } catch (e) {
        if (__DEV__) console.warn('registerBooks failed:', e?.message);
      }

      const allFailed = results.every(r => r.status === 'rejected');
      if (allFailed) {
        setError('Could not reach the server. Please try again.');
      }

      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    },
    [registerBooks, user?.id],
  );

  useEffect(() => {
    setContinueReading([]);
    fetchAll();
  }, [user?.id, fetchAll]);

  const onRefresh = () => fetchAll(true);

  /* ================================================================== */
  /*  Debounce search                                                   */
  /* ================================================================== */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchQuery]);

  /* ================================================================== */
  /*  Search API + auto-register search results                         */
  /* ================================================================== */
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      setSearching(false);
      setSearchError('');
      return;
    }

    let cancelled = false;
    const myId = ++searchRequestIdRef.current;

    (async () => {
      setSearching(true);
      setSearchError('');

      try {
        const res = await booksAPI.searchBooks({
          query: debouncedQuery,
          page: 1,
          limit: 30,
        });

        if (cancelled || myId !== searchRequestIdRef.current) return;
        const books = res.books || [];
        setSearchResults(books);

        /* Auto-register search results too */
        try {
          registerBooks?.(books);
        } catch {}
      } catch (e) {
        if (cancelled || myId !== searchRequestIdRef.current) return;
        setSearchError(
          e?.response?.data?.message || 'Search failed. Please try again.',
        );
        setSearchResults([]);
      } finally {
        if (cancelled || myId !== searchRequestIdRef.current) return;
        setSearching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, registerBooks]);

  /* ================================================================== */
  /*  CONTINUE READING (LOCAL + SERVER MERGE)                          */
  /* ================================================================== */
  const localContinueReading = useMemo(() => {
    try {
      return getContinueReadingBooks?.() || [];
    } catch {
      return [];
    }
  }, [getContinueReadingBooks]);

  const mergedContinueReading = useMemo(() => {
    if (!user) return [];
    const map = new Map();

    /* Local books — priority */
    localContinueReading.forEach(b => {
      if (b?.id) {
        map.set(String(b.id), {
          ...b,
          progress:
            b.progress ||
            readingProgress?.[b.id] ||
            readingProgress?.[String(b.id)] ||
            null,
        });
      }
    });

    /* Server books — only if not already added */
    continueReading.forEach(b => {
      if (!b?.id) return;
      const key = String(b.id);
      if (map.has(key)) return;

      const localProg =
        readingProgress?.[key] || readingProgress?.[b.id] || null;

      map.set(key, {
        ...b,
        progress: localProg || b.progress || null,
      });
    });

    return Array.from(map.values()).sort((a, b) => {
      const aTime = new Date(
        a.progress?.lastRead || a.progress?.lastReadAt || 0,
      ).getTime();
      const bTime = new Date(
        b.progress?.lastRead || b.progress?.lastReadAt || 0,
      ).getTime();
      return bTime - aTime;
    });
  }, [user, localContinueReading, continueReading, readingProgress]);

  const lastReadBook =
    mergedContinueReading.length > 0 ? mergedContinueReading[0] : null;

  const lastReadPercentage = useMemo(() => {
    if (!lastReadBook) return 0;
    const raw =
      lastReadBook.progress?.percentage ||
      lastReadBook.progress?.percent ||
      lastReadBook.progress?.progress ||
      0;
    const num = Number(raw);
    if (!Number.isFinite(num) || num <= 0) return 0;
    return Math.min(100, Math.max(2, Math.round(num)));
  }, [lastReadBook]);

  /* ================================================================== */
  /*  Random quote                                                      */
  /* ================================================================== */
  const randomQuote = useMemo(() => {
    if (!quotes || quotes.length === 0) {
      return {
        quote: 'The journey of a thousand miles begins with a single step.',
        author: 'Lao Tzu',
      };
    }
    return quotes[Math.floor(Math.random() * quotes.length)];
  }, []);

  /* ================================================================== */
  /*  Search handlers                                                   */
  /* ================================================================== */
  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSearchResults([]);
    setSearchError('');
    setSearchFocused(false);
    Keyboard.dismiss();
  };

  const handleSearchCancel = () => {
    clearSearch();
    searchInputRef.current?.blur();
  };

  /* ================================================================== */
  /*  Navigation handlers                                               */
  /* ================================================================== */
  const handleBookPress = book => {
    Keyboard.dismiss();
    navigation.navigate('BookDetails', { bookId: book.id, book });
  };

  const handleReadPress = book => {
    navigation.navigate('Reader', { bookId: book.id, book });
  };

  const handleCategoryPress = category => {
    navigation.navigate('CategoryDetail', {
      categoryId: category.id,
      categoryName: category.name,
      description: category.description,
      icon: category.icon,
    });
  };


  /* ================================================================== */
  /*  HOME CONTENT                                                      */
  /* ================================================================== */
  const renderHomeContent = () => (
    <>
      {/* HERO */}
      <View style={styles.heroCard}>
        <View style={styles.heroDecorCircle} />
        <View style={styles.heroBadgeRow}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>DIGITAL SANCTUARY</Text>
          </View>
          <Text style={styles.heroBadgeSecondary}>✦ Curated Editions</Text>
        </View>

        <Text style={styles.heroHeadline}>
          A World of Stories & Boundless Knowledge
        </Text>
        <Text style={styles.heroSupportText}>
          Immerse your intellect in ancient Vedic hymns, global philosophy, and
          contemporary frontiers of thought.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Explore')}
          style={styles.heroCtaButton}
        >
          <Text style={styles.heroCtaText}>Explore Stacks</Text>
          <Icon name="chevron-right" size={15} color={colors.primaryDark} />
        </TouchableOpacity>
      </View>

      {/* CONTINUE READING */}
      <View style={styles.sectionContainer}>
        <SectionHeader
          title="Continue Reading"
          subtitle="Pick up seamlessly where you left off"
          onSeeAllPress={
            mergedContinueReading.length > 0
              ? () => navigation.navigate('My Library')
              : undefined
          }
          seeAllText="All Reads"
        />

        {lastReadBook ? (
          <View style={styles.continueCard}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => handleBookPress(lastReadBook)}
              style={styles.continueCoverWrapper}
            >
              <Image
                source={{
                  uri: lastReadBook.coverImage || FALLBACK_COVER,
                }}
                style={styles.continueCover}
                resizeMode="cover"
              />
            </TouchableOpacity>

            <View style={styles.continueInfo}>
              <View style={styles.continueTagRow}>
                <Text style={styles.continueCategory} numberOfLines={1}>
                  {lastReadBook.category || 'General'}
                </Text>
                <Text style={styles.continueDot}>•</Text>
                <Text style={styles.continueProgressNum}>
                  {lastReadPercentage}% completed
                </Text>
              </View>

              <Text style={styles.continueTitle} numberOfLines={2}>
                {lastReadBook.title}
              </Text>
              <Text style={styles.continueAuthor} numberOfLines={1}>
                By {lastReadBook.author || 'Unknown'}
              </Text>

              <View style={styles.continueProgressBarBg}>
                <View
                  style={[
                    styles.continueProgressBarFill,
                    { width: `${lastReadPercentage}%` },
                  ]}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleReadPress(lastReadBook)}
                style={styles.resumeButton}
              >
                <Icon name="book-open" size={15} color={colors.white} />
                <Text style={styles.resumeButtonText}>
                  {lastReadPercentage > 0
                    ? 'Continue Reading'
                    : 'Start Reading'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.continueEmptyCard}>
            <View style={styles.emptyIconCircle}>
              <Icon name="book" size={26} color={colors.primary} />
            </View>
            <View style={styles.emptyTextCol}>
              <Text style={styles.emptyTitle}>Start Your First Reading</Text>
              <Text style={styles.emptyDesc}>
                Select any volume from our catalogue to track your daily
                progress and highlights.
              </Text>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => navigation.navigate('Explore')}
                style={styles.emptyStartButton}
              >
                <Text style={styles.emptyStartButtonText}>
                  Browse Catalogue →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* FEATURED */}
      {featured.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader
            title="Featured Masterpieces"
            subtitle="Curated foundational works of enduring wisdom"
            onSeeAllPress={() => navigation.navigate('Explore')}
          />
          <FlatList
            data={featured}
            keyExtractor={item => `featured-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollPadding}
            renderItem={({ item }) => (
              <BookCard
                book={item}
                variant="vertical"
                onPress={() => handleBookPress(item)}
              />
            )}
          />
        </View>
      )}

      {/* POPULAR */}
      {popular.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader
            title="Popular This Week"
            subtitle="Volumes most reviewed by our reading circle"
            onSeeAllPress={() => navigation.navigate('Explore')}
          />
          <FlatList
            data={popular}
            keyExtractor={item => `popular-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollPadding}
            renderItem={({ item }) => (
              <BookCard
                book={item}
                variant="vertical"
                onPress={() => handleBookPress(item)}
              />
            )}
          />
        </View>
      )}

      {/* CATEGORIES */}
      <View style={styles.sectionContainer}>
        <SectionHeader
          title="Browse by Discipline"
          subtitle="Explore across classical and contemporary domains"
          onSeeAllPress={() => navigation.navigate('Categories')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollPadding}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.75}
              onPress={() => handleCategoryPress(cat)}
              style={styles.categoryCard}
            >
              <View style={styles.categoryIconCircle}>
                <Icon name={cat.icon} size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <Text style={styles.categoryCount}>{cat.bookCount} Books</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* RECOMMENDED */}
      {recommended.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader
            title="Recommended for You"
            subtitle="Tailored to thoughtful and reflective readers"
            onSeeAllPress={() => navigation.navigate('Explore')}
          />
          <FlatList
            data={recommended}
            keyExtractor={item => `rec-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollPadding}
            renderItem={({ item }) => (
              <BookCard
                book={item}
                variant="vertical"
                onPress={() => handleBookPress(item)}
              />
            )}
          />
        </View>
      )}

      {/* QUOTE */}
      <View style={styles.quoteCard}>
        <View style={styles.quoteIconBadge}>
          <Icon name="star" size={20} color={colors.gold} />
        </View>
        <Text style={styles.quoteText}>"{randomQuote.quote}"</Text>
        <View style={styles.quoteDivider} />
        <Text style={styles.quoteAuthor}>— {randomQuote.author}</Text>
      </View>

      {/* RECENTLY CATALOGUED */}
      <View style={styles.sectionContainer}>
        <SectionHeader
          title="Recently Catalogued"
          subtitle="New additions to the VedBook digital shelves"
          onSeeAllPress={() => navigation.navigate('Explore')}
        />

        {loading ? (
          <Text style={styles.statusText}>Loading latest additions...</Text>
        ) : error && recentlyAdded.length === 0 ? (
          <TouchableOpacity
            onPress={() => fetchAll()}
            style={styles.retryInline}
          >
            <Text style={styles.retryInlineText}>
              Couldn't load books. Tap to retry.
            </Text>
          </TouchableOpacity>
        ) : recentlyAdded.length === 0 ? (
          <Text style={styles.statusText}>
            New books will appear here soon.
          </Text>
        ) : (
          <FlatList
            data={recentlyAdded}
            keyExtractor={item => `recent-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollPadding}
            renderItem={({ item }) => (
              <BookCard
                book={item}
                variant="vertical"
                onPress={() => handleBookPress(item)}
              />
            )}
          />
        )}
      </View>
    </>
  );

  /* ================================================================== */
  /*  MAIN RENDER                                                       */
  /* ================================================================== */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.ivory} />

      {/* HEADER */}
      <View
        style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}
      >
        <View style={styles.brandGroup}>
          <View style={styles.brandLogoCircle}>
            <Icon name="logo" size={26} color={colors.primary} />
          </View>
          <View style={styles.greetingContainer}>
            <Text style={styles.brandTitle}>VEDBOOK</Text>
            <Text style={styles.greetingName} numberOfLines={1}>
              {greeting},{' '}
              {user?.fullName?.split(' ')[0] ||
                user?.name?.split(' ')[0] ||
                'Seeker'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => navigation.navigate('Notifications')}
          style={styles.notificationButton}
          accessibilityLabel="Open Notifications"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="bell" size={21} color={colors.primary} />
          {unreadNotificationsCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBarWrapper}>
        <View
          style={[styles.searchBar, searchFocused && styles.searchBarFocused]}
        >
          <Icon name="search" size={18} color={colors.primary} />

          <TextInput
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search titles, authors, categories..."
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="never"
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={clearSearch}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {isSearchMode && (
          <TouchableOpacity
            onPress={handleSearchCancel}
            style={styles.cancelButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* BODY */}
      {isSearchMode ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item, idx) => `search-${item.id}-${idx}`}
          numColumns={2}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.searchScrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 70 },
          ]}
          columnWrapperStyle={
            searchResults.length > 0 ? styles.searchColumnWrapper : undefined
          }
          ListHeaderComponent={
            searchResults.length > 0 ? (
              <View style={styles.searchInfoRow}>
                <Text style={styles.searchInfoText}>
                  {searching
                    ? 'Searching...'
                    : `${searchResults.length} ${
                        searchResults.length === 1 ? 'result' : 'results'
                      } for "${debouncedQuery}"`}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            searching ? (
              <View style={styles.searchCenterBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.searchLoadingText}>
                  Searching for "{debouncedQuery}"...
                </Text>
              </View>
            ) : searchError ? (
              <View style={styles.searchCenterBox}>
                <View style={styles.searchStateIconCircle}>
                  <Icon name="alert-circle" size={24} color={colors.goldDark} />
                </View>
                <Text style={styles.searchStateTitle}>Search failed</Text>
                <Text style={styles.searchStateMsg}>{searchError}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setDebouncedQuery('');
                    setTimeout(() => setDebouncedQuery(searchQuery.trim()), 50);
                  }}
                  style={styles.searchRetryButton}
                >
                  <Text style={styles.searchRetryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : debouncedQuery ? (
              <View style={styles.searchCenterBox}>
                <View style={styles.searchStateIconCircle}>
                  <Icon name="search" size={24} color={colors.primary} />
                </View>
                <Text style={styles.searchStateTitle}>No results found</Text>
                <Text style={styles.searchStateMsg}>
                  We couldn't find any books matching "{debouncedQuery}". Try a
                  different keyword or check the spelling.
                </Text>
                <TouchableOpacity
                  onPress={clearSearch}
                  style={styles.searchRetryButton}
                >
                  <Text style={styles.searchRetryText}>Clear Search</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.searchGridCard,
                { width: gridCardWidth, maxWidth: gridCardWidth },
              ]}
            >
              <BookCard
                book={item}
                variant="vertical"
                style={styles.gridBookCard}
                onPress={() => handleBookPress(item)}
              />
            </View>
          )}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 70 },
          ]}
        >
          {renderHomeContent()}
        </ScrollView>
      )}
    </View>
  );
};

/* ================================================================== */
/*  STYLES                                                            */
/* ================================================================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },

  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.ivory,
  },
  brandGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  brandLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  greetingContainer: { marginLeft: spacing.sm + 2, flex: 1 },
  brandTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.goldDark,
    letterSpacing: 1.5,
  },
  greetingName: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fontSerif,
    marginTop: 1,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    ...shadows.soft,
  },
  unreadBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.gold,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  unreadBadgeText: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '800',
  },

  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    ...shadows.soft,
  },
  searchBarFocused: { borderColor: colors.gold, borderWidth: 1.5 },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.primary,
    paddingVertical: 0,
  },
  cancelButton: { paddingLeft: spacing.md, paddingVertical: spacing.xs },
  cancelText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.goldDark,
  },

  scrollContent: { paddingTop: 0 },
  statusText: {
    paddingHorizontal: spacing.lg,
    color: colors.textSecondary,
    fontSize: 13,
  },
  retryInline: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  retryInlineText: { color: colors.goldDark, fontWeight: '600' },

  heroCard: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.primaryDark,
    ...shadows.hover,
  },
  heroDecorCircle: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(198, 164, 92, 0.18)',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  heroBadge: {
    backgroundColor: 'rgba(198, 164, 92, 0.22)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
    marginRight: spacing.sm,
  },
  heroBadgeText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroBadgeSecondary: {
    color: colors.goldLight,
    fontSize: 11,
    fontWeight: '600',
  },
  heroHeadline: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ivory,
    fontFamily: typography.fontSerif,
    lineHeight: 28,
    marginBottom: spacing.xs + 2,
  },
  heroSupportText: {
    fontSize: 13,
    color: colors.goldLight,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  heroCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    ...shadows.soft,
  },
  heroCtaText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
    marginRight: spacing.xs,
    letterSpacing: 0.3,
  },

  sectionContainer: { marginBottom: spacing.xs },
  horizontalScrollPadding: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
  },

  continueCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  continueCoverWrapper: {
    width: 86,
    height: 126,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.sage,
    borderWidth: 1,
    borderColor: colors.border,
  },
  continueCover: { width: '100%', height: '100%' },
  continueInfo: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'space-between',
  },
  continueTagRow: { flexDirection: 'row', alignItems: 'center' },
  continueCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  continueDot: { color: colors.textSecondary, marginHorizontal: spacing.xs },
  continueProgressNum: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.goldDark,
  },
  continueTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: typography.fontSerif,
    lineHeight: 20,
    marginTop: 2,
  },
  continueAuthor: { fontSize: 12, color: colors.textSecondary },
  continueProgressBarBg: {
    height: 6,
    backgroundColor: colors.sage,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  continueProgressBarFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 3,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  resumeButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: spacing.xs,
  },

  continueEmptyCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.soft,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.md,
  },
  emptyTextCol: { flex: 1 },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: typography.fontSerif,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: 2,
    marginBottom: spacing.xs + 2,
  },
  emptyStartButton: { alignSelf: 'flex-start' },
  emptyStartButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.goldDark,
  },

  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  categoryIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  categoryName: { fontSize: 13, fontWeight: '700', color: colors.primary },
  categoryCount: { fontSize: 11, color: colors.textSecondary },

  quoteCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  quoteIconBadge: { marginBottom: spacing.xs },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    fontFamily: typography.fontSerif,
  },
  quoteDivider: {
    width: 36,
    height: 2,
    backgroundColor: colors.gold,
    marginVertical: spacing.sm,
  },
  quoteAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.goldDark,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  searchInfoRow: {
    paddingHorizontal: 0,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchInfoText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  searchScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  searchColumnWrapper: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  searchGridCard: {
    alignItems: 'center',
  },
  gridBookCard: {
    width: '100%',
    marginRight: 0,
    marginBottom: 0,
  },
  searchCenterBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
  },
  searchLoadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 13,
  },
  searchStateIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  searchStateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fontSerif,
    marginBottom: 4,
  },
  searchStateMsg: {
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  searchRetryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  searchRetryText: {
    color: colors.ivory,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.4,
  },
});

export default HomeScreen;
