/**
 * Scheduled Notification Tasks
 * Uses node-cron to send daily push notifications
 * 
 * To enable, import and call initCronJobs() in your main server file:
 * const { initCronJobs } = require('./cron/dailyNotifications');
 * initCronJobs();
 */

// Note: Install node-cron first: npm install node-cron
// const cron = require('node-cron');
// const { storage } = require('../storage');
// const { sendPushToUser } = require('../services/onesignal');
// const { getTodaysQuote } = require('../services/dailyQuotes');

/**
 * Send daily spiritual quote to all opted-in users
 * Scheduled for 6:00 AM IST
 */
async function sendDailyQuotes(storage, onesignal, quotes) {
	console.log('Running daily quote notification job...');
	
	try {
		const users = await storage.getUsersWithDailyQuoteEnabled();
		const quote = quotes.getTodaysQuote();
		
		console.log(`Sending quote to ${users.length} users:`, quote.text.substring(0, 50) + '...');
		
		for (const user of users) {
			await onesignal.sendPushToUser(user.onesignalPlayerId, {
				title: "🙏 Daily Wisdom",
				message: quote.text,
				data: { type: "daily_quote", source: quote.source }
			});
			
			// Small delay to avoid rate limiting
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		
		console.log(`Daily quotes sent to ${users.length} users`);
	} catch (error) {
		console.error('Error sending daily quotes:', error);
	}
}

/**
 * Check and notify users with expiring subscriptions
 * Sends reminders at 7 days, 3 days, and 1 day before expiry
 */
async function checkExpiringSubscriptions(storage, onesignal) {
	console.log('Checking expiring subscriptions...');
	
	const checkDays = [7, 3, 1];
	
	for (const daysLeft of checkDays) {
		try {
			const users = await storage.getUsersWithExpiringSubscriptions(daysLeft);
			
			console.log(`Found ${users.length} users with subscription expiring in ${daysLeft} days`);
			
			for (const user of users) {
				await onesignal.sendSubscriptionReminder(
					user.onesignalPlayerId,
					daysLeft,
					'subscription' // Plan info would need to be fetched
				);
				
				await new Promise(resolve => setTimeout(resolve, 100));
			}
		} catch (error) {
			console.error(`Error checking ${daysLeft}-day expiring subscriptions:`, error);
		}
	}
}

/**
 * Initialize all cron jobs
 * Call this from your main server.js file
 */
function initCronJobs() {
	// Check if node-cron is available
	let cron;
	try {
		cron = require('node-cron');
	} catch (e) {
		console.log('node-cron not installed. Cron jobs disabled.');
		console.log('To enable: npm install node-cron');
		return;
	}

	const { storage } = require('../storage');
	const onesignal = require('../services/onesignal');
	const quotes = require('../services/dailyQuotes');

	// Daily spiritual quote - 6:00 AM IST (12:30 AM UTC)
	cron.schedule('30 0 * * *', () => {
		sendDailyQuotes(storage, onesignal, quotes);
	}, { timezone: "Asia/Kolkata" });

	// Subscription expiry check - 9:00 AM IST (3:30 AM UTC)
	cron.schedule('30 3 * * *', () => {
		checkExpiringSubscriptions(storage, onesignal);
	}, { timezone: "Asia/Kolkata" });

	console.log('✅ Cron jobs initialized');
	console.log('   - Daily quote: 6:00 AM IST');
	console.log('   - Subscription check: 9:00 AM IST');
}

// Manual trigger functions for testing
async function triggerDailyQuote() {
	const { storage } = require('../storage');
	const onesignal = require('../services/onesignal');
	const quotes = require('../services/dailyQuotes');
	await sendDailyQuotes(storage, onesignal, quotes);
}

async function triggerSubscriptionCheck() {
	const { storage } = require('../storage');
	const onesignal = require('../services/onesignal');
	await checkExpiringSubscriptions(storage, onesignal);
}

module.exports = {
	initCronJobs,
	sendDailyQuotes,
	checkExpiringSubscriptions,
	triggerDailyQuote,
	triggerSubscriptionCheck,
};
