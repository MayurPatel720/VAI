/**
 * OneSignal Push Notification Service
 * Handles sending push notifications to users via OneSignal API
 */

const ONESIGNAL_APP_ID = "2c1504c5-bc58-4f46-9677-e236ac95cf52";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || "YOUR_ONESIGNAL_REST_API_KEY";

/**
 * Send a push notification to a specific user by their OneSignal player ID
 * @param {string} playerId - OneSignal player ID
 * @param {object} notification - Notification data
 */
async function sendPushToUser(playerId, { title, message, url = null, data = {} }) {
	if (!playerId) {
		console.log("No player ID provided, skipping push notification");
		return false;
	}

	try {
		const response = await fetch("https://onesignal.com/api/v1/notifications", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`,
			},
			body: JSON.stringify({
				app_id: ONESIGNAL_APP_ID,
				include_player_ids: [playerId],
				headings: { en: title },
				contents: { en: message },
				url: url,
				data: data,
				chrome_web_icon: "https://vachnamrutai.web.app/logo.png",
			}),
		});

		const result = await response.json();
		
		if (result.errors) {
			console.error("OneSignal error:", result.errors);
			return false;
		}
		
		console.log(`Push sent to player ${playerId}:`, result.id);
		return true;
	} catch (error) {
		console.error("Failed to send push notification:", error);
		return false;
	}
}

/**
 * Send a push notification to all subscribed users
 */
async function sendPushToAll({ title, message, url = null }) {
	try {
		const response = await fetch("https://onesignal.com/api/v1/notifications", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`,
			},
			body: JSON.stringify({
				app_id: ONESIGNAL_APP_ID,
				included_segments: ["Subscribed Users"],
				headings: { en: title },
				contents: { en: message },
				url: url,
				chrome_web_icon: "https://vachnamrutai.web.app/logo.png",
			}),
		});

		const result = await response.json();
		console.log("Push sent to all users:", result);
		return result;
	} catch (error) {
		console.error("Failed to send push to all:", error);
		return null;
	}
}

/**
 * Send chat completion notification
 */
async function sendChatCompleteNotification(playerId, sessionTitle) {
	return sendPushToUser(playerId, {
		title: "Response Ready 🙏",
		message: `Vachanamrut AI has responded to your question`,
		url: "/chat",
		data: { type: "chat_complete" },
	});
}

/**
 * Send subscription expiry reminder
 */
async function sendSubscriptionReminder(playerId, daysLeft, plan) {
	const titles = {
		7: "Subscription Reminder",
		3: "Subscription Expiring Soon",
		1: "Last Day of Subscription",
	};

	return sendPushToUser(playerId, {
		title: titles[daysLeft] || "Subscription Reminder",
		message: `Your ${plan} plan expires in ${daysLeft} day${daysLeft > 1 ? "s" : ""}. Renew to continue unlimited access.`,
		url: "/pricing",
		data: { type: "subscription_expiry", daysLeft, plan },
	});
}

/**
 * Send welcome notification to new user
 */
async function sendWelcomeNotification(playerId, firstName) {
	return sendPushToUser(playerId, {
		title: "Jay Swaminarayan! 🙏",
		message: `Welcome ${firstName}! Get spiritual guidance from the Vachanamrut anytime.`,
		url: "/chat",
		data: { type: "welcome" },
	});
}

module.exports = {
	sendPushToUser,
	sendPushToAll,
	sendChatCompleteNotification,
	sendSubscriptionReminder,
	sendWelcomeNotification,
};
