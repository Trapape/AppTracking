import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, Button, Alert} from 'react-native';
import Radar from 'react-native-radar';
import {useAppContext} from '../context/AppContext';
import DeviceInfo from 'react-native-device-info';
import database from '@react-native-firebase/database';

const TRACKING_OPTIONS = {
  desiredStoppedUpdateInterval: 1800, // Intervalo deseado (en segundos) para actualizaciones cuando el usuario está detenido
  fastestStoppedUpdateInterval: 300, // Intervalo más rápido (en segundos) para actualizaciones cuando el usuario está detenido
  desiredMovingUpdateInterval: 300, // Intervalo deseado (en segundos) para actualizaciones cuando el usuario está en movimiento
  fastestMovingUpdateInterval: 60, // Intervalo más rápido (en segundos) para actualizaciones cuando el usuario está en movimiento
  desiredSyncInterval: 140, // Intervalo deseado (en segundos) para sincronizar datos con el servidor
  desiredAccuracy: 'high' as const, // Precisión deseada de la ubicación ("high", "medium", "low", "none")
  stopDuration: 150, // Duración (en segundos) para considerar que el usuario se ha detenido
  stopDistance: 70, // Distancia (en metros) para considerar que el usuario se ha detenido
  sync: 'all' as const, // Qué datos sincronizar con el servidor ("all", "stopsAndExits", "none")
  replay: 'all' as const, // Qué eventos reproducir ("all", "stops", "none")
  useStoppedGeofence: true, // Usar geovallas para detectar cuando el usuario está detenido
  showBlueBar: true, // Mostrar una barra azul en iOS cuando se usa el servicio de ubicación en segundo plano
  stoppedGeofenceRadius: 100, // Radio (en metros) de la geovalla cuando el usuario está detenido
  useMovingGeofence: true, // Usar geovallas para detectar cuando el usuario está en movimiento
  movingGeofenceRadius: 200, // Radio (en metros) de la geovalla cuando el usuario está en movimiento
  syncGeofences: false, // Sincronizar geovallas con el servidor
  useVisits: false, // Usar visitas para detectar entradas y salidas en lugares importantes (opcional)
  useSignificantLocationChanges: false, // Usar cambios significativos de ubicación para actualizaciones (opcional)
  beacons: true, // Usar balizas para detectar proximidad (opcional)
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
          radius: point.radius || 500, // default radius if not provided
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
  }) => {
    try {
      const response = await fetch(
        `https://api.radar.io/v1/geofences/${geofence.tag}/${geofence.externalId}`,
        {
          method: 'PUT',
          headers: {
            Authorization:
              'prj_test_sk_5b8c767d2b13433d0db3e42ae72fc0933b8ea76f',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: geofence.description,
            type: 'circle',
            coordinates: geofence.coordinates,
            radius: geofence.radius,
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
          text: 'Location tracking started',
          title: 'Location updates',
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
          'prj_test_pk_3821b626231b40d11710b534c370fd250e768b32',
        );
        Radar.setUserId(deviceId);
        Radar.setDescription(id);

        await fetchAndCreateGeofences();

        startTracking();

        const onLocation = (result: {location: any}) => {
          const {location} = result;
          const date = new Date();

          if (location) {
            updateData(
              `/projects/proj_meqjHnqVDFjzhizHdj6Fjq/geoFireGroups/ServiceTracking/${id}/`,
              {location, date},
            );
            pushData(
              `/projects/proj_meqjHnqVDFjzhizHdj6Fjq/data/LogLocation/${id}/listLocation/`,
              {location, date},
            );
          }
        };

        Radar.on('location', onLocation);

        const onEvents = (result: {events: any}) => {
          const {events} = result;
          events.forEach(async (event: any) => {
            const externalId = parseExternalId(event.geofence.externalId);
            console.log('Geofence event:', event.geofence._id);
            await pushData(
              `/projects/proj_meqjHnqVDFjzhizHdj6Fjq/data/LogEventGeofence/${externalId?.id}/${externalId?.key}/`,
              {
                event: event.type,
                geofence: event,
                timestamp: new Date(),
              },
            );
          });
        };

        Radar.on('events', onEvents);
      }
    };

    initializeTracking();
  }, [deviceId, id, fetchAndCreateGeofences]);

  const parseExternalId = (externalId: string) => {
    const regex = /^load_(.+)_point_(.+)$/;
    const match = externalId.match(regex);
    if (match) {
      return {
        id: match[1],
        key: match[2],
      };
    }
    return null;
  };

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
    </View>
  );
};

export default TrackingScreen;
