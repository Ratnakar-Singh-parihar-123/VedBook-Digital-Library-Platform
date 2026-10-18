import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from '../../theme';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { EmptyState } from '../../components/common/EmptyState';
import { useLibrary } from '../../context/LibraryContext';
import { notificationsAPI } from '../../api/notificationsApi';

export const NotificationsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    markNotificationAsRead: contextMarkRead,
    markAllNotificationsAsRead: contextMarkAllRead,
    notifications: cachedNotifs,
  } = useLibrary();

  //---------------- STATE ----------------//
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const requestIdRef = useRef(0);

  //---------------- FETCH ----------------//
  const fetchNotifications = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const myReqId = ++requestIdRef.current;

      try {
        const res = await notificationsAPI.getAll({ page: 1, limit: 50 });

        if (myReqId !== requestIdRef.current) return;

        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      } catch (e) {
        if (myReqId !== requestIdRef.current) return;
        if (cachedNotifs && cachedNotifs.length > 0) {
          setNotifications(cachedNotifs);
          setUnreadCount(cachedNotifs.filter(n => !n.isRead).length);
        } else {
          setError(
            e?.response?.data?.message ||
              'Could not load notifications. Please try again.',
          );
          setNotifications([]);
          setUnreadCount(0);
        }
      } finally {
        if (myReqId !== requestIdRef.current) return;
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [cachedNotifs],
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => fetchNotifications(true);

  //---------------- HANDLERS ----------------//

  //Tap a notification//
  const handleNotificationPress = async notif => {
    //Optimistic update//
    if (!notif.isRead) {
      setNotifications(prev =>
        prev.map(n => (n.id === notif.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      //Sync with context (bell badge)//
      try {
        contextMarkRead?.(notif.id);
      } catch {}

      //Sync with server//
      try {
        await notificationsAPI.markAsRead(notif.id);
      } catch {
        //Silent — optimistic already updated//
      }
    }

    //Navigate//
    if (notif.bookId) {
      navigation.navigate('BookDetails', { bookId: notif.bookId });
    } else if (notif.actionUrl) {
      // Deep link navigation if provided
    }
  };

  //Mark all as read//
  const handleMarkAllAsRead = async () => {
    if (markingAll || unreadCount === 0) return;

    //Optimistic update//
    const prevNotifications = notifications;
    const prevUnread = unreadCount;

    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    setMarkingAll(true);

    //Sync with context immediately//
    try {
      contextMarkAllRead?.();
    } catch {}

    try {
      await notificationsAPI.markAllAsRead();
    } catch (e) {
      //Rollback on error//
      setNotifications(prevNotifications);
      setUnreadCount(prevUnread);
      setError(
        e?.response?.data?.message ||
          'Failed to mark all as read. Please try again.',
      );
    } finally {
      setMarkingAll(false);
    }
  };

  //---------------- ICON ----------------//
  const getNotificationIcon = type => {
    switch (type) {
      case 'new_book':
      case 'newBook':
        return 'book';
      case 'reminder':
        return 'clock';
      case 'milestone':
      case 'achievement':
        return 'award';
      case 'update':
      default:
        return 'bell';
    }
  };

  //---------------- FORMAT DATE ----------------//
  const formatDate = iso => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';

      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  //---------------- RENDER ----------------//

  //Loading//
  if (loading && notifications.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.ivory} />
        <Header
          title="Notifications"
          showBack
          onBackPress={() => navigation.goBack()}
          border
        />
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  //Error//
  if (error && notifications.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.ivory} />
        <Header
          title="Notifications"
          showBack
          onBackPress={() => navigation.goBack()}
          border
        />
        <View style={styles.centerBox}>
          <View style={styles.stateIconCircle}>
            <Icon name="alert-circle" size={26} color={colors.goldDark} />
          </View>
          <Text style={styles.stateTitle}>Unable to load</Text>
          <Text style={styles.stateMsg}>{error}</Text>
          <TouchableOpacity
            onPress={() => fetchNotifications()}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  //Main//
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.ivory} />

      <Header
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread announcement${
                unreadCount === 1 ? '' : 's'
              }`
            : 'All caught up'
        }
        showBack
        onBackPress={() => navigation.goBack()}
        border
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleMarkAllAsRead}
              disabled={markingAll}
              style={styles.markAllButton}
            >
              {markingAll ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.markAllText}>Mark Read</Text>
              )}
            </TouchableOpacity>
          ) : null
        }
      />

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="bell"
            title="All Caught Up"
            message="You have read all library announcements and updates."
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleNotificationPress(item)}
            style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
          >
            <View
              style={[
                styles.iconBadge,
                !item.isRead ? styles.iconBadgeUnread : styles.iconBadgeRead,
              ]}
            >
              <Icon
                name={getNotificationIcon(item.type)}
                size={20}
                color={!item.isRead ? colors.primaryDark : colors.textSecondary}
              />
            </View>

            <View style={styles.cardContent}>
              <View style={styles.cardHeaderRow}>
                <Text
                  style={[
                    styles.cardTitle,
                    !item.isRead && styles.cardTitleUnread,
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {!item.isRead && <View style={styles.unreadDot} />}
              </View>

              <Text style={styles.cardMessage} numberOfLines={3}>
                {item.message}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>
                  {formatDate(item.createdAt)}
                </Text>
                {item.bookId ? (
                  <View style={styles.actionHint}>
                    <Text style={styles.actionHintText}>View</Text>
                    <Icon
                      name="chevron-right"
                      size={11}
                      color={colors.goldDark}
                    />
                  </View>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

//==================================================================//
// STYLES                                                         //
//==================================================================//
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },

  markAllButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.2,
  },

  listContent: {
    padding: spacing.lg,
  },

  //CARD//
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  unreadCard: {
    backgroundColor: colors.sageLight,
    borderColor: colors.sageDark,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBadgeUnread: { backgroundColor: colors.goldLight },
  iconBadgeRead: { backgroundColor: colors.sage },

  cardContent: { flex: 1 },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  cardTitleUnread: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fontSerif,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.goldDark,
    marginLeft: spacing.xs,
  },
  cardMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cardDate: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionHintText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.goldDark,
    marginRight: 2,
    letterSpacing: 0.2,
  },

  //STATES//
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
