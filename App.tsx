/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {SafeAreaView, StatusBar, useColorScheme} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';

// Import your HomeScreen
import HomeScreen from './screens/HomeScreen';
import LocationPermissionScreen from './screens/LocationPermissionScreen';
import SecurityCodeScreen from './screens/SecurityCodeScreen';

export type RootStackParamList = {
  Home: undefined;
  LocationPermission: undefined;
  SecurityCode: undefined;
};

// Create a stack navigator
const Stack = createStackNavigator<RootStackParamList>();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: backgroundStyle.backgroundColor}}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="LocationPermission"
            component={LocationPermissionScreen}
            options={{title: 'Solicitud de Permisos'}}
          />
          <Stack.Screen name="SecurityCode" component={SecurityCodeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

export default App;
