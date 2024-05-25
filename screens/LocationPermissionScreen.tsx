import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import LottieView from 'lottie-react-native';
import {
  checkMultiple,
  requestMultiple,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from 'react-native-permissions';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from 'react-native-screens/lib/typescript/native-stack/types';
import SvgLocation from '../assets/images/UndrawLocationTracking';

const LocationPermissionScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  // Función para verificar y solicitar permisos
  const handlePermissions = async () => {
    checkAndRequestPermissions();
  };

  async function checkAndRequestPermissions() {
    if (Platform.OS === 'android') {
      try {
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
          const granted = await requestMultiple(permissionsToRequest);
          const allGranted = permissionsToRequest.every(
            permission => granted[permission] === RESULTS.GRANTED,
          );

          if (allGranted) {
            navigation.navigate('SecurityCode');
          } else {
            const deniedPermissions = permissionsToRequest.filter(
              permission => granted[permission] === RESULTS.DENIED,
            );
            const blockedPermissions = permissionsToRequest.filter(
              permission => granted[permission] === RESULTS.BLOCKED,
            );

            if (blockedPermissions.length > 0) {
              Alert.alert(
                'Permiso requerido',
                'Necesitas habilitar los permisos manualmente desde la configuración del sistema.',
                [
                  {
                    text: 'Cancelar',
                    onPress: () => console.log('Permiso negado'),
                    style: 'cancel',
                  },
                  {
                    text: 'Abrir Configuración',
                    onPress: () => openSettings(),
                  },
                ],
                {cancelable: false},
              );
            } else if (deniedPermissions.length > 0) {
              Alert.alert(
                'Permiso requerido',
                'Necesitas habilitar los permisos manualmente desde la configuración del sistema.',
                [
                  {
                    text: 'Cancelar',
                    onPress: () => console.log('Permiso negado'),
                    style: 'cancel',
                  },
                  {
                    text: 'Abrir Configuración',
                    onPress: () => openSettings(),
                  },
                ],
                {cancelable: false},
              );
            }
          }
        } else {
          navigation.navigate('SecurityCode');
        }
      } catch (err) {
        console.warn('Error al solicitar permisos:', err);
      }
    }
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => console.log('Cerrar')}>
          <Text>X</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.title}>Acceso a tu ubicación</Text>
      <View style={styles.svgContainer}>
        <SvgLocation width="100%" height="100%" />
      </View>
      <Text style={styles.description}>
        Trapape recopila datos de ubicación para habilitar la búsqueda de cargas
        y seguimiento de las cargas incluso cuando la aplicación está cerrada o
        no está en uso.
      </Text>
      <LottieView
        source={require('../assets/animations/loading.json')}
        autoPlay
        loop
      />
      <TouchableOpacity style={styles.button} onPress={handlePermissions}>
        <Text style={styles.buttonText}>Continuar</Text>
      </TouchableOpacity>
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
  svgContainer: {
    width: 150, // Ajusta el tamaño según sea necesario
    height: 150, // Ajusta el tamaño según sea necesario
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 10,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  button: {
    backgroundColor: 'blue',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});

export default LocationPermissionScreen;
