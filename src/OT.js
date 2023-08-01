import { NativeModules, NativeEventEmitter, PermissionsAndroid } from 'react-native';
import { each } from 'underscore';

const OT = NativeModules.OTSessionManager;
const nativeEvents = new NativeEventEmitter(OT);

const checkAndroidPermissions = () => new Promise((resolve, reject) => {
  PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.CAMERA,
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO])
    .then((result) => {
      const permissionsError = {};
      permissionsError.permissionsDenied = [];
      each(result, (permissionValue, permissionType) => {
        if (permissionValue === 'denied') {
          permissionsError.permissionsDenied.push(permissionType);
          permissionsError.type = 'Permissions error';
        }
      });
      if (permissionsError.permissionsDenied.length > 0) {
        reject(permissionsError);
      } else {
        resolve();
      }
    })
    .catch((error) => {
      reject(error);
    });
});

const setNativeEvents = (events) => {
  const eventNames = Object.keys(events);
  OT.setNativeEvents(eventNames);

  let hasRegisteredEvents;
  if (nativeEvents.listeners) {
    const allEvents = nativeEvents.listeners();
    hasRegisteredEvents = (eventType) => allEvents.includes(eventType);
  } else {
    hasRegisteredEvents = (eventType) => nativeEvents.listenerCount(eventType) > 0;
  }

  each(events, (eventHandler, eventType) => {
    // Replace existing listeners with the new ones.
    // Subscription only happens once when the component is getting mounted, existing listeners
    // mean that the old component for the same session did not clean up properly. This may
    // happen when connection was interrupted, for example because internet connection failed.
    // In this case `removeNativeEvents` will not be called, and old listeners for the session
    // will not be cleaned up.
    if (hasRegisteredEvents(eventType)) {
      nativeEvents.removeAllListeners(eventType);
    }

    nativeEvents.addListener(eventType, eventHandler);
  });
};

const removeNativeEvents = (events) => {
  const eventNames = Object.keys(events);
  OT.removeNativeEvents(eventNames);
  each(events, (_eventHandler, eventType) => {
    nativeEvents.removeAllListeners(eventType);
  });
};

export {
  OT,
  nativeEvents,
  checkAndroidPermissions,
  setNativeEvents,
  removeNativeEvents,
};
