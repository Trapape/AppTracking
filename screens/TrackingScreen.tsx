import React, {useCallback, useEffect, useState} from 'react';
import {View, Button, Alert, StyleSheet} from 'react-native';
import Radar from 'react-native-radar';
import {useAppContext} from '../context/AppContext';
import DeviceInfo from 'react-native-device-info';
import database from '@react-native-firebase/database';
import axios from 'axios';
import MapView, {Marker, Polyline} from 'react-native-maps';
import Loader from '../componeentes/Loader';

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

      if (!puntos) {
        console.error('No geofence points available');
        return;
      }

      const allPoints: Point[] = [];

      if (puntos.recoleccion) {
        allPoints.push({
          ...puntos.recoleccion,
          type: 'recoleccion',
          key: 'recoleccion',
        });
      }

      if (Array.isArray(puntos.waypoints)) {
        puntos.waypoints.forEach((waypoint: any, index: number) => {
          allPoints.push({
            ...waypoint,
            type: 'waypoint',
            key: `waypoint_${index}`,
            location: waypoint.location || {
              latitude: waypoint.latitude,
              longitude: waypoint.longitude,
            },
          });
        });
      }

      if (puntos.entrega) {
        allPoints.push({
          ...puntos.entrega,
          type: 'entrega',
          key: 'entrega',
        });
      }

      setRoute(allPoints);

      for (const point of allPoints) {
        const {latitude, longitude} = point.location;
        const geofence = {
          tag: `tt_${id}`,
          externalId: `load_${id}_${point.key}`,
          description: `Geofence for load ${id} ${point.key}`,
          coordinates: [longitude, latitude],
          radius: point.radius || 750,
          userIds: [deviceId],
          live: false,
        };

        await createGeofence(geofence);
      }
    } catch (error) {
      console.error('Error fetching geofences:', error);
    }
  }, [deviceId, id]);

  const createGeofence = async (geofence: {
    tag: string;
    externalId: string;
    description: string;
    coordinates: number[];
    radius: number;
    userIds: (string | null)[];
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

  useEffect(() => {
    const getDeviceId = async () => {
      const idDevice = await DeviceInfo.getUniqueId();
      setDeviceId(idDevice);
    };

    getDeviceId();
  }, []);

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

  const isTracking = async () => {
    try {
      const result = await Radar.getLocation();
      Alert.alert('Estado de rastreo', JSON.stringify(result));
      console.log('Tracking status:', result);
    } catch (err) {
      console.error('Error al obtener el estado de rastreo:', err);
      Alert.alert(
        'Error al obtener el estado de rastreo',
        (err as Error).message || JSON.stringify(err),
      );
      Radar.stopTracking();
    }
  };

  useEffect(() => {
    const initializeTracking = async () => {
      setLoading(true);
      try {
        Radar.stopTracking();
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
              setCurrentLocation({
                latitude: location.latitude,
                longitude: location.longitude,
              });
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
            console.warn('clientLocation event:', result);
          });

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
        Radar.stopTracking();
        setLoading(false);
      }
    };

    initializeTracking();
  }, [deviceId, id, fetchAndCreateGeofences]);

  return (
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
          Radar.stopTracking();
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
