import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import LottieView from 'lottie-react-native';
import {PERMISSIONS, RESULTS, checkMultiple} from 'react-native-permissions';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from 'react-native-screens/lib/typescript/native-stack/types';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  useEffect(() => {
    const checkPermissions = async () => {
      if (Platform.OS === 'android') {
        const permissions = [
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
          PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION,
        ];

        const statuses = await checkMultiple(permissions);
        const permissionsToRequest = permissions.filter(
          permission => statuses[permission] !== RESULTS.GRANTED,
        );

        if (permissionsToRequest.length > 0) {
          navigation.navigate('LocationPermission');
          // } else if (Radar.isTracking()) {
          //   console.log(Radar.isTracking());
          //   navigation.navigate('Tracking');
        } else {
          navigation.navigate('SecurityCode');
        }
      }
    };

    (async () => {
      await sleep(5000); // Espera 3 segundos antes de verificar los permisos
      await checkPermissions();
    })();
  }, [navigation]); // Asegúrate de incluir navigation como dependencia si la usas dentro de useEffect

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a Trapape Tracking</Text>
      <LottieView
        source={require('../assets/animations/startApp.json')}
        autoPlay
        loop
        style={styles.lottie}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 10,
  },
  lottie: {
    width: 200,
    height: 200,
  },
});

export default HomeScreen;
