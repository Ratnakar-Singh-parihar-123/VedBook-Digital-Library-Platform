import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  StyleSheet,
  StatusBar,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';

import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from '../../theme';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { usersAPI, API_BASE_URL } from '../../api/usersApi';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MODAL_HEIGHT = SCREEN_HEIGHT; // Full-height bottom sheet

/* ------------------------------------------------------------------ */
/*  Resolve avatar URL — handles relative paths + cache-busting       */
/* ------------------------------------------------------------------ */
function resolveAvatarUrl(raw, cacheBust = null) {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s) return null;

  // Absolute URL — use as-is
  if (/^(https?:\/\/|data:|file:|content:|ph:|blob:)/i.test(s)) {
    return cacheBust ? `${s}${s.includes('?') ? '&' : '?'}t=${cacheBust}` : s;
  }

  // API host root (strip trailing "/api")
  const host = (API_BASE_URL || '').replace(/\/api\/?$/, '');

  // Relative path
  const full = s.startsWith('/') ? `${host}${s}` : `${host}/uploads/users/${s}`;
  return cacheBust
    ? `${full}${full.includes('?') ? '&' : '?'}t=${cacheBust}`
    : full;
}

function getAvatarFromUser(u, cacheBust = null) {
  if (!u) return null;
  const raw =
    u.avatar ||
    u.profile_pic ||
    u.profilePic ||
    u.profile_image ||
    u.profileImage ||
    u.image ||
    '';
  return resolveAvatarUrl(raw, cacheBust);
}

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */
export const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout, refreshProfile } = useAuth();
  const { completedBooks, readingProgress } = useLibrary();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineSyncEnabled, setOfflineSyncEnabled] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  /* Local cache-buster for avatar */
  const [avatarVersion, setAvatarVersion] = useState(Date.now());

  /* Edit form state */
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarUri, setEditAvatarUri] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editError, setEditError] = useState('');

  /* Animations */
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  /* ----------------------------------------------------------------- */
  /*  Open / close edit modal                                           */
  /* ----------------------------------------------------------------- */
  const openEditModal = () => {
    setEditName(user?.name || user?.fullName || '');
    setEditBio(user?.bio || '');
    setEditPhone(user?.phone || '');
    setEditAvatarUri(null);
    setEditError('');
    setShowEditModal(true);
  };

  useEffect(() => {
    if (showEditModal) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: MODAL_HEIGHT,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showEditModal, fadeAnim, slideAnim]);

  const closeEditModal = () => {
    if (savingProfile) return;
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: MODAL_HEIGHT,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setShowEditModal(false));
  };

  /* ----------------------------------------------------------------- */
  /*  Permissions                                                       */
  /* ----------------------------------------------------------------- */
  const requestGalleryPermission = async () => {
    if (Platform.OS !== 'android') return true;

    try {
      const permission =
        Platform.Version >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

      const already = await PermissionsAndroid.check(permission);
      if (already) return true;

      const result = await PermissionsAndroid.request(permission, {
        title: 'Photo Access Required',
        message: 'VedBook needs photo access to update your profile picture.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      });

      if (result === PermissionsAndroid.RESULTS.GRANTED) return true;

      if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'Permission Blocked',
          'Please enable photo access in Settings → Apps → VedBook → Permissions.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
      }
      return false;
    } catch {
      return false;
    }
  };

  /* ----------------------------------------------------------------- */
  /*  Image picker                                                      */
  /* ----------------------------------------------------------------- */
  const pickImage = async () => {
    try {
      setEditError('');

      const granted = await requestGalleryPermission();
      if (!granted) {
        Alert.alert(
          'Permission required',
          'Please allow access to your photos to change your profile picture.',
        );
        return;
      }

      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.85,
        maxWidth: 800,
        maxHeight: 800,
        selectionLimit: 1,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        setEditError(result.errorMessage || 'Could not open gallery');
        return;
      }

      const asset = result.assets?.[0];
      if (asset?.uri) {
        setEditAvatarUri(asset.uri);
        setEditError('');
      }
    } catch (err) {
      setEditError(err?.message || 'Could not pick image. Please try again.');
    }
  };

  /* ----------------------------------------------------------------- */
  /*  Save profile                                                      */
  /* ----------------------------------------------------------------- */
  const handleSaveProfile = async () => {
    setEditError('');

    if (!editName.trim()) {
      setEditError('Name is required');
      return;
    }
    if (editName.trim().length < 2) {
      setEditError('Name must be at least 2 characters');
      return;
    }

    setSavingProfile(true);

    try {
      // 1. Update text fields
      await usersAPI.updateProfile({
        name: editName.trim(),
        bio: editBio.trim(),
        phone: editPhone.trim(),
      });

      // 2. Upload new picture if user picked one
      if (editAvatarUri) {
        await usersAPI.updateProfilePicture(editAvatarUri);
      }

      // 3. Refresh auth user from server (pulls new avatar path)
      if (refreshProfile) {
        await refreshProfile();
      }

      // 4. Bump cache-buster so <Image> re-fetches the new avatar
      setAvatarVersion(Date.now());

      // 5. Close modal
      closeEditModal();
    } catch (err) {
      setEditError(err?.message || 'Could not save changes. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleConfirmLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      setShowLogoutModal(false);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const totalPagesRead =
    Object.values(readingProgress || {}).reduce(
      (acc, curr) => acc + (curr.currentPage || 0),
      0,
    ) || (user?.booksRead ? user.booksRead * 24 : 0);

  /* --- FIXED: resolve avatar URL with cache-buster --- */
  const displayAvatar =
    getAvatarFromUser(user, avatarVersion) ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop';

  const displayName = user?.name || user?.fullName || 'Distinguished Reader';
  const displayEmail = user?.email || 'reader@vedbook.com';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.ivory} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Text style={styles.screenTitle}>Member Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 80 },
        ]}
      >
        {/* User Card */}
        <View style={styles.userCard}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={openEditModal}
            style={styles.editButtonTopRight}
          >
            <Icon name="edit" size={16} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: displayAvatar }}
              style={styles.avatar}
              onError={e =>
                console.log('Avatar load error:', e.nativeEvent?.error)
              }
            />
            <View style={styles.avatarBadge}>
              <Icon name="star-filled" size={12} color={colors.primaryDark} />
            </View>
          </View>

          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>
          <Text style={styles.userBio}>
            {user?.bio ||
              'Preserving clarity and classical insight in an age of noise.'}
          </Text>

          <View style={styles.joinedPill}>
            <Text style={styles.joinedPillText}>
              Member since {user?.joinedDate || '2025'}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={openEditModal}
            style={styles.editCtaButton}
          >
            <Icon name="edit" size={14} color={colors.primary} />
            <Text style={styles.editCtaText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionHeaderTitle}>
            Reading Metrics & Streaks
          </Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <View style={styles.statIconBadgeGold}>
                <Icon name="streak" size={20} color={colors.goldDark} />
              </View>
              <Text style={styles.statNumber}>{user?.streak || 7} Days</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statIconBadge}>
                <Icon name="award" size={20} color={colors.primary} />
              </View>
              <Text style={styles.statNumber}>
                {Math.max(completedBooks?.length || 0, user?.booksRead || 5)}
              </Text>
              <Text style={styles.statLabel}>Completed Books</Text>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statIconBadge}>
                <Icon name="clock" size={20} color={colors.primary} />
              </View>
              <Text style={styles.statNumber}>{user?.hoursRead || 32} hrs</Text>
              <Text style={styles.statLabel}>Reading Hours</Text>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statIconBadge}>
                <Icon name="book" size={20} color={colors.primary} />
              </View>
              <Text style={styles.statNumber}>{totalPagesRead}</Text>
              <Text style={styles.statLabel}>Pages Read</Text>
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionHeaderTitle}>
            App & Reading Preferences
          </Text>

          <View style={styles.settingItemRow}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingTitle}>Daily Reading Reminders</Text>
              <Text style={styles.settingSubtitle}>
                Receive subtle reminders to feed your intellectual routine
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor={notificationsEnabled ? colors.gold : colors.surface}
            />
          </View>

          <View style={styles.settingItemRow}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingTitle}>Offline Library Caching</Text>
              <Text style={styles.settingSubtitle}>
                Cache reading pages for distraction-free offline access
              </Text>
            </View>
            <Switch
              value={offlineSyncEnabled}
              onValueChange={setOfflineSyncEnabled}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor={offlineSyncEnabled ? colors.gold : colors.surface}
            />
          </View>
        </View>

        {/* About / Support */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionHeaderTitle}>About & Guidance</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowAboutModal(true)}
            style={styles.menuItem}
          >
            <View style={styles.menuItemLeft}>
              <Icon name="info" size={18} color={colors.primary} />
              <Text style={styles.menuItemTitle}>About VedBook</Text>
            </View>
            <Icon name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowSupportModal(true)}
            style={styles.menuItem}
          >
            <View style={styles.menuItemLeft}>
              <Icon name="help" size={18} color={colors.primary} />
              <Text style={styles.menuItemTitle}>Help & Support FAQ</Text>
            </View>
            <Icon name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.logoutWrapper}>
          <Button
            title="Log Out"
            variant="outline"
            icon="logout"
            onPress={() => setShowLogoutModal(true)}
            style={styles.logoutButton}
            textStyle={{ color: colors.error }}
          />
        </View>
      </ScrollView>

      {/* ============ EDIT PROFILE MODAL — FULL HEIGHT ============ */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="none"
        onRequestClose={closeEditModal}
        statusBarTranslucent
      >
        <View style={styles.sheetOverlay}>
          <Animated.View style={[styles.sheetBackdrop, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={closeEditModal}
            />
          </Animated.View>

          {/* FULL-SCREEN bottom sheet */}
          <Animated.View
            style={[
              styles.sheetContainer,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Top safe area handled with padding */}
            <View style={{ height: Math.max(insets.top, 12) }} />

            <View style={styles.sheetHandleWrap}>
              <View style={styles.sheetHandle} />
            </View>

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                <View style={styles.sheetHeaderBadge}>
                  <Icon name="edit" size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.sheetTitle}>Edit Profile</Text>
                  <Text style={styles.sheetSubtitle}>
                    Update your information
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={closeEditModal}
                disabled={savingProfile}
                style={styles.sheetCloseBtn}
              >
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.sheetBody}
              keyboardVerticalOffset={0}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.sheetScrollContent,
                  { paddingBottom: Math.max(insets.bottom, 24) + 24 },
                ]}
                keyboardShouldPersistTaps="handled"
              >
                {/* Avatar picker */}
                <View style={styles.avatarPickerWrap}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={pickImage}
                    disabled={savingProfile}
                  >
                    <Image
                      source={{ uri: editAvatarUri || displayAvatar }}
                      style={styles.editAvatar}
                    />
                    <View style={styles.editAvatarOverlay}>
                      <Icon name="camera" size={18} color={colors.ivory} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={pickImage}
                    disabled={savingProfile}
                    style={styles.changePhotoBtn}
                  >
                    <Text style={styles.changePhotoText}>
                      {editAvatarUri ? 'Change selection' : 'Change photo'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <TextInput
                    value={editName}
                    onChangeText={t => {
                      setEditName(t);
                      if (editError) setEditError('');
                    }}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textMuted}
                    style={styles.fieldInput}
                    editable={!savingProfile}
                    maxLength={60}
                  />
                </View>

                {/* Bio */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Bio</Text>
                  <TextInput
                    value={editBio}
                    onChangeText={setEditBio}
                    placeholder="A short bio about you…"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.fieldInput, styles.fieldTextArea]}
                    multiline
                    numberOfLines={3}
                    editable={!savingProfile}
                    maxLength={200}
                    textAlignVertical="top"
                  />
                  <Text style={styles.charCount}>{editBio.length}/200</Text>
                </View>

                {/* Phone */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Phone <Text style={styles.fieldOptional}>(optional)</Text>
                  </Text>
                  <TextInput
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="+91 98765 43210"
                    placeholderTextColor={colors.textMuted}
                    style={styles.fieldInput}
                    keyboardType="phone-pad"
                    editable={!savingProfile}
                    maxLength={20}
                  />
                </View>

                {/* Email (read-only) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <View style={styles.fieldReadonly}>
                    <Text style={styles.fieldReadonlyText}>{displayEmail}</Text>
                    <Icon name="lock" size={13} color={colors.textMuted} />
                  </View>
                </View>

                {/* Error */}
                {editError ? (
                  <View style={styles.editErrorBox}>
                    <Icon name="info" size={15} color={colors.error} />
                    <Text style={styles.editErrorText}>{editError}</Text>
                  </View>
                ) : null}

                {/* Actions */}
                <View style={styles.sheetActions}>
                  <Button
                    title="Cancel"
                    variant="secondary"
                    onPress={closeEditModal}
                    disabled={savingProfile}
                    style={styles.sheetBtn}
                  />
                  <Button
                    title={savingProfile ? 'Saving…' : 'Save Changes'}
                    variant="primary"
                    onPress={handleSaveProfile}
                    loading={savingProfile}
                    style={styles.sheetBtn}
                  />
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>

      {/* ============ LOGOUT MODAL ============ */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBadge}>
              <Icon name="logout" size={28} color={colors.error} />
            </View>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to end your current session? Your saved
              bookmarks and reading progress will remain safely stored on this
              device.
            </Text>

            <View style={styles.modalActionsRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowLogoutModal(false)}
                style={styles.modalCancelBtn}
              />
              <Button
                title="Log Out"
                variant="primary"
                loading={loggingOut}
                onPress={handleConfirmLogout}
                style={[
                  styles.modalLogoutBtn,
                  {
                    backgroundColor: colors.error,
                    borderColor: colors.error,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ============ ABOUT MODAL ============ */}
      <Modal
        visible={showAboutModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Icon name="logo" size={40} color={colors.primary} />
            <Text style={styles.modalTitle}>About VedBook</Text>
            <Text style={styles.modalVersion}>Version 1.0.0</Text>
            <Text style={styles.modalMessage}>
              VedBook is an editorial digital sanctuary uniting timeless Vedic
              inquiry, world classical literature, and modern scientific
              discovery.
            </Text>
            <Button
              title="Close"
              variant="primary"
              onPress={() => setShowAboutModal(false)}
              style={{ width: '100%', marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>

      {/* ============ SUPPORT MODAL ============ */}
      <Modal
        visible={showSupportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSupportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Icon name="help" size={36} color={colors.primary} />
            <Text style={styles.modalTitle}>Help & Support</Text>
            <Text style={styles.modalMessage}>
              For assistance, reading inquiries, or feedback, contact us at:
            </Text>
            <View style={styles.supportContactBox}>
              <Text style={styles.supportEmail}>support@vedbook.org</Text>
            </View>
            <Button
              title="Close"
              variant="primary"
              onPress={() => setShowSupportModal(false)}
              style={{ width: '100%', marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

/* ================================================================= */
/*  STYLES                                                             */
/* ================================================================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },

  /* Header */
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.ivory,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fontSerif,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  /* User Card */
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    ...shadows.soft,
  },
  editButtonTopRight: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatarWrapper: { position: 'relative', marginBottom: spacing.md },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.sage,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.gold,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fontSerif,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userBio: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
  joinedPill: {
    backgroundColor: colors.sage,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
    marginTop: spacing.md,
  },
  joinedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  editCtaButton: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.ivory,
  },
  editCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  /* Stats */
  statsSection: { marginTop: spacing.xl },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: typography.fontSerif,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statBox: {
    width: '47%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.soft,
  },
  statIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statIconBadgeGold: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  /* Menu */
  menuSection: { marginTop: spacing.xl },
  settingItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  settingTextCol: { flex: 1, paddingRight: spacing.md },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  settingSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.sm,
  },

  /* Logout */
  logoutWrapper: {
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  logoutButton: {
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
  },

  /* Generic modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 42, 35, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.elevated,
  },
  modalIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  modalVersion: {
    fontSize: 12,
    color: colors.goldDark,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  modalMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  modalActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
  },
  modalCancelBtn: { flex: 1 },
  modalLogoutBtn: { flex: 1 },
  supportContactBox: {
    backgroundColor: colors.sage,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  supportEmail: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  /* Edit sheet — FULL HEIGHT */
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 42, 35, 0.55)',
  },
  sheetContainer: {
    height: MODAL_HEIGHT, // ← FULL SCREEN
    backgroundColor: colors.ivory,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    ...shadows.elevated,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.ivory,
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sheetHeaderBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fontSerif,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  sheetCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sheetBody: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  /* Avatar picker */
  avatarPickerWrap: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  editAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.sage,
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ivory,
  },
  changePhotoBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.round,
    backgroundColor: colors.sage,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  /* Fields */
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldOptional: {
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'none',
  },
  fieldInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.primary,
    fontFamily: typography.fontSans,
  },
  fieldTextArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  fieldReadonly: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.sage,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  fieldReadonlyText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },

  /* Error */
  editErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: 8,
  },
  editErrorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  /* Actions */
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sheetBtn: { flex: 1 },
});
