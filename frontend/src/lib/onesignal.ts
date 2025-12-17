// OneSignal Push Notification Integration
// https://documentation.onesignal.com/docs/web-push-quickstart

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
    OneSignal?: any;
  }
}

const ONESIGNAL_APP_ID = "2c1504c5-bc58-4f46-9677-e236ac95cf52";

/**
 * Initialize OneSignal SDK
 * Called once when app loads
 */
export async function initOneSignal(): Promise<void> {
  if (typeof window === "undefined") return;
  
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal: any) {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true, // For development
      notifyButton: {
        enable: false, // We use custom prompt
      },
    });
  });
}

/**
 * Prompt user for push notification permission
 * Returns true if permission was granted
 */
export async function promptForPushPermission(): Promise<boolean> {
  if (!window.OneSignal) return false;
  
  try {
    const permission = await window.OneSignal.Notifications.requestPermission();
    return permission;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}

/**
 * Get the OneSignal Player ID (device ID)
 * Returns null if not subscribed
 */
export async function getPlayerId(): Promise<string | null> {
  if (!window.OneSignal) return null;
  
  try {
    const playerId = await window.OneSignal.User.PushSubscription.id;
    return playerId || null;
  } catch (error) {
    console.error("Error getting player ID:", error);
    return null;
  }
}

/**
 * Check if user has granted notification permission
 */
export async function hasNotificationPermission(): Promise<boolean> {
  if (!window.OneSignal) return false;
  
  try {
    const permission = await window.OneSignal.Notifications.permission;
    return permission;
  } catch (error) {
    return false;
  }
}

/**
 * Set external user ID (for targeting specific users)
 * Should be called after user logs in
 */
export async function setExternalUserId(userId: string): Promise<void> {
  if (!window.OneSignal) return;
  
  try {
    await window.OneSignal.login(userId);
  } catch (error) {
    console.error("Error setting external user ID:", error);
  }
}

/**
 * Clear external user ID (on logout)
 */
export async function clearExternalUserId(): Promise<void> {
  if (!window.OneSignal) return;
  
  try {
    await window.OneSignal.logout();
  } catch (error) {
    console.error("Error clearing external user ID:", error);
  }
}

/**
 * Register the player ID with our backend
 */
export async function registerPlayerIdWithBackend(token: string): Promise<boolean> {
  const playerId = await getPlayerId();
  if (!playerId) return false;
  
  try {
    const response = await fetch("/api/notifications/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ playerId }),
    });
    
    return response.ok;
  } catch (error) {
    console.error("Error registering player ID with backend:", error);
    return false;
  }
}
