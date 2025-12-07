/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/analyticsService.ts
import {
	analytics,
	logEvent as firebaseLogEventWrapper,
	setAnalyticsEnabled as setAnalyticsFlag,
} from "../firebase";

/**
 * High-level analytics service for your app (MVP).
 * - Provides consent control
 * - Exposes clear trackX functions for common events
 * - Hooks for global error reporting
 *
 * Usage:
 * import * as analyticsService from "@/services/analyticsService";
 * analyticsService.trackAppLoaded();
 */

/* -------- consent & helpers -------- */
const ANALYTICS_STORAGE_KEY = "analytics_enabled";

/**
 * Read persisted consent (defaults to true for MVP)
 */
export function getAnalyticsConsent(): boolean {
	try {
		const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
		if (raw === null) return true; // default: enabled
		return raw === "true";
	} catch {
		return true;
	}
}

/**
 * Turn analytics on (persists choice)
 */
export async function enableAnalytics() {
	localStorage.setItem(ANALYTICS_STORAGE_KEY, "true");
	// instruct firebase analytics to collect if API available
	try {
		await setAnalyticsFlag(true);
	} catch {
		// noop
	}
}

/**
 * Turn analytics off (persists choice)
 */
export async function disableAnalytics() {
	localStorage.setItem(ANALYTICS_STORAGE_KEY, "false");
	try {
		await setAnalyticsFlag(false);
	} catch {
		// noop
	}
}

/**
 * Internal safe track function that respects consent and analytics init.
 */
function track(event: string, params?: Record<string, any>) {
	try {
		if (!getAnalyticsConsent()) return;
		if (!analytics) return;
		// use wrapper exported from firebase.ts
		firebaseLogEventWrapper(analytics, event, params);
	} catch (err) {
		console.warn("track failed:", err);
	}
}

/* -------- core MVP events -------- */

export const trackAppLoaded = () => track("app_loaded");

export const trackPageView = (path: string) =>
	track("page_view", { page_path: path });

export const trackLogin = (method = "password") => track("login", { method });

export const trackSignup = (method = "password") =>
	track("sign_up", { method });

export const trackLogout = () => track("logout");

/* -------- chat / ai events -------- */

export const trackChatOpened = () => track("chat_opened");
export const trackMessageSent = (length: number, channel?: string) =>
	track("message_sent", { length, channel });

export const trackResponseReceived = (tokens?: number) =>
	track("ai_response_received", { tokens });

/* -------- feature usage -------- */

export const trackFeatureUsed = (feature: string) =>
	track("feature_used", { feature });
export const trackButtonClick = (id: string) => track("button_clicked", { id });

/* -------- monetization -------- */

export const trackSubscriptionViewed = (plan?: string) =>
	track("subscription_viewed", { plan });
export const trackSubscriptionStarted = (plan?: string, price?: number) =>
	track("subscription_started", { plan, price });
export const trackPaymentSuccess = (
	amount?: number,
	plan?: string,
	txId?: string
) => track("payment_success", { amount, plan, txId });

/* -------- performance & api metrics -------- */

export const trackApiLatency = (endpoint: string, ms: number) =>
	track("api_latency", { endpoint, latency_ms: Math.round(ms) });

export const trackPerfMetric = (name: string, value: number) =>
	track("perf_metric", { name, value });

/* -------- error & crash reporting (MVP) -------- */

/**
 * Report an app-level error. This sends an analytics event and logs into Crashlytics (if available).
 * For Crashlytics full features, consider using the SDK APIs in production.
 */
export function trackError(message: string, extra?: Record<string, any>) {
	try {
		track("app_error", { message: String(message).slice(0, 1000), ...extra });
	} catch (e) {
		console.warn("trackError failed:", e);
	}
}

/* -------- convenience: attach global error handlers -------- */

export function attachGlobalErrorHandlers() {
	// on uncaught errors
	window.onerror = function (message, source, lineno, colno, err) {
		try {
			const stack =
				err && (err as Error).stack ? (err as Error).stack : undefined;
			trackError(String(message), { source, lineno, colno, stack });
		} catch {
			// noop
		}
	};

	// unhandled promise rejections
	window.addEventListener("unhandledrejection", (ev) => {
		try {
			const reason = (ev && (ev as PromiseRejectionEvent).reason) || "unknown";
			trackError("unhandledrejection", { reason });
		} catch {
			// noop
		}
	});
}
