const mongoose = require("mongoose");

// ============================================
// SCHEMAS
// ============================================

const userSchema = new mongoose.Schema(
	{
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		profileImageUrl: { type: String, default: "" },
		phone: { type: String, default: "" },
		bio: { type: String, default: "" },
		preferences: {
			language: { type: String, enum: ["en", "gu", "hi"], default: "en" },
			theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
		},
		// OneSignal Push Notification fields
		onesignalPlayerId: { type: String, default: "" },
		notificationPreferences: {
			dailyQuote: { type: Boolean, default: true },
			chatComplete: { type: Boolean, default: true },
			subscriptionReminders: { type: Boolean, default: true },
			appUpdates: { type: Boolean, default: true },
		},
	},
	{ timestamps: true }
);

const subscriptionSchema = new mongoose.Schema(
	{
		userId: { type: String, required: true, index: true },
		plan: { type: String, enum: ["silver", "gold", "premium"], required: true },
		status: {
			type: String,
			enum: ["active", "expired", "cancelled"],
			required: true,
		},
		razorpayOrderId: { type: String, required: true },
		razorpayPaymentId: { type: String, required: true },
		startDate: { type: Date, default: Date.now },
		endDate: { type: Date, required: true },
	},
	{ timestamps: true }
);

const chatMessageSchema = new mongoose.Schema(
	{
		userId: { type: String, required: true, index: true },
		sessionId: { type: String, required: false, index: true }, // Added sessionId
		message: { type: String, required: true },
		isBot: { type: Boolean, required: true },
	},
	{ timestamps: true }
);

const feedbackSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		email: { type: String, required: true },
		message: { type: String, required: true },
		rating: { type: Number, min: 1, max: 5, default: 5 },
	},
	{ timestamps: true }
);

