// ReaderScreen.js

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';

import Pdf from 'react-native-pdf';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, borderRadius, typography } from '../../theme';

import { Icon } from '../../components/common/Icon';
import { useLibrary } from '../../context/LibraryContext';
import { booksAPI } from '../../api/booksApi';

/* ================================================================== */
/*  Module-level cache                                                */
/* ================================================================== */
const readerCache = new Map();
const inflightFetches = new Map();
const progressThrottle = new Map();
const pdfLoadedCache = new Set();

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ================================================================== */
/*  Themes                                                            */
/* ================================================================== */
const THEMES = [
  {
    id: 'ivory',
    name: 'Warm Ivory',
    bg: '#FAF7F0',
    paper: '#FFFFFF',
    text: '#173F35',
    textSoft: '#5C7A72',
    border: '#E7E1D5',
    pdfBg: '#E8E2D6',
    accent: '#C6A45C',
    accentSoft: 'rgba(198, 164, 92, 0.12)',
    topBarBg: 'rgba(250, 247, 240, 0.96)',
  },
  {
    id: 'sepia',
    name: 'Soft Cream',
    bg: '#F2EEE5',
    paper: '#FBF6EA',
    text: '#2A2318',
    textSoft: '#6E6354',
    border: '#DED7C8',
    pdfBg: '#DED7C8',
    accent: '#B8935A',
    accentSoft: 'rgba(184, 147, 90, 0.14)',
    topBarBg: 'rgba(242, 238, 229, 0.96)',
  },
  {
    id: 'dark',
    name: 'Night Sanctuary',
    bg: '#102F28',
    paper: '#1A3A32',
    text: '#FAF7F0',
    textSoft: 'rgba(250, 247, 240, 0.7)',
    border: '#1C4A3E',
    pdfBg: '#0A1F1A',
    accent: '#D4B26A',
    accentSoft: 'rgba(212, 178, 106, 0.16)',
    topBarBg: 'rgba(16, 47, 40, 0.96)',
  },
];

