// Jest setup for React Native and mocks

const mockStorageMap = {};

const mockAsyncStorage = {
  setItem: jest.fn((key, value) => {
    mockStorageMap[key] = value;
    return Promise.resolve(null);
  }),
  getItem: jest.fn((key) => {
    return Promise.resolve(mockStorageMap[key] !== undefined ? mockStorageMap[key] : null);
  }),
  removeItem: jest.fn((key) => {
    delete mockStorageMap[key];
    return Promise.resolve(null);
  }),
  clear: jest.fn(() => {
    Object.keys(mockStorageMap).forEach((key) => delete mockStorageMap[key]);
    return Promise.resolve(null);
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Object.keys(mockStorageMap))),
  multiGet: jest.fn((keys) =>
    Promise.resolve(keys.map((key) => [key, mockStorageMap[key] !== undefined ? mockStorageMap[key] : null]))
  ),
  multiSet: jest.fn((entries) => {
    entries.forEach(([key, value]) => {
      mockStorageMap[key] = value;
    });
    return Promise.resolve(null);
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach((key) => delete mockStorageMap[key]);
    return Promise.resolve(null);
  }),
};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: mockAsyncStorage,
  ...mockAsyncStorage,
}));

jest.mock('react-native-screens', () => {
  const { View } = require('react-native');
  return {
    enableScreens: jest.fn(),
    screensEnabled: jest.fn(() => true),
    compatibilityFlags: {
      usesNewAndroidHeaderHeightImplementation: false,
    },
    ScreenContainer: View,
    Screen: View,
    NativeScreen: View,
    NativeScreenContainer: View,
    ScreenStack: View,
    ScreenStackItem: View,
    ScreenStackHeaderConfig: View,
    ScreenStackHeaderSubview: View,
    SearchBar: View,
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 375, height: 812 };
  const InsetsContext = React.createContext(inset);
  const FrameContext = React.createContext(frame);

  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(inset),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
    SafeAreaInsetsContext: InsetsContext,
    SafeAreaFrameContext: FrameContext,
  };
});

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

jest.mock('react-native-pdf', () => {
  const React = require('react');
  const { View } = require('react-native');
  return props => <View {...props} testID="mock-pdf-view" />;
});

jest.mock('react-native-blob-util', () => ({
  fs: {
    dirs: {
      DocumentDir: '/mock/docs',
      CacheDir: '/mock/cache',
      DownloadDir: '/mock/downloads',
    },
    exists: jest.fn(() => Promise.resolve(false)),
    unlink: jest.fn(() => Promise.resolve()),
  },
  config: jest.fn(() => ({
    fetch: jest.fn(() =>
      Promise.resolve({
        path: () => '/mock/file.pdf',
        info: () => ({ status: 200 }),
      }),
    ),
  })),
}));
