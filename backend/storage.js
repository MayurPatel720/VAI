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

// Compound index for user bookmarks
bookmarkSchema.index({ userId: 1, createdAt: -1 });

// ============================================
// MODELS
// ============================================

const User = mongoose.model("User", userSchema);
const Subscription = mongoose.model("Subscription", subscriptionSchema);
const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
const Feedback = mongoose.model("Feedback", feedbackSchema);
const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
const Bookmark = mongoose.model("Bookmark", bookmarkSchema);

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
		};
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

		return {
			id: chatMessage._id.toString(),
			userId: chatMessage.userId,
			message: chatMessage.message,
			isBot: chatMessage.isBot,
			createdAt: chatMessage.createdAt,
		};
	}

	async getChatMessages(userId, limit = 100) {
		await this.connect();
		const messages = await ChatMessage.find({ userId })
			.sort({ createdAt: -1 })
			.limit(limit);

		return messages.reverse().map((msg) => ({
			id: msg._id.toString(),
			userId: msg.userId,
			message: msg.message,
			isBot: msg.isBot,
			createdAt: msg.createdAt,
		}));
	}

	async deleteChatMessages(userId) {
		await this.connect();
		await ChatMessage.deleteMany({ userId });
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
}

// Export singleton instance
const storage = new Storage();

module.exports = { storage };
