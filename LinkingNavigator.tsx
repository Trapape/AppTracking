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
    const handleDeepLink = (event: {url: any}) => {
      const url = event.url;
      if (url) {
        try {
          const {scream, params} = parseCustomURL(url);
          if (scream === 'entercode' && params) {
            setId(params);
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

    // Obtener el URL inicial si la aplicación fue lanzada desde un enlace profundo
    const getInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        handleDeepLink({url});
      }
    };

    getInitialURL();

    // Añadir listener para manejar enlaces mientras la aplicación está en segundo plano
    const linkingListener = Linking.addEventListener('url', handleDeepLink);

    return () => {
      // Limpiar el listener cuando el componente se desmonte
      linkingListener.remove();
    };
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
