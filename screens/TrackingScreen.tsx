import React, {useCallback, useEffect, useState} from 'react';
import {View, Button, Alert, StyleSheet} from 'react-native';
import Radar from 'react-native-radar';
import {useAppContext} from '../context/AppContext';
import DeviceInfo from 'react-native-device-info';
import MapView, {Marker, Polyline} from 'react-native-maps';
import Loader from '../componentes/Loader';
import {useNetInfo} from '@react-native-community/netinfo';
import {NetworkProvider} from 'react-native-offline';
import useGeofences from '../hooks/useGeofences';
import usePendingData from '../hooks/usePendingData';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Point {
  location: {
    latitude: number;
    longitude: number;
  };
  type: string;
  key: string;
  radius?: number;
}

const TRACKING_OPTIONS = {
  desiredStoppedUpdateInterval: 30,
  fastestStoppedUpdateInterval: 30,
  desiredMovingUpdateInterval: 30,
  fastestMovingUpdateInterval: 30,
  desiredSyncInterval: 20,
  desiredAccuracy: 'high' as const,
  stopDuration: 140,
  stopDistance: 70,
  sync: 'all' as const,
  replay: 'all' as const,
  useStoppedGeofence: true,
  showBlueBar: true,
  stoppedGeofenceRadius: 100,
  useMovingGeofence: true,
  movingGeofenceRadius: 100,
  syncGeofences: true,
  useVisits: true,
  useSignificantLocationChanges: true,
  beacons: false,
  syncGeofencesLimit: 10,
  foregroundServiceEnabled: true,
};

