
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { LibraryProvider } from './src/context/LibraryContext';
import { AppNavigator } from './src/navigation/AppNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LibraryProvider>
          <AppNavigator />
        </LibraryProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
