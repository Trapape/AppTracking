import React, {useEffect, useState} from 'react';
import {Linking} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {useColorScheme} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';

import HomeScreen from './screens/HomeScreen';
import LocationPermissionScreen from './screens/LocationPermissionScreen';
import SecurityCodeScreen from './screens/SecurityCodeScreen';
import TrackingScreen from './screens/TrackingScreen';
import {useAppContext} from './context/AppContext';

export type RootStackParamList = {
  Home: undefined;
  LocationPermission: undefined;
  SecurityCode: {id: string};
  Tracking: undefined;
};

const linking = {
  prefixes: ['https://trapape.com', 'trapape://'],
  config: {
    screens: {
      Home: 'home',
      LocationPermission: 'permissions',
      SecurityCode: 'entercode/:id',
      Tracking: 'tracking',
    },
  },
};

// Helper function to parse URL
const parseCustomURL = (url: string) => {
  const pattern = /^(.*?):\/\/(.*?)\/(.*?)\/(.*?)(?:\?.*)?$/;
  const match = url.match(pattern);

  if (!match) {
    throw new Error('URL does not match the expected format');
  }

  const [, root, host, scream, params] = match;
  return {root, host, scream, params};
};

const Stack = createStackNavigator<RootStackParamList>();

function LinkingNavigator() {
  const isDarkMode = useColorScheme() === 'dark';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList>('Home');
  const {setId} = useAppContext(); // Use the context here

  useEffect(() => {
    const getInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        try {
          const {scream, params} = parseCustomURL(url);
          if (scream === 'entercode' && params) {
            console.log('Setting ID:', params); // Debugging line
            setId(params); // Save the id to the context
            setInitialRoute('SecurityCode');
          } else if (scream === 'permissions') {
            setInitialRoute('LocationPermission');
          } else {
            setInitialRoute('Home');
          }
        } catch (error) {
          console.error('Failed to parse URL:', error);
        }
      }
    };

    getInitialURL();
  }, [setId]);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{title: 'Trapape'}}
        />
        <Stack.Screen
          name="LocationPermission"
          component={LocationPermissionScreen}
          options={{title: 'Solicitud de Permisos'}}
        />
        <Stack.Screen
          name="SecurityCode"
          component={SecurityCodeScreen}
          options={{title: 'Código de verificación'}}
        />
        <Stack.Screen
          name="Tracking"
          component={TrackingScreen}
          options={{title: 'Tracking'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default LinkingNavigator;