/* ================================================================== */
/*  Reader Screen                                                     */
/* ================================================================== */
export const ReaderScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { bookId, book: passedBook } = route.params || {};

  const {
    readingProgress,
    updateReadingProgress,
    isBookmarked,
    toggleBookmark,
  } = useLibrary();

  /* ================= STATE ================= */
  const [book, setBook] = useState(() => {
    const cached = readerCache.get(bookId);
    return cached?.book || passedBook || null;
  });

  const [content, setContent] = useState(() => {
    const cached = readerCache.get(bookId);
    return cached?.content || null;
  });

  const [loading, setLoading] = useState(() => !readerCache.has(bookId));
  const [error, setError] = useState('');

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const [pdfPage, setPdfPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(0);
  const [pdfError, setPdfError] = useState('');
  const [pdfReloadKey, setPdfReloadKey] = useState(0);
  const [pdfHeaders, setPdfHeaders] = useState({});

  const [viewMode, setViewMode] = useState('scroll');
  const [fitMode, setFitMode] = useState('width');

  const [fontSizeLevel, setFontSizeLevel] = useState(1);
  const [activeThemeId, setActiveThemeId] = useState('ivory');
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  /* ================= REFS ================= */
  const mountedRef = useRef(true);
  const scrollRef = useRef(null);
  const horizontalScrollRef = useRef(null);
  const pdfRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const bookRef = useRef(book);
  const readingProgressRef = useRef(readingProgress);
  const updateProgressRef = useRef(updateReadingProgress);

  const pdfInitialPageRef = useRef(1);
  const pdfTotalPagesRef = useRef(0);
  const pdfPageTimerRef = useRef(null);
  const pdfPendingPageRef = useRef(1);

  const controlsAnim = useRef(new Animated.Value(1)).current;
  const pillAnim = useRef(new Animated.Value(0)).current;

  /* ================= Sync refs ================= */
  useEffect(() => {
    bookRef.current = book;
  }, [book]);

  useEffect(() => {
    readingProgressRef.current = readingProgress;
  }, [readingProgress]);

  useEffect(() => {
    updateProgressRef.current = updateReadingProgress;
  }, [updateReadingProgress]);

  useEffect(() => {
    pdfTotalPagesRef.current = pdfTotalPages;
  }, [pdfTotalPages]);

  /* Mount/unmount */
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pdfPageTimerRef.current) clearTimeout(pdfPageTimerRef.current);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

      const b = bookRef.current;
      if (b?.id && pdfPendingPageRef.current && pdfTotalPagesRef.current > 0) {
        try {
          updateProgressRef.current?.(
            b.id,
            pdfPendingPageRef.current,
            pdfTotalPagesRef.current,
          );
        } catch {}
      }
    };
  }, []);

  const currentTheme = useMemo(
    () => THEMES.find(t => t.id === activeThemeId) || THEMES[0],
    [activeThemeId],
  );

  const bookmarked = book ? isBookmarked?.(book.id) : false;

  /* ================= AUTH HEADERS ================= */
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem('ved_user_token')
      .then(token => {
        if (active && token)
          setPdfHeaders({ Authorization: `Bearer ${token}` });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  /* ================= CONTROLS ANIMATION ================= */
  useEffect(() => {
    Animated.timing(controlsAnim, {
      toValue: controlsVisible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();

    Animated.timing(pillAnim, {
      toValue: controlsVisible ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [controlsVisible, controlsAnim, pillAnim]);

  /* ================= AUTO-HIDE ================= */
  const scheduleHideControls = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) setControlsVisible(false);
    }, 5000);
  }, []);

  useEffect(() => {
    if (controlsVisible) scheduleHideControls();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [controlsVisible, scheduleHideControls]);

  const toggleControls = useCallback(() => {
    setControlsVisible(v => {
      if (!v) scheduleHideControls();
      return !v;
    });
  }, [scheduleHideControls]);

  /* ================= PROGRESS SAVE ================= */
  const saveProgress = useCallback((bId, page, total) => {
    if (!bId || !page) return;
    const now = Date.now();
    const last = progressThrottle.get(bId);
    if (last && last.page === page) return;
    if (last && now - last.time < 2500) return;
    progressThrottle.set(bId, { page, time: now });
    try {
      updateProgressRef.current?.(bId, page, total);
    } catch {}
  }, []);

  /* ================= FETCH ================= */
  const fetchReaderData = useCallback(
    async (forceRefresh = false) => {
      if (!bookId) {
        setError('Book ID missing.');
        setLoading(false);
        return;
      }

      /* Cache hit */
      if (!forceRefresh) {
        const cached = readerCache.get(bookId);
        if (cached) {
          if (!mountedRef.current) return;
          setBook(cached.book);
          setContent(cached.content);
          setLoading(false);
          const savedPage =
            readingProgressRef.current?.[bookId]?.currentPage || 1;
          if (cached.content?.type === 'pdf') {
            pdfInitialPageRef.current = Math.max(1, Number(savedPage) || 1);
            setPdfPage(pdfInitialPageRef.current);
          } else if (cached.content?.type === 'text') {
            const total = cached.content.pages?.length || 1;
            setCurrentPageIndex(
              Math.min(Math.max(Number(savedPage) - 1, 0), total - 1),
            );
          }
          return;
        }
      }

      /* In-flight */
      if (!forceRefresh && inflightFetches.has(bookId)) {
        try {
          const result = await inflightFetches.get(bookId);
          if (!mountedRef.current || !result) return;
          setBook(result.book);
          setContent(result.content);
          setLoading(false);
          const savedPage =
            readingProgressRef.current?.[bookId]?.currentPage || 1;
          if (result.content?.type === 'pdf') {
            pdfInitialPageRef.current = Math.max(1, Number(savedPage) || 1);
            setPdfPage(pdfInitialPageRef.current);
          } else if (result.content?.type === 'text') {
            const total = result.content.pages?.length || 1;
            setCurrentPageIndex(
              Math.min(Math.max(Number(savedPage) - 1, 0), total - 1),
            );
          }
        } catch {}
        return;
      }

      if (mountedRef.current) {
        setLoading(true);
        setError('');
        setPdfError('');
      }

      const fetchPromise = (async () => {
        let bookData = passedBook || bookRef.current;
        if (!bookData || forceRefresh) {
          bookData = await booksAPI.getBookById(bookId);
          if (!bookData) throw new Error('Book not found.');
        }
        const contentData = await booksAPI.getBookContent(bookId, bookData);
        if (!contentData || contentData.type === 'none') {
          throw new Error('Content for this book is currently unavailable.');
        }
        if (contentData.type === 'pdf' && !contentData.url) {
          throw new Error('The PDF document could not be located.');
        }
        return { book: bookData, content: contentData };
      })();

      inflightFetches.set(bookId, fetchPromise);

      try {
        const result = await fetchPromise;
        readerCache.set(bookId, {
          book: result.book,
          content: result.content,
          timestamp: Date.now(),
        });
        if (!mountedRef.current) return;
        setBook(result.book);
        bookRef.current = result.book;
        setContent(result.content);
        const savedPage =
          readingProgressRef.current?.[bookId]?.currentPage || 1;
        if (result.content.type === 'pdf') {
          pdfInitialPageRef.current = Math.max(1, Number(savedPage) || 1);
          setPdfPage(pdfInitialPageRef.current);
        } else if (result.content.type === 'text') {
          const total = result.content.pages?.length || 1;
          setCurrentPageIndex(
            Math.min(Math.max(Number(savedPage) - 1, 0), total - 1),
          );
        }
      } catch (e) {
        if (!mountedRef.current) return;
        setError(
          e?.response?.data?.message ||
            e?.message ||
            'Unable to load book. Please try again.',
        );
      } finally {
        inflightFetches.delete(bookId);
        if (mountedRef.current) setLoading(false);
      }
    },
    [bookId, passedBook],
  );

  useEffect(() => {
    fetchReaderData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  /* Text progress */
  useEffect(() => {
    if (!book?.id || content?.type !== 'text') return;
    const total = content.pages?.length || 1;
    saveProgress(book.id, currentPageIndex + 1, total);
  }, [currentPageIndex, content, book?.id, saveProgress]);

  /* ================= DERIVED ================= */
  const pages = useMemo(
    () => (content?.type === 'text' ? content.pages || [] : []),
    [content],
  );
  const totalPages = pages.length;

  const currentPageData = useMemo(() => {
    if (content?.type !== 'text') return null;
    return pages[currentPageIndex] || { chapter: 'Chapter', text: '' };
  }, [content, pages, currentPageIndex]);

  const progressPct =
    totalPages > 0 ? ((currentPageIndex + 1) / totalPages) * 100 : 0;
  const pdfProgressPct =
    pdfTotalPages > 0 ? (pdfPage / pdfTotalPages) * 100 : 0;

  const getFontSize = () =>
    fontSizeLevel === 0 ? 15 : fontSizeLevel === 2 ? 20 : 17;
  const getLineHeight = () =>
    fontSizeLevel === 0 ? 25 : fontSizeLevel === 2 ? 33 : 28;

  /* ================= TEXT NAV ================= */
  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo?.({ y: 0, animated: false });
  }, []);

  const goToPage = useCallback(
    nextIndex => {
      if (nextIndex < 0 || nextIndex >= totalPages) return;
      setCurrentPageIndex(nextIndex);
      scrollToTop();
      horizontalScrollRef.current?.scrollTo?.({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
    },
    [totalPages, scrollToTop],
  );

  const handleNext = () => goToPage(currentPageIndex + 1);
  const handlePrev = () => goToPage(currentPageIndex - 1);

  const onMomentumEnd = event => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / SCREEN_WIDTH);
    if (index !== currentPageIndex && index >= 0 && index < totalPages) {
      setCurrentPageIndex(index);
      scrollToTop();
    }
  };

  /* ================= PDF CALLBACKS ================= */
  const handlePdfLoadComplete = useCallback(
    numberOfPages => {
      if (!mountedRef.current) return;
      pdfLoadedCache.add(bookId);
      setPdfTotalPages(numberOfPages);
      pdfTotalPagesRef.current = numberOfPages;
      setPdfError('');
      if (pdfInitialPageRef.current > numberOfPages) {
        pdfInitialPageRef.current = numberOfPages;
        setPdfReloadKey(k => k + 1);
      }
      if (__DEV__) console.log('📄 PDF loaded:', numberOfPages, 'pages');
    },
    [bookId],
  );

  const handlePdfPageChanged = useCallback(
    (page, numberOfPages) => {
      if (!mountedRef.current) return;

      pdfPendingPageRef.current = page;

      const b = bookRef.current;
      if (b?.id && numberOfPages) {
        saveProgress(b.id, page, numberOfPages);
      }

      if (pdfPageTimerRef.current) {
        clearTimeout(pdfPageTimerRef.current);
      }
      pdfPageTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        const pending = pdfPendingPageRef.current;
        setPdfPage(prev => (prev === pending ? prev : pending));
      }, 350);

      if (numberOfPages && numberOfPages !== pdfTotalPagesRef.current) {
        pdfTotalPagesRef.current = numberOfPages;
        setPdfTotalPages(numberOfPages);
      }
    },
    [saveProgress],
  );

  const handlePdfError = useCallback(pdfLoadError => {
    if (!mountedRef.current) return;
    if (__DEV__) console.warn('PDF load error:', pdfLoadError);
    setPdfError('Unable to load the PDF document. Please try again.');
  }, []);

  const retryPdf = () => {
    pdfLoadedCache.delete(bookId);
    setPdfError('');
    setPdfReloadKey(k => k + 1);
  };

  const handleViewModeChange = useCallback(
    newMode => {
      if (newMode === viewMode) return;
      pdfInitialPageRef.current = pdfPendingPageRef.current || pdfPage;
      setViewMode(newMode);
    },
    [viewMode, pdfPage],
  );

  const handleFitModeChange = useCallback(
    newFit => {
      if (newFit === fitMode) return;
      pdfInitialPageRef.current = pdfPendingPageRef.current || pdfPage;
      setFitMode(newFit);
    },
    [fitMode, pdfPage],
  );

  const handleToggleBookmark = async () => {
    if (!book?.id) return;
    try {
      toggleBookmark?.(book.id);
    } catch {}
  };

  const handleForceRefresh = () => {
    readerCache.delete(bookId);
    progressThrottle.delete(bookId);
    inflightFetches.delete(bookId);
    pdfLoadedCache.delete(bookId);
    fetchReaderData(true);
  };

  /* ================================================================== */
  /*  INITIAL LOADING — No spinner, just background + top bar          */
  /* ================================================================== */
  if (loading && !content) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.bg }]}>
        <StatusBar
          barStyle={activeThemeId === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={currentTheme.bg}
        />
        <View
          style={[
            styles.topBar,
            {
              paddingTop: Math.max(insets.top, 14),
              backgroundColor: currentTheme.topBarBg,
              borderBottomColor: currentTheme.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.iconButton,
              {
                borderColor: currentTheme.border,
                backgroundColor: currentTheme.bg,
              },
            ]}
          >
            <Icon name="arrow-left" size={20} color={currentTheme.text} />
          </TouchableOpacity>
          <View style={styles.topBarTitleContainer}>
            <Text
              style={[styles.topBarTitle, { color: currentTheme.text }]}
              numberOfLines={1}
            >
              {book?.title || 'Reader'}
            </Text>
            <View style={styles.topBarSubtitleRow}>
              <View
                style={[
                  styles.topBarDot,
                  { backgroundColor: currentTheme.accent },
                ]}
              />
              <Text
                style={[
                  styles.topBarSubtitle,
                  { color: currentTheme.textSoft },
                ]}
              >
                Opening...
              </Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1 }} />
      </View>
    );
  }

  /* ================================================================== */
  /*  ERROR                                                             */
  /* ================================================================== */
  if (!content) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.bg }]}>
        <StatusBar barStyle="dark-content" backgroundColor={currentTheme.bg} />
        <View
          style={[
            styles.topBar,
            {
              paddingTop: Math.max(insets.top, 14),
              backgroundColor: currentTheme.bg,
              borderBottomColor: currentTheme.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.iconButton, { borderColor: currentTheme.border }]}
          >
            <Icon name="arrow-left" size={20} color={currentTheme.text} />
          </TouchableOpacity>
          <Text
            style={[
              styles.topBarTitle,
              { color: currentTheme.text, flex: 1, textAlign: 'center' },
            ]}
          >
            Reader
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerBox}>
          <View style={styles.stateIconCircle}>
            <Icon name="alert-circle" size={26} color={colors.goldDark} />
          </View>
          <Text style={styles.stateTitle}>Unable to open</Text>
          <Text style={styles.stateMsg}>
            {error || 'No readable content available.'}
          </Text>
          <TouchableOpacity
            onPress={handleForceRefresh}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ================================================================== */
  /*  PDF MODE                                                          */
  /* ================================================================== */
  if (content.type === 'pdf') {
    const isPageMode = viewMode === 'page';

    return (
      <View style={[styles.container, { backgroundColor: currentTheme.pdfBg }]}>
        <StatusBar
          barStyle={activeThemeId === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={currentTheme.topBarBg}
        />

        {/* TOP BAR */}
        <Animated.View
          pointerEvents={controlsVisible ? 'auto' : 'none'}
          style={[
            styles.topBar,
            {
              paddingTop: Math.max(insets.top, 14),
              backgroundColor: currentTheme.topBarBg,
              borderBottomColor: currentTheme.border,
              opacity: controlsAnim,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={[
              styles.iconButton,
              {
                borderColor: currentTheme.border,
                backgroundColor: currentTheme.bg,
              },
            ]}
          >
            <Icon name="arrow-left" size={20} color={currentTheme.text} />
          </TouchableOpacity>
          <View style={styles.topBarTitleContainer}>
            <Text
              style={[styles.topBarTitle, { color: currentTheme.text }]}
              numberOfLines={1}
            >
              {book?.title || 'Reader'}
            </Text>
            <View style={styles.topBarSubtitleRow}>
              <View
                style={[
                  styles.topBarDot,
                  { backgroundColor: currentTheme.accent },
                ]}
              />
              <Text
                style={[
                  styles.topBarSubtitle,
                  { color: currentTheme.textSoft },
                ]}
                numberOfLines={1}
              >
                {book?.author ? `By ${book.author}` : 'PDF Edition'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleToggleBookmark}
            style={[
              styles.iconButton,
              {
                backgroundColor: bookmarked
                  ? currentTheme.accentSoft
                  : currentTheme.bg,
                borderColor: bookmarked
                  ? currentTheme.accent
                  : currentTheme.border,
              },
            ]}
          >
            <Icon
              name={bookmarked ? 'bookmark-filled' : 'bookmark'}
              size={18}
              color={bookmarked ? currentTheme.accent : currentTheme.text}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* PDF STAGE — no loading overlay */}
        <View style={styles.pdfStage}>
          {!pdfError && (
            <Pdf
              key={`${content.url}-${pdfReloadKey}`}
              ref={pdfRef}
              source={{
                uri: content.url,
                cache: true,
                headers: pdfHeaders,
              }}
              page={pdfInitialPageRef.current}
              scale={1.0}
              minScale={0.5}
              maxScale={4.0}
              horizontal={isPageMode}
              enablePaging={isPageMode}
              spacing={10}
              fitPolicy={fitMode === 'height' ? 1 : 0}
              trustAllCerts={false}
              style={styles.pdf}
              onLoadComplete={handlePdfLoadComplete}
              onPageChanged={handlePdfPageChanged}
              onError={handlePdfError}
            />
          )}

          {Boolean(pdfError) && (
            <View style={styles.pdfErrorBox}>
              <View style={styles.stateIconCircle}>
                <Icon name="alert-circle" size={26} color={colors.goldDark} />
              </View>
              <Text style={styles.stateTitle}>PDF Failed to Load</Text>
              <Text style={styles.stateMsg}>{pdfError}</Text>
              <TouchableOpacity onPress={retryPdf} style={styles.retryButton}>
                <Text style={styles.retryText}>Retry PDF</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* BOTTOM DOCK */}
        <Animated.View
          pointerEvents={controlsVisible && !pdfError ? 'auto' : 'none'}
          style={[
            styles.pdfBottomDock,
            {
              paddingBottom: Math.max(insets.bottom, 14),
              backgroundColor: currentTheme.topBarBg,
              borderTopColor: currentTheme.border,
              opacity: controlsAnim,
            },
          ]}
        >
          <View style={styles.pdfProgressRow}>
            <View
              style={[
                styles.pdfProgressTrack,
                { backgroundColor: currentTheme.accentSoft },
              ]}
            >
              <View
                style={[
                  styles.pdfProgressFill,
                  {
                    width: `${pdfProgressPct}%`,
                    backgroundColor: currentTheme.accent,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.pdfBottomRow}>
            <View
              style={[
                styles.pdfPageBadge,
                { backgroundColor: currentTheme.accentSoft },
              ]}
            >
              <Text
                style={[styles.pdfPageBadgeText, { color: currentTheme.text }]}
              >
                {pdfTotalPages > 0 ? `${pdfPage} / ${pdfTotalPages}` : '— / —'}
              </Text>
            </View>

            <View style={styles.pdfModesRight}>
              <View
                style={[
                  styles.segmentedControl,
                  {
                    borderColor: currentTheme.border,
                    backgroundColor: currentTheme.bg,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleViewModeChange('scroll')}
                  style={[
                    styles.segmentButton,
                    viewMode === 'scroll' && {
                      backgroundColor: currentTheme.accentSoft,
                    },
                  ]}
                >
                  <Icon
                    name="menu"
                    size={12}
                    color={
                      viewMode === 'scroll'
                        ? currentTheme.accent
                        : currentTheme.textSoft
                    }
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color:
                          viewMode === 'scroll'
                            ? currentTheme.accent
                            : currentTheme.textSoft,
                      },
                    ]}
                  >
                    Scroll
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleViewModeChange('page')}
                  style={[
                    styles.segmentButton,
                    viewMode === 'page' && {
                      backgroundColor: currentTheme.accentSoft,
                    },
                  ]}
                >
                  <Icon
                    name="book"
                    size={12}
                    color={
                      viewMode === 'page'
                        ? currentTheme.accent
                        : currentTheme.textSoft
                    }
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color:
                          viewMode === 'page'
                            ? currentTheme.accent
                            : currentTheme.textSoft,
                      },
                    ]}
                  >
                    Page
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.segmentedControl,
                  {
                    borderColor: currentTheme.border,
                    backgroundColor: currentTheme.bg,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleFitModeChange('width')}
                  style={[
                    styles.segmentButtonSmall,
                    fitMode === 'width' && {
                      backgroundColor: currentTheme.accentSoft,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentTextSmall,
                      {
                        color:
                          fitMode === 'width'
                            ? currentTheme.accent
                            : currentTheme.textSoft,
                      },
                    ]}
                  >
                    Fit W
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleFitModeChange('height')}
                  style={[
                    styles.segmentButtonSmall,
                    fitMode === 'height' && {
                      backgroundColor: currentTheme.accentSoft,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentTextSmall,
                      {
                        color:
                          fitMode === 'height'
                            ? currentTheme.accent
                            : currentTheme.textSoft,
                      },
                    ]}
                  >
                    Fit H
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* FLOATING PILL */}
        <Animated.View
          pointerEvents={!controlsVisible ? 'auto' : 'none'}
          style={[
            styles.floatingPillWrapper,
            {
              bottom: Math.max(insets.bottom, 12) + 10,
              opacity: pillAnim,
              transform: [
                {
                  scale: pillAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.85, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            onPress={toggleControls}
            activeOpacity={0.85}
            style={[
              styles.floatingPill,
              { backgroundColor: currentTheme.text },
            ]}
          >
            <Icon name="chevron-up" size={14} color={currentTheme.bg} />
            <Text style={[styles.floatingPillText, { color: currentTheme.bg }]}>
              {pdfTotalPages > 0 ? `${pdfPage} / ${pdfTotalPages}` : 'Show'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  /* ================================================================== */
  /*  TEXT MODE                                                         */
  /* ================================================================== */
  return (
    <View style={[styles.container, { backgroundColor: currentTheme.bg }]}>
      <StatusBar
        barStyle={activeThemeId === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={currentTheme.bg}
      />

      {/* TOP BAR */}
      <Animated.View
        pointerEvents={controlsVisible ? 'auto' : 'none'}
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, 14),
            backgroundColor: currentTheme.topBarBg,
            borderBottomColor: currentTheme.border,
            opacity: controlsAnim,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={[
            styles.iconButton,
            {
              borderColor: currentTheme.border,
              backgroundColor: currentTheme.bg,
            },
          ]}
        >
          <Icon name="arrow-left" size={20} color={currentTheme.text} />
        </TouchableOpacity>

        <View style={styles.topBarTitleContainer}>
          <Text
            style={[styles.topBarTitle, { color: currentTheme.text }]}
            numberOfLines={1}
          >
            {book?.title || 'Reader'}
          </Text>
          <View style={styles.topBarSubtitleRow}>
            <View
              style={[
                styles.topBarDot,
                { backgroundColor: currentTheme.accent },
              ]}
            />
            <Text
              style={[styles.topBarSubtitle, { color: currentTheme.textSoft }]}
              numberOfLines={1}
            >
              {currentPageData?.chapter || ''}
            </Text>
          </View>
        </View>

        <View style={styles.topRightActions}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowSettingsModal(v => !v)}
            style={[
              styles.iconButton,
              {
                borderColor: currentTheme.border,
                backgroundColor: currentTheme.bg,
                marginRight: 6,
              },
            ]}
          >
            <Icon name="font-size" size={17} color={currentTheme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleToggleBookmark}
            style={[
              styles.iconButton,
              {
                backgroundColor: bookmarked
                  ? currentTheme.accentSoft
                  : currentTheme.bg,
                borderColor: bookmarked
                  ? currentTheme.accent
                  : currentTheme.border,
              },
            ]}
          >
            <Icon
              name={bookmarked ? 'bookmark-filled' : 'bookmark'}
              size={18}
              color={bookmarked ? currentTheme.accent : currentTheme.text}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* HORIZONTAL PAGER */}
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentOffset={{ x: currentPageIndex * SCREEN_WIDTH, y: 0 }}
      >
        {pages.map((page, index) => (
          <View key={`page-${index}`} style={{ width: SCREEN_WIDTH, flex: 1 }}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={toggleControls}
              style={{ flex: 1 }}
            >
              <ScrollView
                ref={index === currentPageIndex ? scrollRef : null}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.scrollContent,
                  {
                    paddingTop: controlsVisible
                      ? spacing.xl
                      : Math.max(insets.top, 40),
                    paddingBottom: controlsVisible
                      ? 160
                      : Math.max(insets.bottom, 40) + 60,
                  },
                ]}
              >
                <View style={styles.chapterHeader}>
                  <Text
                    style={[
                      styles.chapterOverline,
                      { color: currentTheme.accent },
                    ]}
                  >
                    {page.chapter}
                  </Text>
                  <View style={[styles.ornamentRow]}>
                    <View
                      style={[
                        styles.ornamentLine,
                        { backgroundColor: currentTheme.accent },
                      ]}
                    />
                    <View
                      style={[
                        styles.ornamentDiamond,
                        { backgroundColor: currentTheme.accent },
                      ]}
                    />
                    <View
                      style={[
                        styles.ornamentLine,
                        { backgroundColor: currentTheme.accent },
                      ]}
                    />
                  </View>
                </View>

                <Text
                  style={[
                    styles.readingText,
                    {
                      color: currentTheme.text,
                      fontSize: getFontSize(),
                      lineHeight: getLineHeight(),
                    },
                  ]}
                >
                  {page.text}
                </Text>

                {index === pages.length - 1 && (
                  <View style={styles.endOfBook}>
                    <View style={styles.endOrnament}>
                      <View
                        style={[
                          styles.ornamentLine,
                          { backgroundColor: currentTheme.accent },
                        ]}
                      />
                      <Icon name="star" size={12} color={currentTheme.accent} />
                      <View
                        style={[
                          styles.ornamentLine,
                          { backgroundColor: currentTheme.accent },
                        ]}
                      />
                    </View>
                    <Text
                      style={[styles.endText, { color: currentTheme.text }]}
                    >
                      End of Book
                    </Text>
                    <Text
                      style={[styles.endSub, { color: currentTheme.textSoft }]}
                    >
                      Thank you for reading
                    </Text>
                  </View>
                )}
              </ScrollView>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* SETTINGS */}
      {showSettingsModal && controlsVisible && (
        <Animated.View
          style={[
            styles.settingsPanel,
            {
              backgroundColor: currentTheme.bg,
              borderColor: currentTheme.border,
              opacity: controlsAnim,
            },
          ]}
        >
          <View style={styles.settingsRow}>
            <Text style={[styles.settingsLabel, { color: currentTheme.text }]}>
              Type Size
            </Text>
            <View style={styles.fontControlsRow}>
              <TouchableOpacity
                onPress={() => setFontSizeLevel(v => Math.max(0, v - 1))}
                style={[
                  styles.fontButton,
                  { borderColor: currentTheme.border },
                ]}
              >
                <Text
                  style={[styles.fontButtonText, { color: currentTheme.text }]}
                >
                  A-
                </Text>
              </TouchableOpacity>
              <Text
                style={[styles.fontSizeLabel, { color: currentTheme.text }]}
              >
                {fontSizeLevel === 0
                  ? 'Small'
                  : fontSizeLevel === 1
                  ? 'Standard'
                  : 'Large'}
              </Text>
              <TouchableOpacity
                onPress={() => setFontSizeLevel(v => Math.min(2, v + 1))}
                style={[
                  styles.fontButton,
                  { borderColor: currentTheme.border },
                ]}
              >
                <Text
                  style={[styles.fontButtonText, { color: currentTheme.text }]}
                >
                  A+
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={[
              styles.settingsDivider,
              { backgroundColor: currentTheme.border },
            ]}
          />

          <View style={styles.settingsRow}>
            <Text style={[styles.settingsLabel, { color: currentTheme.text }]}>
              Theme
            </Text>
            <View style={styles.themeOptionsRow}>
              {THEMES.map(theme => {
                const selected = activeThemeId === theme.id;
                return (
                  <TouchableOpacity
                    key={theme.id}
                    onPress={() => setActiveThemeId(theme.id)}
                    style={[
                      styles.themePill,
                      {
                        backgroundColor: theme.bg,
                        borderColor: selected ? theme.accent : theme.border,
                      },
                      selected && styles.themePillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.themePillText,
                        { color: theme.text },
                        selected && { fontWeight: '800' },
                      ]}
                    >
                      {theme.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>
      )}

      {/* BOTTOM DOCK */}
      <Animated.View
        pointerEvents={controlsVisible ? 'auto' : 'none'}
        style={[
          styles.bottomDock,
          {
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: currentTheme.topBarBg,
            borderTopColor: currentTheme.border,
            opacity: controlsAnim,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handlePrev}
          disabled={currentPageIndex === 0}
          style={[
            styles.navPageButton,
            currentPageIndex === 0 && styles.navPageButtonDisabled,
          ]}
        >
          <Icon
            name="arrow-left"
            size={16}
            color={
              currentPageIndex === 0 ? colors.textMuted : currentTheme.text
            }
          />
          <Text
            style={[
              styles.navPageText,
              {
                color:
                  currentPageIndex === 0 ? colors.textMuted : currentTheme.text,
              },
            ]}
          >
            Prev
          </Text>
        </TouchableOpacity>

        <View style={styles.pageIndicatorContainer}>
          <View
            style={[
              styles.miniProgressBarBg,
              { backgroundColor: currentTheme.accentSoft },
            ]}
          >
            <View
              style={[
                styles.miniProgressBarFill,
                {
                  width: `${progressPct}%`,
                  backgroundColor: currentTheme.accent,
                },
              ]}
            />
          </View>
          <Text
            style={[styles.pageIndicatorText, { color: currentTheme.textSoft }]}
          >
            {currentPageIndex + 1} of {totalPages}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleNext}
          disabled={currentPageIndex === totalPages - 1}
          style={[
            styles.navPageButton,
            currentPageIndex === totalPages - 1 && styles.navPageButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.navPageText,
              {
                color:
                  currentPageIndex === totalPages - 1
                    ? colors.textMuted
                    : currentTheme.text,
              },
            ]}
          >
            Next
          </Text>
          <Icon
            name="chevron-right"
            size={16}
            color={
              currentPageIndex === totalPages - 1
                ? colors.textMuted
                : currentTheme.text
            }
          />
        </TouchableOpacity>
      </Animated.View>

      {/* FLOATING PILL */}
      <Animated.View
        pointerEvents={!controlsVisible ? 'auto' : 'none'}
        style={[
          styles.floatingPillWrapper,
          {
            bottom: Math.max(insets.bottom, 12) + 10,
            opacity: pillAnim,
            transform: [
              {
                scale: pillAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.85, 1],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={toggleControls}
          activeOpacity={0.85}
          style={[styles.floatingPill, { backgroundColor: currentTheme.text }]}
        >
          <Icon name="chevron-up" size={14} color={currentTheme.bg} />
          <Text style={[styles.floatingPillText, { color: currentTheme.bg }]}>
            {currentPageIndex + 1} / {totalPages}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

/* ================================================================== */
/*  STYLES                                                            */
/* ================================================================== */
const styles = StyleSheet.create({
  container: { flex: 1 },

  /* TOP BAR */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  topBarTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  topBarTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  topBarSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  topBarDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 6,
  },
  topBarSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  topRightActions: { flexDirection: 'row', alignItems: 'center' },

  /* TEXT CONTENT */
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    minHeight: '100%',
  },
  chapterHeader: {
    marginBottom: spacing.xxl,
    alignItems: 'center',
  },
  chapterOverline: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  ornamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.7,
  },
  ornamentLine: {
    width: 28,
    height: 1,
  },
  ornamentDiamond: {
    width: 5,
    height: 5,
    marginHorizontal: 8,
    transform: [{ rotate: '45deg' }],
  },
  readingText: {
    letterSpacing: 0.3,
    fontFamily: typography.fontSerif,
  },

  /* PDF */
  pdfStage: { flex: 1, position: 'relative', overflow: 'hidden' },
  pdf: { flex: 1, width: SCREEN_WIDTH, height: '100%' },

  pdfErrorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },

  pdfBottomDock: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  pdfProgressRow: {
    marginBottom: spacing.sm + 2,
  },
  pdfProgressTrack: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  pdfProgressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  pdfBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  pdfPageBadge: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: borderRadius.round,
  },
  pdfPageBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  pdfModesRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    justifyContent: 'flex-end',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: 2,
  },
  segmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  segmentButtonSmall: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
    letterSpacing: 0.2,
  },
  segmentTextSmall: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  /* FLOATING PILL */
  floatingPillWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.round,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  floatingPillText: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: spacing.xs + 2,
    letterSpacing: 0.4,
  },

  /* END OF BOOK */
  endOfBook: {
    alignItems: 'center',
    marginTop: spacing.xxxl + 20,
    marginBottom: spacing.xl,
  },
  endOrnament: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    opacity: 0.8,
  },
  endText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: typography.fontSerif,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  endSub: {
    fontSize: 11,
    fontStyle: 'italic',
    letterSpacing: 0.4,
  },

  /* SETTINGS */
  settingsPanel: {
    position: 'absolute',
    top: 95,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  settingsLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  settingsDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs + 2,
  },
  fontControlsRow: { flexDirection: 'row', alignItems: 'center' },
  fontButton: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fontButtonText: { fontSize: 12.5, fontWeight: '800' },
  fontSizeLabel: {
    marginHorizontal: spacing.md,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    minWidth: 60,
    textAlign: 'center',
  },
  themeOptionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  themePill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
  },
  themePillActive: {
    borderWidth: 2,
  },
  themePillText: { fontSize: 11, letterSpacing: 0.2 },

  /* BOTTOM DOCK (TEXT) */
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  navPageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    minWidth: 76,
  },
  navPageButtonDisabled: { opacity: 0.3 },
  navPageText: {
    fontSize: 12.5,
    fontWeight: '700',
    marginHorizontal: 4,
    letterSpacing: 0.2,
  },
  pageIndicatorContainer: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 140,
  },
  pageIndicatorText: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  miniProgressBarBg: {
    width: '100%',
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  miniProgressBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },

  /* STATES */
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 60,
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
    textAlign: 'center',
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

export default ReaderScreen;
