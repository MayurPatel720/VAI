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

// ============================================
// MODELS
// ============================================

const User = mongoose.model("User", userSchema);
const Subscription = mongoose.model("Subscription", subscriptionSchema);
const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

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
}

// Export singleton instance
const storage = new Storage();

module.exports = { storage };
