# VedBook — Premium Digital Library Application

**VedBook** is an editorial, premium-quality mobile digital library application built with **React Native**, designed for **Android and iOS**. It unites timeless Vedic inquiry, world classical literature, philosophy, and modern scientific discovery inside a calm, distraction-free reading sanctuary.

---

## 1. Brand Identity & Color System

The application strictly adheres to the four-color palette:

- **Primary Forest Green**: `#173F35` — Used for primary buttons, headers, active navigation states, and brand emphasis.
- **Warm Ivory**: `#FAF7F0` — Used for main backgrounds, reading surfaces, and cards.
- **Premium Muted Gold**: `#D6B56D` — Used for emblems, star ratings, bookmarks, progress indicators, and badges.
- **Soft Sage Green**: `#E4EDE5` — Used for category cards, chip surfaces, and secondary actions.

---

## 2. Key Architecture & Features

### Complete App Launch Flow

1. **First-Time Application Launch**:
   - Displays the **VedBook Splash Screen** with gold emblem radiance and brand reveal animation.
   - Transitions into **Three Polished Onboarding Screens**:
     1. *Discover Your Next Read* — Explore across 10 specialized disciplines.
     2. *Your Personal Library* — Bookmark books, track metrics, and cultivate habits.
     3. *A Better Reading Experience* — Calming typography and customizable themes.
   - Directs user to **Login** / **Register**.
   - Onboarding completion and demo session are persisted in `AsyncStorage`.

2. **Subsequent Application Launches**:
   - If the user has a saved demo session, the app immediately opens **Home** (skipping Splash and Onboarding).
   - If logged out after completing onboarding, the app opens **Login** directly (no Splash flicker).
   - An elegant brand loader avoids any UI flashing while verifying session state.

3. **Logout Flow**:
   - A confirmation dialog safeguards against accidental logouts.
   - On confirmation, the session is cleared while preserving onboarding completion.
   - Subsequent launches open Login directly.

### Predefined Demo Accounts

For quick reviewer evaluation, the login screen includes **Quick Demo Auto-Fill** buttons, or you can enter:

| Role | Email | Password |
|---|---|---|
| **Demo User** | `demo@vedbook.com` | `Password123!` |
| **Reader User** | `reader@vedbook.com` | `Password123!` |

*(Note: Real user registration also works locally and persists to AsyncStorage!)*

---

## 3. Core Screens & Capabilities

- **Editorial Home**: Personalized time-of-day greeting, search shortcut, unread notifications badge, "A World of Stories" hero banner, in-progress reading cards with progress bars, featured carousel, category pills, and daily quote.
- **Explore & Search**: Real-time multi-field search (title, author, category, keywords), 10 category chips, sort options (Popularity, Recently Added, Title A-Z, Rating), and responsive 2-column book grid.
- **Categories**: 10 curated disciplines (Fiction, Literature, History, Science, Philosophy, Biography, Self-Help, Technology, Spirituality, Business) with icons and book counts, linking to category-specific book stacks.
- **Book Details**: Cover presentation with gold spine accent, title, author, ratings, publication year, page counts, reading time estimate, expandable synopsis, and related volumes.
- **Distraction-Free Reader**: Paginated interface ready for future PDF rendering, previous/next page navigation, font-size adjustment (Small, Standard, Large), 3 reading surface themes (*Warm Ivory*, *Soft Cream*, *Night Sanctuary*), tap-to-hide distraction-free controls, and automatic local progress persistence.
- **My Library**: Segmented into *In Progress*, *Bookmarked*, *Recently Opened*, and *Completed* reading sections with instant resume reading.
- **Notifications**: Announcements for new arrivals, reading reminders, milestones, and library updates with mark-as-read and live unread badge counters.
- **Profile & Statistics**: User avatar, reading streaks (e.g. 7-day streak 🔥), completed books counter, reading hours, preferences toggles, and logout confirmation modal.

---

## 4. Project Structure

```text
VedBook/
├── src/
│   ├── components/
│   │   └── common/
│   │       ├── BookCard.js          # Vertical, horizontal, and featured hero variants
│   │       ├── Button.js            # Primary, gold, secondary, and outline buttons
│   │       ├── EmptyState.js        # Graceful empty and no-results states
│   │       ├── Header.js            # Safe area aware navigation header
│   │       ├── Icon.js              # Crisp SVG icon system
│   │       ├── Input.js             # Reusable input with validation and eye toggle
│   │       └── SectionHeader.js     # Editorial section header with 'See All'
│   ├── context/
│   │   ├── AuthContext.js           # Session and onboarding lifecycle management
│   │   └── LibraryContext.js        # Bookmarks, reading progress, and notifications
│   ├── data/
│   │   ├── booksData.js             # 22 curated books with sample chapters & quotes
│   │   ├── categoriesData.js        # 10 categorized disciplines
│   │   └── notificationsData.js     # Library announcement notifications
│   ├── navigation/
│   │   ├── AppNavigator.js          # Root conditional navigation controller
│   │   ├── AuthNavigator.js         # Login, Register, ForgotPassword stack
│   │   └── MainTabNavigator.js      # 5 primary bottom tabs
│   ├── screens/
│   │   ├── auth/                    # LoginScreen, RegisterScreen, ForgotPasswordScreen
│   │   ├── books/                   # BookDetailsScreen
│   │   ├── categories/              # CategoriesScreen, CategoryDetailScreen
│   │   ├── explore/                 # ExploreScreen
│   │   ├── home/                    # HomeScreen
│   │   ├── library/                 # LibraryScreen
│   │   ├── notifications/           # NotificationsScreen
│   │   ├── onboarding/              # OnboardingScreen
│   │   ├── profile/                 # ProfileScreen
│   │   ├── reader/                  # ReaderScreen
│   │   └── splash/                  # SplashScreen
│   ├── services/
│   │   └── mockAuthService.js       # Isolated authentication service
│   ├── storage/
│   │   └── asyncStorage.js          # AsyncStorage persistence wrapper
│   └── theme/
│       ├── colors.js                # Exact 4 brand colors, spacing, shadows
│       └── index.js
├── App.tsx                          # App root with providers
├── jest.setup.js                    # Test environment configuration
└── package.json
```

---

## 5. Getting Started

### Installation

Install project dependencies:

```bash
npm install
```

If missing dependencies are needed on a fresh machine:
```bash
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens @react-native-async-storage/async-storage react-native-safe-area-context react-native-svg --legacy-peer-deps
```

### Running on Android

Ensure your Android emulator is running or a device is connected:

```bash
npm run android
```

### Running on iOS (macOS only)

Install CocoaPods dependencies:

```bash
cd ios && pod install && cd ..
npm run ios
```

### Running the Test Suite

Run the Jest test suites verifying unit tests and screen rendering:

```bash
npm test
```

Run ESLint verification:

```bash
npm run lint
```
