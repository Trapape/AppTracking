import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, Button, Alert} from 'react-native';
import Radar from 'react-native-radar';
import {useAppContext} from '../context/AppContext';
import DeviceInfo from 'react-native-device-info';
import database from '@react-native-firebase/database';
import axios from 'axios';

const TRACKING_OPTIONS = {
  desiredStoppedUpdateInterval: 900, // Intervalo deseado (en segundos) para actualizaciones cuando el usuario está detenido
  fastestStoppedUpdateInterval: 300, // Intervalo más rápido (en segundos) para actualizaciones cuando el usuario está detenido
  desiredMovingUpdateInterval: 300, // Intervalo deseado (en segundos) para actualizaciones cuando el usuario está en movimiento
  fastestMovingUpdateInterval: 60, // Intervalo más rápido (en segundos) para actualizaciones cuando el usuario está en movimiento
  desiredSyncInterval: 120, // Intervalo deseado (en segundos) para sincronizar datos con el servidor
  desiredAccuracy: 'high' as const, // Precisión deseada de la ubicación ("high", "medium", "low", "none")
  stopDuration: 150, // Duración (en segundos) para considerar que el usuario se ha detenido
  stopDistance: 70, // Distancia (en metros) para considerar que el usuario se ha detenido
  sync: 'all' as const, // Qué datos sincronizar con el servidor ("all", "stopsAndExits", "none")
  replay: 'all' as const, // Qué eventos reproducir ("all", "stops", "none")
  useStoppedGeofence: true, // Usar geovallas para detectar cuando el usuario está detenido
  showBlueBar: true, // Mostrar una barra azul en iOS cuando se usa el servicio de ubicación en segundo plano
  stoppedGeofenceRadius: 100, // Radio (en metros) de la geovalla cuando el usuario está detenido
  useMovingGeofence: true, // Usar geovallas para detectar cuando el usuario está en movimiento
  movingGeofenceRadius: 250, // Radio (en metros) de la geovalla cuando el usuario está en movimiento
  syncGeofences: false, // Sincronizar geovallas con el servidor
  useVisits: false, // Usar visitas para detectar entradas y salidas en lugares importantes (opcional)
  useSignificantLocationChanges: true, // Usar cambios significativos de ubicación para actualizaciones (opcional)
  beacons: false, // Usar balizas para detectar proximidad (opcional)
  syncGeofencesLimit: 10, // Límite de geovallas para sincronizar (opcional)
  foregroundServiceEnabled: true, // Habilitar el servicio en primer plano para Android (opcional)
};

