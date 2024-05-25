import React, {useEffect, useState} from 'react';
import {View, Text, Button, Alert} from 'react-native';
import Radar from 'react-native-radar';
import {useAppContext} from '../context/AppContext';
import DeviceInfo from 'react-native-device-info';
import database from '@react-native-firebase/database';

const TRACKING_OPTIONS = {
  desiredStoppedUpdateInterval: 180, // Intervalo deseado (en segundos) para actualizaciones cuando el usuario está detenido
  fastestStoppedUpdateInterval: 15, // Intervalo más rápido (en segundos) para actualizaciones cuando el usuario está detenido
  desiredMovingUpdateInterval: 60, // Intervalo deseado (en segundos) para actualizaciones cuando el usuario está en movimiento
  fastestMovingUpdateInterval: 15, // Intervalo más rápido (en segundos) para actualizaciones cuando el usuario está en movimiento
  desiredSyncInterval: 10, // Intervalo deseado (en segundos) para sincronizar datos con el servidor
  desiredAccuracy: 'high' as const, // Precisión deseada de la ubicación ("high", "medium", "low", "none")
  stopDuration: 140, // Duración (en segundos) para considerar que el usuario se ha detenido
  stopDistance: 70, // Distancia (en metros) para considerar que el usuario se ha detenido
  sync: 'all' as const, // Qué datos sincronizar con el servidor ("all", "stopsAndExits", "none")
  replay: 'none' as const, // Qué eventos reproducir ("all", "stops", "none")
  useStoppedGeofence: true, // Usar geovallas para detectar cuando el usuario está detenido
  showBlueBar: true, // Mostrar una barra azul en iOS cuando se usa el servicio de ubicación en segundo plano
  stoppedGeofenceRadius: 100, // Radio (en metros) de la geovalla cuando el usuario está detenido
  useMovingGeofence: true, // Usar geovallas para detectar cuando el usuario está en movimiento
  movingGeofenceRadius: 200, // Radio (en metros) de la geovalla cuando el usuario está en movimiento
  syncGeofences: false, // Sincronizar geovallas con el servidor
  useVisits: false, // Usar visitas para detectar entradas y salidas en lugares importantes (opcional)
  useSignificantLocationChanges: false, // Usar cambios significativos de ubicación para actualizaciones (opcional)
  beacons: false, // Usar balizas para detectar proximidad (opcional)
  syncGeofencesLimit: 10, // Límite de geovallas para sincronizar (opcional)
  foregroundServiceEnabled: true, // Habilitar el servicio en primer plano para Android (opcional)
};

const TrackingScreen = () => {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const {id} = useAppContext();

  const pushData = async (path: string | undefined, data: any) => {
    try {
      const newRef = await database().ref(path).push(data);
      console.log('Data pushed successfully with ID: ', newRef.key);
    } catch (error) {
      console.error('Error pushing data: ', error);
    }
  };

  const setData = async (path: any, idData: any, data: any) => {
    try {
      await database().ref(`${path}/${idData}`).set(data);
      console.log('Data set successfully');
    } catch (error) {
      console.error('Error setting data: ', error);
    }
  };

  const updateData = async (path: any, data: any) => {
    try {
      await database().ref(`${path}`).update(data);
      console.log('Data updated successfully');
    } catch (error) {
      console.error('Error updating data: ', error);
    }
  };

  useEffect(() => {
    const getDeviceId = async () => {
      const idDevice = await DeviceInfo.getUniqueId();
      setDeviceId(idDevice);
    };

    getDeviceId();
  }, []);

  useEffect(() => {
    if (deviceId && id !== undefined) {
      setData(
        '/projects/proj_meqjHnqVDFjzhizHdj6Fjq/geoFireGroups/ServiceTracking/',
        id,
        {message: 'Inicial', device: DeviceInfo, date: new Date()},
      );

      setData('/projects/proj_meqjHnqVDFjzhizHdj6Fjq/data/LogLocation/', id, {
        idLoad: id,
        device: DeviceInfo,
        date: new Date(),
        listLocation: {
          device: DeviceInfo,
          date: new Date(),
        },
      });

      // Inicializar Radar con tu clave publicable
      Radar.initialize('prj_test_pk_3821b626231b40d11710b534c370fd250e768b32');

      // Establecer ID de usuario si es necesario
      Radar.setUserId(deviceId);
      Radar.setDescription(id);

      // Solicitar permisos y comenzar el rastreo
      const startTracking = async () => {
        try {
          const status = await Radar.requestPermissions(true); // Solicitar permisos de ubicación en segundo plano
          if (status === 'GRANTED_BACKGROUND') {
            Radar.startTrackingCustom(TRACKING_OPTIONS);
          } else {
            Alert.alert(
              'Permisos no otorgados',
              'Se requieren permisos de ubicación para rastrear tu ubicación.',
            );
          }
        } catch (err) {
          console.error('Error al solicitar permisos:', err);
        }
      };

      startTracking();

      // Agregar listener para actualizaciones de ubicación
      const onLocation = (result: {location: any}) => {
        const {location} = result;
        if (location) {
          // Enviar datos de ubicación al webhook
          console.log(location);
          updateData(
            `/projects/proj_meqjHnqVDFjzhizHdj6Fjq/geoFireGroups/ServiceTracking/${id}/`,
            location,
          );
          pushData(
            `/projects/proj_meqjHnqVDFjzhizHdj6Fjq/data/LogLocation/${id}/listLocation/`,
            location,
          );
        }
      };

      Radar.on('location', onLocation);

      // Limpiar listeners cuando el componente se desmonte
      return () => {
        Radar.off('location', onLocation);
        Radar.stopTracking();
      };
    }
  }, [deviceId, id]);

  return (
    <View>
      <Text>Pantalla de Rastreo</Text>
      <Button
        title="Comenzar Rastreo"
        onPress={() => {
          Radar.startTrackingCustom(TRACKING_OPTIONS);
        }}
      />
      <Button
        title="Detener Rastreo"
        onPress={() => {
          Radar.stopTracking();
        }}
      />
    </View>
  );
};

export default TrackingScreen;