const TrackingScreen = () => {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {id} = useAppContext();
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [route, setRoute] = useState<Point[]>([]);
  const netInfo = useNetInfo();
  const {fetchAndCreateGeofences, processGeofences} = useGeofences(
    id,
    deviceId,
  );
  const {getPendingData, savePendingData} = usePendingData();

  // Función para enviar datos pendientes en cola
  const sendQueue = useCallback(async () => {
    while (netInfo.isConnected) {
      const pendingLocationData = await getPendingData('pendingLocationData');
      const pendingEventsData = await getPendingData('pendingEventsData');

      if (pendingLocationData.length === 0 && pendingEventsData.length === 0) {
        break; // No hay datos pendientes
      }

      if (pendingLocationData.length > 0) {
        const data = pendingLocationData.shift();
        try {
          const response = await axios.post(
            //'https://us-central1-trapape.cloudfunctions.net/handleRadarLocation',
            'https://us-central1-trapape-dev.cloudfunctions.net/handleRadarLocation',
            data,
          );
          console.log(
            'Location sendQueue data sent successfully:',
            response.data,
          );
          await AsyncStorage.setItem(
            'pendingLocationData',
            JSON.stringify(pendingLocationData),
          );
        } catch (error) {
          console.error('Error sendQueue sending location data:', error);
          pendingLocationData.unshift(data); // Reinserta el dato si falla
          await AsyncStorage.setItem(
            'pendingLocationData',
            JSON.stringify(pendingLocationData),
          );
          break; // Detén el reintento si falla
        }
      }

      if (pendingEventsData.length > 0) {
        const data = pendingEventsData.shift();
        try {
          const response = await axios.post(
            //'https://us-central1-trapape.cloudfunctions.net/handleRadarEvents',
            'https://us-central1-trapape-dev.cloudfunctions.net/handleRadarEvents',
            data,
          );
          console.log(
            'Events sendQueue data sent successfully:',
            response.data,
          );
          await AsyncStorage.setItem(
            'pendingEventsData',
            JSON.stringify(pendingEventsData),
          );
        } catch (error) {
          console.error('Error sendQueue sending events data:', error);
          pendingEventsData.unshift(data); // Reinserta el dato si falla
          await AsyncStorage.setItem(
            'pendingEventsData',
            JSON.stringify(pendingEventsData),
          );
          break; // Detén el reintento si falla
        }
      }
    }
  }, [getPendingData, netInfo.isConnected]);

  // Función para enviar datos de ubicación a un webhook
  const sendLocationWebhook = useCallback(
    async (data: any) => {
      try {
        const response = await axios.post(
          //'https://us-central1-trapape.cloudfunctions.net/handleRadarLocation',
          'https://us-central1-trapape-dev.cloudfunctions.net/handleRadarLocation',
          data,
        );
        console.log('Location data sent successfully:', response.data);
      } catch (error) {
        console.error('Error sending location data:', error);
        await savePendingData('pendingLocationData', data);
      }
    },
    [savePendingData],
  );

  // Función para enviar datos de eventos a un webhook
  const sendEventsWebhook = useCallback(
    async (data: any) => {
      try {
        const response = await axios.post(
          //'https://us-central1-trapape.cloudfunctions.net/handleRadarEvents',
          'https://us-central1-trapape-dev.cloudfunctions.net/handleRadarEvents',
          data,
        );
        console.log('Events data sent successfully:', response.data);
      } catch (error) {
        console.error('Error sending events data:', error);
        await savePendingData('pendingEventsData', data);
      }
    },
    [savePendingData],
  );

  // Función para obtener la ubicación actual
  const getCurrentLocation = async () => {
    try {
      const result = await Radar.getLocation();
      if (result && result.location) {
        setCurrentLocation({
          latitude: result.location.latitude,
          longitude: result.location.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  // Obtener el ID del dispositivo al cargar el componente
  useEffect(() => {
    const getDeviceId = async () => {
      const idDevice = await DeviceInfo.getUniqueId();
      setDeviceId(idDevice);
    };

    getDeviceId();
  }, []);

  // Función para iniciar el seguimiento
  const startTracking = async () => {
    setLoading(true);
    try {
      Radar.stopTracking();
      const status = await Radar.requestPermissions(true);
      if (status === 'GRANTED_BACKGROUND') {
        Radar.setForegroundServiceOptions({
          text: 'Seguimiento de ubicación iniciado',
          title: 'Actualizaciones de ubicación',
          updatesOnly: false,
          importance: 2,
          activity: 'com.trapape.tracking',
        });
        Radar.startTrackingCustom(TRACKING_OPTIONS);
        setLoading(false);
      } else {
        Alert.alert(
          'Permisos no otorgados',
          'Se requieren permisos de ubicación para rastrear tu ubicación.',
        );
        setLoading(false);
      }
    } catch (err) {
      console.error('Error al solicitar permisos:', err);
      Alert.alert(
        'Error al solicitar permisos',
        (err as Error).message || JSON.stringify(err),
      );
      Radar.stopTracking();
      setLoading(false);
    }
  };

  // Función para detener el seguimiento
  const stoptTracking = async () => {
    setLoading(true);
    try {
      Radar.off('clientLocation');
      Radar.off('location');
      Radar.off('events');
      Radar.off('error');
      Radar.stopTracking();
      setLoading(false);
    } catch (err) {
      console.error('Error al detener:', err);
      Alert.alert(
        'Error al detener',
        (err as Error).message || JSON.stringify(err),
      );
      Radar.stopTracking();
      setLoading(false);
    }
  };

  // Función para verificar el estado del seguimiento
  const isTracking = async () => {
    try {
      const result = await Radar.isTracking();
      Alert.alert('Estado de rastreo', JSON.stringify(result));
      console.log('Tracking status:', result);
    } catch (err) {
      console.error('Error al obtener el estado de rastreo:', err);
      Alert.alert(
        'Error al obtener el estado de rastreo',
        (err as Error).message || JSON.stringify(err),
      );
    }
  };

  // Efecto para enviar datos en cola cuando hay conexión a Internet
  useEffect(() => {
    if (netInfo.isConnected) {
      sendQueue(); // Iniciar el proceso de envío cuando hay conexión
    }
  }, [netInfo.isConnected, sendQueue]);

  // Efecto para inicializar el seguimiento al cargar el componente
  useEffect(() => {
    const initializeTracking = async () => {
      setLoading(true);
      try {
        Radar.stopTracking();
        if (deviceId && id !== undefined) {
          const allPoints = await fetchAndCreateGeofences();
          setRoute(allPoints ?? []); // Asegúrate de usar setRoute con un array vacío como valor predeterminado
          await processGeofences(allPoints);

          Radar.initialize(
            'prj_live_pk_5463e9a31811973fff88f5cca6c68b4a9923a80b',
          );
          Radar.setUserId(deviceId);
          Radar.setDescription(id);
          Radar.setLogLevel('debug');

          const onLocation = (result: {
            location: {latitude: number; longitude: number};
          }) => {
            try {
              const {location} = result;
              const deviceTimestamp = new Date();

              if (location) {
                const data = {
                  id,
                  location,
                  deviceTimestamp,
                  deviceId,
                };
                setCurrentLocation({
                  latitude: location.latitude,
                  longitude: location.longitude,
                });
                sendLocationWebhook(data);
              } else {
                console.error('No location data available');
              }
            } catch (error) {
              console.error('Error in onLocation:', error);
            }
          };

          Radar.on('location', onLocation);

          const onEvents = (result: {events: any[]}) => {
            try {
              const {events} = result;
              if (events && events.length > 0) {
                const deviceTimestamp = new Date();
                events.forEach(event => {
                  const data = {
                    id,
                    event,
                    deviceTimestamp,
                    deviceId,
                  };
                  sendEventsWebhook(data);
                });
              } else {
                console.error('No events data available');
              }
            } catch (error) {
              console.error('Error in onEvents:', error);
            }
          };

          Radar.on('events', onEvents);

          const onError = (err: any) => {
            try {
              console.error('Error event:', err);
            } catch (error) {
              console.error('Error in onError:', error);
            }
          };

          Radar.on('error', onError);

          const onClientLocation = (result: any) => {
            try {
              console.warn('clientLocation event:', result);
            } catch (error) {
              console.error('Error in onClientLocation:', error);
            }
          };

          Radar.on('clientLocation', onClientLocation);

          await getCurrentLocation();
          await startTracking();
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing tracking:', err);
        Alert.alert(
          'Error initializing tracking',
          (err as Error).message || JSON.stringify(err),
        );
        //Radar.stopTracking();
        setLoading(false);
      }
    };

    initializeTracking();

    // Cleanup function para desactivar los eventos y detener el seguimiento
    return () => {
      Radar.off('location');
      Radar.off('events');
      Radar.off('error');
      Radar.off('clientLocation');
      //Radar.stopTracking();
    };
  }, [
    deviceId,
    id,
    fetchAndCreateGeofences,
    processGeofences,
    sendLocationWebhook,
    sendEventsWebhook,
  ]);

  return (
    <NetworkProvider>
      <View>
        <Button
          title="Comenzar Rastreo"
          onPress={() => {
            startTracking();
          }}
        />
        <Button
          title="Detener Rastreo"
          onPress={() => {
            stoptTracking();
          }}
        />
        <Button
          title="¿Estoy rastreando?"
          onPress={() => {
            isTracking();
          }}
        />
        <MapView
          style={styles.map}
          region={{
            latitude: currentLocation ? currentLocation.latitude : 37.78825,
            longitude: currentLocation ? currentLocation.longitude : -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}>
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title="Current Location"
            />
          )}
          {route.map((point, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: point.location.latitude,
                longitude: point.location.longitude,
              }}
              title={point.type}
              description={point.key}
            />
          ))}
          {currentLocation && route.length > 0 && (
            <Polyline
              coordinates={[
                {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                },
                ...route.map(point => ({
                  latitude: point.location.latitude,
                  longitude: point.location.longitude,
                })),
              ]}
              strokeColor="#000"
              strokeWidth={3}
            />
          )}
        </MapView>
        <Loader loading={loading} />
      </View>
    </NetworkProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: '100%',
    height: 400,
    marginTop: 20,
  },
});

export default TrackingScreen;