const TrackingScreen = () => {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const {id} = useAppContext();

  const sendLocationWebhook = async (data: any) => {
    try {
      const response = await axios.post(
        'https://us-central1-trapape.cloudfunctions.net/handleRadarLocation',
        data,
      );
      console.log('Location data sent successfully:', response.data);
    } catch (error) {
      console.error('Error sending location data:', error);
    }
  };

  const sendEventsWebhook = async (data: any) => {
    try {
      const response = await axios.post(
        'https://us-central1-trapape.cloudfunctions.net/handleRadarEvents',
        data,
      );
      console.log('Events data sent successfully:', response.data);
    } catch (error) {
      console.error('Error sending events data:', error);
    }
  };

  const setData = async (path: any, idData: any, data: any) => {
    try {
      await database().ref(`${path}/${idData}`).update(data);
      console.log('Data set successfully');
    } catch (error) {
      console.error('Error setting data: ', error);
    }
  };

  const fetchAndCreateGeofences = useCallback(async () => {
    try {
      const snapshot = await database()
        .ref(`/projects/proj_meqjHnqVDFjzhizHdj6Fjq/data/Loads/${id}/Punto`)
        .once('value');

      const puntos = snapshot.val();
      const allPoints = [];

      // Agregar puntos de recolección y entrega
      if (puntos.recoleccion) {
        allPoints.push({
          ...puntos.recoleccion,
          type: 'recoleccion',
          key: 'recoleccion',
        });
      }
      if (puntos.entrega) {
        allPoints.push({
          ...puntos.entrega,
          type: 'entrega',
          key: 'entrega',
        });
      }

      // Agregar waypoints
      if (Array.isArray(puntos.waypoints)) {
        puntos.waypoints.forEach((waypoint: any, index: any) => {
          allPoints.push({
            ...waypoint,
            type: 'waypoint',
            key: `waypoint_${index}`,
          });
        });
      }

      // Crear geofences para todos los puntos
      for (const point of allPoints) {
        const {latitude, longitude} = point.location;
        const geofence = {
          tag: `tt_${id}`, // Generar un tag único
          externalId: `load_${id}_${point.key}`,
          description: `Geofence for load ${id} ${point.key}`,
          coordinates: [longitude, latitude],
          radius: point.radius || 1000, // default radius if not provided
          userIds: [deviceId], // add device ID to userIds array
          live: false,
        };

        await createGeofence(geofence);
      }
    } catch (error) {
      console.error('Error fetching geofences:', error);
    }
  }, [deviceId, id]);

  const createGeofence = async (geofence: {
    tag: any;
    externalId: any;
    description: any;
    coordinates: any;
    radius: any;
    userIds: any;
  }) => {
    try {
      const response = await fetch(
        `https://api.radar.io/v1/geofences/${geofence.tag}/${geofence.externalId}`,
        {
          method: 'PUT',
          headers: {
            Authorization:
              'prj_live_sk_5c0ef8c2755aefb837e398da83aad8062c57aa6b',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: geofence.description,
            type: 'circle',
            coordinates: geofence.coordinates,
            radius: geofence.radius,
            userIds: geofence.userIds,
            dwellThreshold: 10,
          }),
        },
      );

      const data = await response.json();
      console.log('Geofence created:', data);
    } catch (error) {
      console.error('Error creating geofence:', error);
    }
  };

  useEffect(() => {
    const getDeviceId = async () => {
      const idDevice = await DeviceInfo.getUniqueId();
      setDeviceId(idDevice);
    };

    getDeviceId();
  }, []);

  // Solicitar permisos y comenzar el rastreo
  const startTracking = async () => {
    try {
      const status = await Radar.requestPermissions(true); // Solicitar permisos de ubicación en segundo plano
      if (status === 'GRANTED_BACKGROUND') {
        Radar.setForegroundServiceOptions({
          text: 'Seguimiento de ubicación iniciado',
          title: 'Actualizaciones de ubicación',
          updatesOnly: false,
          importance: 2,
          activity: 'com.AppTracking',
        });
        Radar.startTrackingCustom(TRACKING_OPTIONS);
      } else {
        Alert.alert(
          'Permisos no otorgados',
          'Se requieren permisos de ubicación para rastrear tu ubicación.',
        );
      }
    } catch (err) {
      console.error('Error al solicitar permisos:', err);
      Alert.alert((err as Error).toString());
    }
  };

  const isTracking = async () => {
    try {
      const status = Radar.isTracking();
      Alert.alert(Radar.isTracking.toString());
      console.log('Tracking status:', status);
    } catch (err) {
      console.error('Error al obtener el estado de rastreo:', err);
      Alert.alert((err as Error).toString());
    }
  };

  useEffect(() => {
    const initializeTracking = async () => {
      if (deviceId && id !== undefined) {
        await setData(
          '/projects/proj_meqjHnqVDFjzhizHdj6Fjq/geoFireGroups/ServiceTracking/',
          id,
          {message: 'Inicial', device: DeviceInfo, date: new Date()},
        );

        await setData(
          '/projects/proj_meqjHnqVDFjzhizHdj6Fjq/data/LogLocation/',
          id,
          {
            idLoad: id,
            device: DeviceInfo,
            date: new Date(),
            listLocation: {
              device: DeviceInfo,
              date: new Date(),
            },
          },
        );

        Radar.initialize(
          'prj_live_pk_5463e9a31811973fff88f5cca6c68b4a9923a80b',
        );
        Radar.setUserId(deviceId);
        Radar.setDescription(id);
        Radar.setLogLevel('debug');
        await fetchAndCreateGeofences();

        const onLocation = (result: {location: any}) => {
          const {location} = result;
          const deviceTimestamp = new Date();

          if (location) {
            const data = {
              id,
              location,
              deviceTimestamp,
              deviceId,
            };
            sendLocationWebhook(data);
          } else {
            console.error('No location data available');
          }
        };

        Radar.on('location', onLocation);

        const onEvents = (result: {events: any}) => {
          const {events} = result;
          if (events && events.length > 0) {
            const deviceTimestamp = new Date();
            events.forEach((event: any) => {
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
        };

        Radar.on('events', onEvents);

        Radar.on('error', (err: any) => {
          console.error('Error event:', err);
        });

        Radar.on('clientLocation', (result: any) => {
          console.warn('Error event:', result);
        });

        startTracking();
      }
    };

    initializeTracking();
  }, [deviceId, id, fetchAndCreateGeofences]);

  return (
    <View>
      <Text>Pantalla de Rastreo</Text>
      <Button
        title="Comenzar Rastreo"
        onPress={() => {
          startTracking();
        }}
      />
      <Button
        title="Detener Rastreo"
        onPress={() => {
          Radar.stopTracking();
        }}
      />
      <Button
        title="¿Estoy rastreando?"
        onPress={() => {
          isTracking();
        }}
      />
    </View>
  );
};

export default TrackingScreen;
