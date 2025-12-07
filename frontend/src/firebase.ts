/* eslint-disable @typescript-eslint/no-explicit-any */
// src/firebase.ts
import { initializeApp } from "firebase/app";
import {
	getAnalytics,
	logEvent as firebaseLogEvent,
	setAnalyticsCollectionEnabled,
	type Analytics,
} from "firebase/analytics";
import { getPerformance } from "firebase/performance";
import {
	getRemoteConfig,
	fetchAndActivate,
	type RemoteConfig,
} from "firebase/remote-config";

/**
 * IMPORTANT:
 * Keep your firebaseConfig secret (do not push to public repos).
 * Replace values below with your config.
 */
const firebaseConfig = {
	apiKey: "AIzaSyA6NLM3pcCE-j5YZCE1gPbT3AC5ZfDW2-k",
	authDomain: "vachnamrutai.firebaseapp.com",
	projectId: "vachnamrutai",
	storageBucket: "vachnamrutai.firebasestorage.app",
	messagingSenderId: "209248343347",
	appId: "1:209248343347:web:e65104e099287bec389a46",
	measurementId: "G-5GR7NE4CP6",
};

// Initialize app (safe to call on server, nothing heavy happens)
const app = initializeApp(firebaseConfig);

// Browser-only instances
let analytics: Analytics | null = null;
let perf: ReturnType<typeof getPerformance> | null = null;
let remoteConfig: RemoteConfig | null = null;

if (typeof window !== "undefined") {
	try {
		analytics = getAnalytics(app);
	} catch (err) {
		// analytics may fail in some environments; swallow safely
		console.warn("Firebase analytics init failed:", err);
		analytics = null;
	}

	try {
		perf = getPerformance(app);
	} catch (err) {
		// performance may not be supported in all browsers
		console.warn("Firebase performance init failed:", err);
		perf = null;
	}

	try {
		remoteConfig = getRemoteConfig(app);
		// Useful short interval for MVP — increase for production
		remoteConfig.settings = {
			minimumFetchIntervalMillis: 60 * 1000,
			fetchTimeoutMillis: 60 * 1000,
		};
		// fetch remote values (best-effort)
		fetchAndActivate(remoteConfig).catch((e) => {
			console.warn("Remote config fetch failed:", e);
		});
	} catch (err) {
		console.warn("Remote config init failed:", err);
		remoteConfig = null;
	}
}

/**
 * Safe wrapper for logEvent. Use this instead of calling firebaseLogEvent everywhere.
 * This function will no-op if analytics is not initialized.
 */
export function logEvent(
	a: Analytics | null,
	name: string,
	params?: Record<string, any>
) {
	if (!a) return;
	try {
		firebaseLogEvent(a, name, params);
	} catch (err) {
		console.warn("firebase logEvent failed:", err);
	}
}

/**
 * Enable/disable analytics collection at runtime (consent).
 * setAnalyticsCollectionEnabled works only if analytics exists and the method is available.
 */
export async function setAnalyticsEnabled(enabled: boolean) {
	if (!analytics) return;
	try {
		setAnalyticsCollectionEnabled(analytics, enabled);
		localStorage.setItem("analytics_enabled", enabled ? "true" : "false");
	} catch (err) {
		console.warn("Failed to set analytics collection flag:", err);
	}
}

export { app, analytics, perf, remoteConfig };
