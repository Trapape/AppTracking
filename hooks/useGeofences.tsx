import {useCallback} from 'react';
import database from '@react-native-firebase/database';
import api from './api';

interface Point {
  location: {
    latitude: number;
    longitude: number;
  };
  type: string;
  key: string;
  radius?: number;
}

const useGeofences = (id: any, deviceId: string | null) => {
  const fetchGeofenceByTagAndExternalId = useCallback(
    async (tag: string, externalId: string) => {
      try {
        const response = await api.get(`/geofences/${tag}/${externalId}`);
        if (response.status === 200 && response.data.geofence) {
          return response.data.geofence;
        }
        return false;
      } catch (unknownError) {
        const error = unknownError as {response?: {status: number; data: any}};
        if (error.response) {
          const {status} = error.response;
          if (status === 404) {
            // No geofence found
            return null;
          } else if (
            status === 400 ||
            status === 401 ||
            status === 402 ||
            status === 403 ||
            status === 409 ||
            status === 429 ||
            status === 451 ||
            status === 500 ||
            status === 503
          ) {
            console.error(
              'Geofence request error:',
              status,
              error.response.data,
            );
          } else {
            // Handle other types of errors (e.g., network issues)
            console.error('Error fetching geofence:', error);
          }
        } else {
          // Network or other errors without a response
          console.error('Error fetching geofence:', error);
        }
        return false;
      }
    },
    [],
  );

  const updateGeofence = useCallback(async (geofence: any) => {
    try {
      await api.put(
        `/geofences/${geofence.tag}/${geofence.externalId}`,
        geofence,
      );
    } catch (error) {
      console.error('Error updating geofence:', error);
    }
  }, []);

  const createGeofence = useCallback(async (geofence: any) => {
    try {
      await api.put(
        `/geofences/${geofence.tag}/${geofence.externalId}`,
        geofence,
      );
    } catch (error) {
      console.error('Error creating geofence:', error);
    }
  }, []);

  const fetchAndCreateGeofences = useCallback(async (): Promise<Point[]> => {
    try {
      const snapshot = await database()
        .ref(`/projects/proj_meqjHnqVDFjzhizHdj6Fjq/data/Loads/${id}/Punto`)
        .once('value');

      const puntos = snapshot.val();

      if (!puntos) {
        console.error('No geofence points available');
        return [];
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
        allPoints.push({...puntos.entrega, type: 'entrega', key: 'entrega'});
      }

      return allPoints;
    } catch (error) {
      console.error('Error fetching geofences:', error);
      return [];
    }
  }, [id]);

  const processGeofences = useCallback(
    async (allPoints: Point[]) => {
      for (const point of allPoints) {
        const {latitude, longitude} = point.location;
        const geofenceId = `load_${id}_${point.key}`;
        const tag = `tt_${id}`;

        const existingGeofence = await fetchGeofenceByTagAndExternalId(
          tag,
          geofenceId,
        );

        let geofence;
        if (existingGeofence) {
          const existingUserIds = existingGeofence.userIds
            ? existingGeofence.userIds.split(',')
            : [];
          if (!existingUserIds.includes(deviceId!)) {
            geofence = {
              ...existingGeofence,
              userIds: Array.from(new Set([...existingUserIds, deviceId])).join(
                ',',
              ),
            };
            await updateGeofence(geofence);
          }
        } else {
          geofence = {
            tag,
            externalId: geofenceId,
            description: `Geofence for load ${id} ${point.key}`,
            type: 'circle',
            coordinates: [longitude, latitude],
            radius: point.radius || 750,
            userIds: deviceId,
            enabled: true,
          };
          await createGeofence(geofence);
        }
      }
    },
    [
      createGeofence,
      deviceId,
      fetchGeofenceByTagAndExternalId,
      id,
      updateGeofence,
    ],
  );

  return {fetchAndCreateGeofences, processGeofences};
};

export default useGeofences;
