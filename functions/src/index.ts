const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {Logging} = require('@google-cloud/logging');
admin.initializeApp();
const logging = new Logging();
const log = logging.log('my-log');

exports.handleRadarLocation = functions.https.onRequest(
  async (
    req: {body: any},
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        send: {(arg0: string): any; new (): any};
      };
    },
  ) => {
    const data = req.body;
    const {id, location, deviceTimestamp, deviceId} = data;

    if (!id || !location || !deviceTimestamp || !deviceId) {
      const metadata = {
        deviceTimestamp: deviceTimestamp,
        resource: {type: 'cloud_function'},
        severity: 'ERROR',
        deviceId: deviceId,
      };
      const entry = log.entry(metadata, {
        message: 'Missing fields',
        error: {
          id,
          location,
          deviceTimestamp,
          deviceId,
        },
      });
      await log.write(entry);
      return res.status(400).send('Missing fields');
    }

    try {
      const serverTimestamp = admin.database.ServerValue.TIMESTAMP;
      await admin
        .database()
        .ref(
          `/projects/proj_meqjHnqVDFjzhizHdj6Fjq/geoFireGroups/ServiceTracking/${id}`,
        )
        .set({
          location,
          deviceTimestamp,
          serverTimestamp,
          deviceId,
        });
      await admin
        .database()
        .ref(
          `/projects/proj_meqjHnqVDFjzhizHdj6Fjq/data/LogLocation/${id}/listLocation/`,
        )
        .push({
          location,
          deviceTimestamp,
          serverTimestamp,
        });
      return res.status(200).send('Location data saved successfully');
    } catch (error) {
      console.error('Error saving events data:', error);

      // Logging the error
      const metadata = {
        deviceTimestamp: deviceTimestamp,
        resource: {type: 'cloud_function'},
        severity: 'ERROR',
        deviceId: deviceId,
      };
      const entry = log.entry(metadata, {
        message: 'Error saving location data',
        error,
      });
      await log.write(entry);

      return res.status(500).send('Internal Server Error');
    }
  },
);

exports.handleRadarEvents = functions.https.onRequest(
  async (
    req: {body: any},
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        send: {(arg0: string): any; new (): any};
      };
    },
  ) => {
    const data = req.body;
    const {id, event, deviceTimestamp, deviceId} = data;

    if (!id || !event || !deviceTimestamp || !deviceId) {
      const metadata = {
        deviceTimestamp: deviceTimestamp,
        resource: {type: 'cloud_function'},
        severity: 'ERROR',
        deviceId: deviceId,
      };
      const entry = log.entry(metadata, {
        message: 'Missing fields',
        error: {
          id,
          location,
          deviceTimestamp,
          deviceId,
        },
      });
      await log.write(entry);
      return res.status(400).send('Missing fields');
    }

    try {
      const serverTimestamp = admin.database.ServerValue.TIMESTAMP;
      const parts = event.geofence.externalId.split('_');
      const eventExternalId = parts[2] || event.geofence.externalId;
      const indexEventExternalId = parts[3] || null;

      const logRef = admin
        .database()
        .ref(
          `/projects/proj_meqjHnqVDFjzhizHdj6Fjq/data/LogEventGeofence/${id}/${eventExternalId}`,
        );
      await logRef.push({
        event,
        deviceTimestamp,
        serverTimestamp,
        deviceId,
      });

      const pathStatusBase = `/projects/proj_meqjHnqVDFjzhizHdj6Fjq/data/Loads/${id}/config/config`;
      let updateStatusData = {}; // Objeto para actualizar el estado de la carga
      const pathBase = `/projects/proj_meqjHnqVDFjzhizHdj6Fjq/data/Loads/${id}/Punto`;
      let updateEventData = {}; // Objeto para actualizar datos específicos del evento
      let puntoRef; // Referencia a la ruta específica del punto en la base de datos

      // Determinar la ruta y los datos a actualizar en función del tipo de evento y el id externo del evento
      // Aqui hay un problema si las geocercas estan encimadas, revisar!
      if (eventExternalId === 'recoleccion') {
        if (event.type === 'user.entered_geofence') {
          puntoRef = `${pathBase}/recoleccion`;
          updateEventData = {entered_geofence: event.actualCreatedAt};
          updateStatusData = {estatusCarga: 'En recolección'};
        } else if (event.type === 'user.exited_geofence') {
          puntoRef = `${pathBase}/recoleccion`;
          updateEventData = {exited_geofence: event.actualCreatedAt};
          updateStatusData = {estatusCarga: 'En tránsito'};
        }
      } else if (eventExternalId === 'waypoint' && indexEventExternalId) {
        puntoRef = `${pathBase}/waypoints/${indexEventExternalId}`;
        if (event.type === 'user.entered_geofence') {
          updateEventData = {entered_geofence: event.actualCreatedAt};
          updateStatusData = {estatusCarga: 'En tránsito'};
        } else if (event.type === 'user.exited_geofence') {
          updateEventData = {exited_geofence: event.actualCreatedAt};
          updateStatusData = {estatusCarga: 'En tránsito'};
        }
      } else if (eventExternalId === 'entrega') {
        if (event.type === 'user.entered_geofence') {
          puntoRef = `${pathBase}/entrega`;
          updateEventData = {entered_geofence: event.actualCreatedAt};
          updateStatusData = {estatusCarga: 'En entrega'};
        } else if (event.type === 'user.exited_geofence') {
          puntoRef = `${pathBase}/entrega`;
          updateEventData = {exited_geofence: event.actualCreatedAt};
          updateStatusData = {estatusCarga: 'En proceso de finalización'};
        }
      }

      // Actualizar la base de datos con los datos específicos del evento y el estado de la carga
      if (puntoRef) {
        await admin.database().ref(puntoRef).update(updateEventData);
      }

      if (Object.keys(updateStatusData).length > 0) {
        await admin.database().ref(pathStatusBase).update(updateStatusData);
      }

      return res.status(200).send('Events data saved successfully');
    } catch (error) {
      console.error('Error saving events data:', error);

      // Logging the error
      const metadata = {
        deviceTimestamp: deviceTimestamp,
        resource: {type: 'cloud_function'},
        severity: 'ERROR',
        deviceId: deviceId,
      };
      const entry = log.entry(metadata, {
        message: 'Error saving location data',
        error,
      });
      await log.write(entry);

      return res.status(500).send('Internal Server Error');
    }
  },
);
