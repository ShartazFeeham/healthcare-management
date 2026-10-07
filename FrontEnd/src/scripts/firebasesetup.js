// Push notifications are delivered through the local notification service, so no
// third-party messaging SDK is used. Each browser gets a stable local device code
// that the notification service can address.
export default function getDeviceCode() {
  try {
    let code = localStorage.getItem("deviceCode");
    if (!code) {
      code = "local-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("deviceCode", code);
    }
    return code;
  } catch (error) {
    return null;
  }
}
