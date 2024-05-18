import React from 'react';
import {SafeAreaView, StatusBar, useColorScheme} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {AppProvider} from './context/AppContext';
import LinkingNavigator from './LinkingNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <AppProvider>
      <SafeAreaView
        style={{flex: 1, backgroundColor: backgroundStyle.backgroundColor}}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <LinkingNavigator />
      </SafeAreaView>
    </AppProvider>
  );
}

export default App;