// Chat Session Schema - Groups messages into conversations
const chatSessionSchema = new mongoose.Schema(
	{
		userId: { type: String, required: true, index: true },
		title: { type: String, default: "New Conversation" },
		lastMessageAt: { type: Date, default: Date.now },
		messageCount: { type: Number, default: 0 },
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

// Add compound index for efficient queries
chatSessionSchema.index({ userId: 1, lastMessageAt: -1 });

// Bookmark Schema - Save favorite messages
const bookmarkSchema = new mongoose.Schema(
	{
		userId: { type: String, required: true, index: true },
		messageId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatMessage", required: true },
		messageContent: { type: String, required: true }, // Denormalized for faster reads
		category: { 
			type: String, 
			enum: ["spiritual", "practical", "inspiring", "study", "other"],
			default: "spiritual"
		},
		note: { type: String, default: "" },
	},
	{ timestamps: true }
);

// Share Link Schema - For public sharing
const shareLinkSchema = new mongoose.Schema(
	{
		id: { type: String, required: true, unique: true }, // nanoid token
		type: { type: String, enum: ['message', 'conversation'], required: true },
		referenceId: { type: String, required: true }, // messageId or sessionId
		content: { type: mongoose.Schema.Types.Mixed }, // Store snapshot
	},
	{ timestamps: true }
);

// Compound index for user bookmarks
bookmarkSchema.index({ userId: 1, createdAt: -1 });

// Text indexes for full-text search (Advanced Search feature)
chatMessageSchema.index({ message: "text" });
bookmarkSchema.index({ messageContent: "text", note: "text" });
chatSessionSchema.index({ title: "text" });

// ============================================
// MODELS
// ============================================

const User = mongoose.model("User", userSchema);
const Subscription = mongoose.model("Subscription", subscriptionSchema);
const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
const Feedback = mongoose.model("Feedback", feedbackSchema);
const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
const Bookmark = mongoose.model("Bookmark", bookmarkSchema);
const ShareLink = mongoose.model("ShareLink", shareLinkSchema);

// ============================================
// STORAGE CLASS
// ============================================

class Storage {
	constructor() {
		this.isConnected = false;
	}

	async connect() {
		if (this.isConnected) {
			return;
		}

		try {
			const mongoUri =
				process.env.MONGODB_URI || "mongodb://localhost:27017/vachanamrut";

			await mongoose.connect(mongoUri);

			this.isConnected = true;
			console.log("✅ MongoDB connected successfully");
		} catch (error) {
			console.error("❌ MongoDB connection error:", error);
			throw error;
		}
	}

	// ============================================
	// USER METHODS
	// ============================================

	async createUser(data) {
		await this.connect();
		const user = new User(data);
		await user.save();
		return {
			id: user._id.toString(),
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			profileImageUrl: user.profileImageUrl,
		};
	}

	async getUser(userId) {
		await this.connect();
		const user = await User.findById(userId);
		if (!user) return null;

		return {
			id: user._id.toString(),
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			profileImageUrl: user.profileImageUrl,
			phone: user.phone || "",
			bio: user.bio || "",
			preferences: user.preferences || { language: "en", theme: "system" },
			notificationPreferences: user.notificationPreferences || {
				dailyQuote: true,
				chatComplete: true,
				subscriptionReminders: true,
				appUpdates: true,
			},
			onesignalPlayerId: user.onesignalPlayerId || "",
			createdAt: user.createdAt,
		};
	}

	async getUserByEmail(email) {
		await this.connect();
		const user = await User.findOne({ email });
		if (!user) return null;

		return {
			id: user._id.toString(),
			email: user.email,
			password: user.password,
			firstName: user.firstName,
			lastName: user.lastName,
			profileImageUrl: user.profileImageUrl,
		};
	}

	async updateUser(userId, data) {
		await this.connect();
		const user = await User.findByIdAndUpdate(
			userId,
			{ $set: data },
			{ new: true }
		);

		if (!user) return null;

		return {
			id: user._id.toString(),
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			profileImageUrl: user.profileImageUrl,
			phone: user.phone || "",
			bio: user.bio || "",
			preferences: user.preferences || { language: "en", theme: "system" },
			notificationPreferences: user.notificationPreferences || {
				dailyQuote: true,
				chatComplete: true,
				subscriptionReminders: true,
				appUpdates: true,
			},
			onesignalPlayerId: user.onesignalPlayerId || "",
			createdAt: user.createdAt,
		};
	}

	async getUserByIdWithPassword(userId) {
		await this.connect();
		const user = await User.findById(userId);
		if (!user) return null;

		return {
			id: user._id.toString(),
			email: user.email,
			password: user.password,
			firstName: user.firstName,
			lastName: user.lastName,
		};
	}

	async updateUserPassword(userId, hashedPassword) {
		await this.connect();
		await User.findByIdAndUpdate(userId, { $set: { password: hashedPassword } });
	}

	// ============================================
	// SUBSCRIPTION METHODS
	// ============================================

	async createSubscription(data) {
		await this.connect();

		// Cancel any existing active subscriptions
		await Subscription.updateMany(
			{ userId: data.userId, status: "active" },
			{ $set: { status: "cancelled" } }
		);

		const subscription = new Subscription(data);
		await subscription.save();

		return {
			id: subscription._id.toString(),
			userId: subscription.userId,
			plan: subscription.plan,
			status: subscription.status,
			startDate: subscription.startDate,
			endDate: subscription.endDate,
			razorpayOrderId: subscription.razorpayOrderId,
			razorpayPaymentId: subscription.razorpayPaymentId,
		};
	}

	async getUserSubscription(userId) {
		await this.connect();
		const subscription = await Subscription.findOne({
			userId,
			status: "active",
		}).sort({ createdAt: -1 });

		if (!subscription) return null;

		// Check if subscription has expired
		if (new Date() > subscription.endDate) {
			subscription.status = "expired";
			await subscription.save();
			return null;
		}

		return {
			id: subscription._id.toString(),
			userId: subscription.userId,
			plan: subscription.plan,
			status: subscription.status,
			startDate: subscription.startDate,
			endDate: subscription.endDate,
			razorpayOrderId: subscription.razorpayOrderId,
			razorpayPaymentId: subscription.razorpayPaymentId,
		};
	}

	async getAllSubscriptions(userId) {
		await this.connect();
		const subscriptions = await Subscription.find({ userId }).sort({
			createdAt: -1,
		});

		return subscriptions.map((sub) => ({
			id: sub._id.toString(),
			userId: sub.userId,
			plan: sub.plan,
			status: sub.status,
			startDate: sub.startDate,
			endDate: sub.endDate,
			razorpayOrderId: sub.razorpayOrderId,
			razorpayPaymentId: sub.razorpayPaymentId,
		}));
	}

	// ============================================
	// CHAT MESSAGE METHODS
	// ============================================

	async createChatMessage(data) {
		await this.connect();
		const chatMessage = new ChatMessage(data);
		await chatMessage.save();
		
		// Update session stats if sessionId exists
		if (data.sessionId) {
			await ChatSession.findByIdAndUpdate(data.sessionId, {
				$inc: { messageCount: 1 },
				lastMessageAt: new Date(),
			});
		}

		return {
			id: chatMessage._id.toString(),
			userId: chatMessage.userId,
			sessionId: chatMessage.sessionId,
			message: chatMessage.message,
			isBot: chatMessage.isBot,
			createdAt: chatMessage.createdAt,
		};
	}

	async getChatMessages(userId, sessionId = null, limit = 100) {
		await this.connect();
		const query = { userId };
		if (sessionId) {
			query.sessionId = sessionId;
		}

		const messages = await ChatMessage.find(query)
			.sort({ createdAt: -1 })
			.limit(limit);

		return messages.reverse().map((msg) => ({
			id: msg._id.toString(),
			userId: msg.userId,
			sessionId: msg.sessionId,
			message: msg.message,
			isBot: msg.isBot,
			createdAt: msg.createdAt,
		}));
	}

	async deleteChatMessages(userId, sessionId = null) {
		await this.connect();
		const query = { userId };
		if (sessionId) {
			query.sessionId = sessionId;
		}
		await ChatMessage.deleteMany(query);
	}

	async deleteAllChatMessages() {
		await this.connect();
		await ChatMessage.deleteMany({});
	}

	// ============================================
	// FEEDBACK METHODS
	// ============================================

	async createFeedback(data) {
		await this.connect();
		const feedback = new Feedback(data);
		await feedback.save();

		return {
			id: feedback._id.toString(),
			name: feedback.name,
			email: feedback.email,
			message: feedback.message,
			rating: feedback.rating,
			createdAt: feedback.createdAt,
		};
	}

	async getAllFeedback() {
		await this.connect();
		const feedbacks = await Feedback.find().sort({ createdAt: -1 });

		return feedbacks.map((f) => ({
			id: f._id.toString(),
			name: f.name,
			email: f.email,
			message: f.message,
			rating: f.rating,
			createdAt: f.createdAt,
		}));
	}

	async deleteFeedback(feedbackId) {
		await this.connect();
		await Feedback.findByIdAndDelete(feedbackId);
	}

	// ============================================
	// CHAT SESSION METHODS
	// ============================================

	async createSession(userId, title = "New Conversation") {
		await this.connect();
		const session = new ChatSession({
			userId,
			title,
			lastMessageAt: new Date(),
			messageCount: 0,
			isActive: true,
		});
		await session.save();

		return {
			id: session._id.toString(),
			userId: session.userId,
			title: session.title,
			lastMessageAt: session.lastMessageAt,
			messageCount: session.messageCount,
			isActive: session.isActive,
			createdAt: session.createdAt,
		};
	}

	async getUserSessions(userId, page = 1, limit = 20) {
		await this.connect();
		const skip = (page - 1) * limit;
		
		const [sessions, total] = await Promise.all([
			ChatSession.find({ userId })
				.sort({ lastMessageAt: -1 })
				.skip(skip)
				.limit(limit),
			ChatSession.countDocuments({ userId }),
		]);

		return {
			sessions: sessions.map((s) => ({
				id: s._id.toString(),
				userId: s.userId,
				title: s.title,
				lastMessageAt: s.lastMessageAt,
				messageCount: s.messageCount,
				isActive: s.isActive,
				createdAt: s.createdAt,
			})),
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		};
	}

	async getSession(sessionId) {
		await this.connect();
		const session = await ChatSession.findById(sessionId);
		if (!session) return null;

		return {
			id: session._id.toString(),
			userId: session.userId,
			title: session.title,
			lastMessageAt: session.lastMessageAt,
			messageCount: session.messageCount,
			isActive: session.isActive,
			createdAt: session.createdAt,
		};
	}

	async updateSession(sessionId, data) {
		await this.connect();
		const session = await ChatSession.findByIdAndUpdate(
			sessionId,
			{ $set: data },
			{ new: true }
		);
		if (!session) return null;

		return {
			id: session._id.toString(),
			userId: session.userId,
			title: session.title,
			lastMessageAt: session.lastMessageAt,
			messageCount: session.messageCount,
			isActive: session.isActive,
			createdAt: session.createdAt,
		};
	}

	async deleteSession(sessionId) {
		await this.connect();
		await ChatSession.findByIdAndDelete(sessionId);
		// Also delete all messages in this session
		await ChatMessage.deleteMany({ sessionId });
	}

	async getActiveSession(userId) {
		await this.connect();
		let session = await ChatSession.findOne({ userId, isActive: true })
			.sort({ lastMessageAt: -1 });

		if (!session) {
			// Create a new session if none exists
			session = await this.createSession(userId);
			return session;
		}

		return {
			id: session._id.toString(),
			userId: session.userId,
			title: session.title,
			lastMessageAt: session.lastMessageAt,
			messageCount: session.messageCount,
			isActive: session.isActive,
			createdAt: session.createdAt,
		};
	}

	// ============================================
	// BOOKMARK METHODS
	// ============================================

	async createBookmark(data) {
		await this.connect();
		
		// Check if already bookmarked
		const existing = await Bookmark.findOne({
			userId: data.userId,
			messageId: data.messageId,
		});
		
		if (existing) {
			return {
				id: existing._id.toString(),
				userId: existing.userId,
				messageId: existing.messageId.toString(),
				messageContent: existing.messageContent,
				category: existing.category,
				note: existing.note,
				createdAt: existing.createdAt,
			};
		}

		const bookmark = new Bookmark(data);
		await bookmark.save();

		return {
			id: bookmark._id.toString(),
			userId: bookmark.userId,
			messageId: bookmark.messageId.toString(),
			messageContent: bookmark.messageContent,
			category: bookmark.category,
			note: bookmark.note,
			createdAt: bookmark.createdAt,
		};
	}

	async getUserBookmarks(userId, category = null, page = 1, limit = 20) {
		await this.connect();
		const skip = (page - 1) * limit;
		const query = { userId };
		
		if (category && category !== "all") {
			query.category = category;
		}

		const [bookmarks, total] = await Promise.all([
			Bookmark.find(query)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit),
			Bookmark.countDocuments(query),
		]);

		return {
			bookmarks: bookmarks.map((b) => ({
				id: b._id.toString(),
				userId: b.userId,
				messageId: b.messageId.toString(),
				messageContent: b.messageContent,
				category: b.category,
				note: b.note,
				createdAt: b.createdAt,
			})),
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		};
	}

	async updateBookmark(bookmarkId, data) {
		await this.connect();
		const bookmark = await Bookmark.findByIdAndUpdate(
			bookmarkId,
			{ $set: data },
			{ new: true }
		);
		if (!bookmark) return null;

		return {
			id: bookmark._id.toString(),
			userId: bookmark.userId,
			messageId: bookmark.messageId.toString(),
			messageContent: bookmark.messageContent,
			category: bookmark.category,
			note: bookmark.note,
			createdAt: bookmark.createdAt,
		};
	}

	async deleteBookmark(bookmarkId) {
		await this.connect();
		await Bookmark.findByIdAndDelete(bookmarkId);
	}

	async isMessageBookmarked(userId, messageId) {
		await this.connect();
		const bookmark = await Bookmark.findOne({ userId, messageId });
		return bookmark ? {
			isBookmarked: true,
			bookmarkId: bookmark._id.toString(),
			category: bookmark.category,
		} : { isBookmarked: false };
	}

	// ============================================
	// SHARE LINK METHODS
	// ============================================

	async createShareLink(type, referenceId, content) {
		await this.connect();
		// Simple random token generation
		const token = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
		
		const shareLink = new ShareLink({
			id: token,
			type,
			referenceId,
			content
		});
		await shareLink.save();
		return shareLink;
	}

	async getShareLink(token) {
		await this.connect();
		return await ShareLink.findOne({ id: token });
	}

	// ============================================
	// USER STATS METHODS (Profile Page)
	// ============================================

	async getUserStats(userId) {
		await this.connect();
		const user = await User.findById(userId);
		if (!user) return null;

		const [
			totalMessages,
			totalSessions,
			totalBookmarks,
			subscriptions
		] = await Promise.all([
			ChatMessage.countDocuments({ userId }),
			ChatSession.countDocuments({ userId }),
			Bookmark.countDocuments({ userId }),
			Subscription.find({ userId }).sort({ createdAt: -1 }).limit(10)
		]);

		const daysSinceJoined = Math.floor(
			(Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
		);

		return {
			totalMessages,
			totalSessions,
			totalBookmarks,
			daysSinceJoined,
			memberSince: user.createdAt,
			subscriptionHistory: subscriptions.map(s => ({
				id: s._id.toString(),
				plan: s.plan,
				status: s.status,
				startDate: s.startDate,
				endDate: s.endDate,
			})),
		};
	}

	// ============================================
	// SEARCH METHODS (Advanced Search)
	// ============================================

	async searchMessages(userId, query, options = {}) {
		await this.connect();
		const { startDate, endDate, page = 1, limit = 20 } = options;
		const skip = (page - 1) * limit;

		const filter = {
			userId,
			$text: { $search: query }
		};

		if (startDate || endDate) {
			filter.createdAt = {};
			if (startDate) filter.createdAt.$gte = new Date(startDate);
			if (endDate) filter.createdAt.$lte = new Date(endDate);
		}

		const [messages, total] = await Promise.all([
			ChatMessage.find(filter, { score: { $meta: "textScore" } })
				.sort({ score: { $meta: "textScore" } })
				.skip(skip)
				.limit(limit),
			ChatMessage.countDocuments(filter)
		]);

		return {
			results: messages.map(m => ({
				id: m._id.toString(),
				type: "message",
				content: m.message,
				isBot: m.isBot,
				sessionId: m.sessionId,
				createdAt: m.createdAt,
			})),
			pagination: { page, limit, total, pages: Math.ceil(total / limit) }
		};
	}

	async searchBookmarks(userId, query, options = {}) {
		await this.connect();
		const { page = 1, limit = 20 } = options;
		const skip = (page - 1) * limit;

		const filter = {
			userId,
			$text: { $search: query }
		};

		const [bookmarks, total] = await Promise.all([
			Bookmark.find(filter, { score: { $meta: "textScore" } })
				.sort({ score: { $meta: "textScore" } })
				.skip(skip)
				.limit(limit),
			Bookmark.countDocuments(filter)
		]);

		return {
			results: bookmarks.map(b => ({
				id: b._id.toString(),
				type: "bookmark",
				content: b.messageContent,
				category: b.category,
				note: b.note,
				createdAt: b.createdAt,
			})),
			pagination: { page, limit, total, pages: Math.ceil(total / limit) }
		};
	}

	async searchSessions(userId, query, options = {}) {
		await this.connect();
		const { page = 1, limit = 20 } = options;
		const skip = (page - 1) * limit;

		const filter = {
			userId,
			$text: { $search: query }
		};

		const [sessions, total] = await Promise.all([
			ChatSession.find(filter, { score: { $meta: "textScore" } })
				.sort({ score: { $meta: "textScore" } })
				.skip(skip)
				.limit(limit),
			ChatSession.countDocuments(filter)
		]);

		return {
			results: sessions.map(s => ({
				id: s._id.toString(),
				type: "session",
				title: s.title,
				messageCount: s.messageCount,
				lastMessageAt: s.lastMessageAt,
				createdAt: s.createdAt,
			})),
			pagination: { page, limit, total, pages: Math.ceil(total / limit) }
		};
	}

	async unifiedSearch(userId, query, options = {}) {
		await this.connect();
		const { type = "all" } = options;

		const results = { messages: [], bookmarks: [], sessions: [], totalCount: 0 };

		if (type === "all" || type === "messages") {
			const msgResults = await this.searchMessages(userId, query, { ...options, limit: 10 });
			results.messages = msgResults.results;
			results.totalCount += msgResults.pagination.total;
		}

		if (type === "all" || type === "bookmarks") {
			const bmResults = await this.searchBookmarks(userId, query, { ...options, limit: 10 });
			results.bookmarks = bmResults.results;
			results.totalCount += bmResults.pagination.total;
		}

		if (type === "all" || type === "sessions") {
			const sessResults = await this.searchSessions(userId, query, { ...options, limit: 10 });
			results.sessions = sessResults.results;
			results.totalCount += sessResults.pagination.total;
		}

		return results;
	}

	// ============================================
	// ONESIGNAL & NOTIFICATION METHODS
	// ============================================

	async updateOneSignalPlayerId(userId, playerId) {
		await this.connect();
		return await User.findByIdAndUpdate(
			userId,
			{ $set: { onesignalPlayerId: playerId } },
			{ new: true }
		);
	}

	async getUsersWithDailyQuoteEnabled() {
		await this.connect();
		return await User.find({
			onesignalPlayerId: { $ne: "" },
			"notificationPreferences.dailyQuote": true
		}).select("_id onesignalPlayerId firstName");
	}

	async getUsersWithExpiringSubscriptions(daysLeft) {
		await this.connect();
		const targetDate = new Date();
		targetDate.setDate(targetDate.getDate() + daysLeft);
		
		const startOfDay = new Date(targetDate);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(targetDate);
		endOfDay.setHours(23, 59, 59, 999);

		const subscriptions = await Subscription.find({
			status: "active",
			endDate: { $gte: startOfDay, $lte: endOfDay }
		});

		const userIds = [...new Set(subscriptions.map(s => s.userId))];
		
		return await User.find({
			_id: { $in: userIds },
			onesignalPlayerId: { $ne: "" },
			"notificationPreferences.subscriptionReminders": true
		}).select("_id onesignalPlayerId firstName");
	}

	// ============================================
	// ADMIN METHODS (Enhanced Admin Dashboard)
	// ============================================

	async getAllUsers(page = 1, limit = 20, filters = {}) {
		await this.connect();
		const skip = (page - 1) * limit;
		const query = {};

		if (filters.search) {
			query.$or = [
				{ email: { $regex: filters.search, $options: "i" } },
				{ firstName: { $regex: filters.search, $options: "i" } },
				{ lastName: { $regex: filters.search, $options: "i" } }
			];
		}

		const [users, total] = await Promise.all([
			User.find(query)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.select("-password"),
			User.countDocuments(query)
		]);

		return {
			users: users.map(u => ({
				id: u._id.toString(),
				email: u.email,
				firstName: u.firstName,
				lastName: u.lastName,
				createdAt: u.createdAt,
			})),
			pagination: { page, limit, total, pages: Math.ceil(total / limit) }
		};
	}

	async getAdminAnalytics() {
		await this.connect();
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const [
			totalUsers,
			newUsersToday,
			totalMessages,
			messagesToday,
			totalSessions,
			activeSubscriptions
		] = await Promise.all([
			User.countDocuments(),
			User.countDocuments({ createdAt: { $gte: today } }),
			ChatMessage.countDocuments(),
			ChatMessage.countDocuments({ createdAt: { $gte: today } }),
			ChatSession.countDocuments(),
			Subscription.countDocuments({ status: "active" })
		]);

		// Plan breakdown
		const planCounts = await Subscription.aggregate([
			{ $match: { status: "active" } },
			{ $group: { _id: "$plan", count: { $sum: 1 } } }
		]);

		const planBreakdown = {
			silver: 0,
			gold: 0,
			premium: 0
		};
		planCounts.forEach(p => {
			planBreakdown[p._id] = p.count;
		});

		return {
			totalUsers,
			newUsersToday,
			totalMessages,
			messagesToday,
			totalSessions,
			activeSubscriptions,
			planBreakdown,
			freeUsers: totalUsers - activeSubscriptions
		};
	}
}

// Export singleton instance
const storage = new Storage();

module.exports = { storage };
