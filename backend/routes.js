const { createServer } = require("http");
const { storage } = require("./storage");
const { isAuthenticated, generateToken } = require("./middleware/auth");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { z } = require("zod");
const OpenAI = require("openai");
const bcrypt = require("bcrypt");

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const razorpay = new Razorpay({
	key_id: process.env.RAZORPAY_KEY_ID,
	key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Plan pricing configuration
const PLAN_PRICES = {
	silver: 14900, // ₹149.00 in paise
	gold: 29900, // ₹299.00 in paise
	premium: 49900, // ₹499.00 in paise
};

async function registerRoutes(app) {
	// ============================================
	// AUTH ROUTES
	// ============================================

	// Register
	app.post("/api/auth/register", async (req, res) => {
		try {
			const schema = z.object({
				email: z.string().email(),
				password: z.string().min(6),
				firstName: z.string().min(1),
				lastName: z.string().min(1),
			});

			const { email, password, firstName, lastName } = schema.parse(req.body);

			// Check if user exists
			const existingUser = await storage.getUserByEmail(email);
			if (existingUser) {
				return res.status(400).json({ message: "User already exists" });
			}

			// Hash password
			const hashedPassword = await bcrypt.hash(password, 10);

			// Create user
			const user = await storage.createUser({
				email,
				password: hashedPassword,
				firstName,
				lastName,
				profileImageUrl: "",
			});

			// Generate token
			const token = generateToken({ userId: user.id, email: user.email });

			res.status(201).json({
				message: "User registered successfully",
				token,
				user: {
					id: user.id,
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
				},
			});
		} catch (error) {
			console.error("Registration error:", error);
			if (error instanceof z.ZodError) {
				return res
					.status(400)
					.json({ message: "Invalid input", errors: error.errors });
			}
			res.status(500).json({ message: error.message || "Registration failed" });
		}
	});

	// Login
	app.post("/api/auth/login", async (req, res) => {
		try {
			const schema = z.object({
				email: z.string().email(),
				password: z.string(),
			});

			const { email, password } = schema.parse(req.body);

			// Find user
			const user = await storage.getUserByEmail(email);
			if (!user || !user.password) {
				return res.status(401).json({ message: "Invalid credentials" });
			}

			// Verify password
			const isValid = await bcrypt.compare(password, user.password);
			if (!isValid) {
				return res.status(401).json({ message: "Invalid credentials" });
			}

			// Generate token
			const token = generateToken({ userId: user.id, email: user.email });

			res.json({
				message: "Login successful",
				token,
				user: {
					id: user.id,
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					subscription: "FREE",
				},
			});
		} catch (error) {
			console.error("Login error:", error);
			if (error instanceof z.ZodError) {
				return res
					.status(400)
					.json({ message: "Invalid input", errors: error.errors });
			}
			res.status(500).json({ message: error.message || "Login failed" });
		}
	});

	// Get current user
	app.get("/api/auth/user", isAuthenticated, async (req, res) => {
		try {
			const user = await storage.getUser(req.userId);
			const subscription = await storage.getUserSubscription(req.userId);

			res.json({
				...user,
				subscription,
			});
		} catch (error) {
			console.error("Error fetching user:", error);
			res.status(500).json({ message: "Failed to fetch user" });
		}
	});

	// ============================================
	// PAYMENT ROUTES
	// ============================================

	app.post("/api/payment/create-order", isAuthenticated, async (req, res) => {
		try {
			const schema = z.object({
				plan: z.enum(["silver", "gold", "premium"]),
			});

			const { plan } = schema.parse(req.body);
			const amount = PLAN_PRICES[plan];

			const options = {
				amount,
				currency: "INR",
				receipt: `order_${Date.now()}`,
				notes: {
					userId: req.userId,
					plan,
				},
			};

			const order = await razorpay.orders.create(options);

			res.json({
				orderId: order.id,
				amount: order.amount,
				currency: order.currency,
				key: process.env.RAZORPAY_KEY_ID,
			});
		} catch (error) {
			console.error("Error creating Razorpay order:", error);
			res
				.status(500)
				.json({ message: error.message || "Failed to create order" });
		}
	});

	app.post("/api/payment/verify", isAuthenticated, async (req, res) => {
		try {
			const schema = z.object({
				razorpay_order_id: z.string(),
				razorpay_payment_id: z.string(),
				razorpay_signature: z.string(),
				plan: z.enum(["silver", "gold", "premium"]),
			});

			const {
				razorpay_order_id,
				razorpay_payment_id,
				razorpay_signature,
				plan,
			} = schema.parse(req.body);

			// Verify signature
			const sign = razorpay_order_id + "|" + razorpay_payment_id;
			const expectedSign = crypto
				.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
				.update(sign)
				.digest("hex");

			if (razorpay_signature !== expectedSign) {
				return res.status(400).json({ message: "Invalid signature" });
			}

			// Create subscription record
			const endDate = new Date();
			endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

			const subscription = await storage.createSubscription({
				userId: req.userId,
				plan,
				status: "active",
				razorpayOrderId: razorpay_order_id,
				razorpayPaymentId: razorpay_payment_id,
				endDate,
			});
			const startOfDay = new Date();
			startOfDay.setHours(0, 0, 0, 0);

			await ChatMessage.deleteMany({
				userId: req.userId,
				createdAt: { $gte: startOfDay },
			});

			res.json({
				message: "Payment verified successfully",
				subscription,
			});
		} catch (error) {
			console.error("Error verifying payment:", error);
			res
				.status(500)
				.json({ message: error.message || "Failed to verify payment" });
		}
	});

	// ============================================
	// CHAT ROUTES
	// ============================================

	// ============================================
	// CHAT USAGE ROUTE (Count today's messages)
	// ============================================
	app.get("/api/chat/usage", isAuthenticated, async (req, res) => {
		try {
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			// Get all messages for the user
			const messages = await storage.getChatMessages(req.userId);

			// Count only USER messages (not bot)
			const todayCount = messages.filter(
				(m) => !m.isBot && new Date(m.createdAt) >= today
			).length;

			res.json({ todayCount });
		} catch (error) {
			console.error("Error fetching usage:", error);
			res.status(500).json({ message: "Failed to fetch usage" });
		}
	});

	app.get("/api/chat/history", isAuthenticated, async (req, res) => {
		try {
			const messages = await storage.getChatMessages(req.userId);
			res.json(messages);
		} catch (error) {
			console.error("Error fetching chat history:", error);
			res
				.status(500)
				.json({ message: error.message || "Failed to fetch chat history" });
		}
	});

	app.post("/api/chat/message", isAuthenticated, async (req, res) => {
		try {
			const schema = z.object({
				message: z.string().min(1),
			});

			const { message } = schema.parse(req.body);

			// ===============================
			// CHECK CHAT LIMITS
			// ===============================

			const subscription = await storage.getUserSubscription(req.userId);

			const LIMITS = {
				FREE: 3,
				silver: 30,
				gold: 60,
				premium: 150,
			};

			const plan = subscription?.plan || "FREE";
			const maxChats = LIMITS[plan];

			// Count today's user messages
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const allMessages = await storage.getChatMessages(req.userId);
			const todayCount = allMessages.filter(
				(m) => !m.isBot && new Date(m.createdAt) >= today
			).length;

			// If usage exceeded
			if (todayCount >= maxChats) {
				return res.status(403).json({
					message: "Chat limit reached for today",
					remaining: 0,
				});
			}

			// Save user message
			await storage.createChatMessage({
				userId: req.userId,
				message,
				isBot: false,
			});

			// ===============================
			// AI RESPONSE
			// ===============================

			const completion = await openai.chat.completions.create({
				model: "gpt-4o-mini",
				messages: [
					{
						role: "system",
						content: `You are a spiritual guide based on Vachanamrut...`,
					},
					{
						role: "user",
						content: message,
					},
				],
				temperature: 0.7,
				max_tokens: 500,
			});

			const botResponse =
				completion.choices[0].message.content ||
				"I apologize, I cannot respond right now.";

			// Save bot message
			const savedMessage = await storage.createChatMessage({
				userId: req.userId,
				message: botResponse,
				isBot: true,
			});

			res.json(savedMessage);
		} catch (error) {
			console.error("Error processing chat message:", error);
			res
				.status(500)
				.json({ message: error.message || "Failed to process message" });
		}
	});

	// Delete chat history
	app.delete("/api/chat/history", isAuthenticated, async (req, res) => {
		try {
			await storage.deleteChatMessages(req.userId);
			res.json({ message: "Chat history deleted successfully" });
		} catch (error) {
			console.error("Error deleting chat history:", error);
			res
				.status(500)
				.json({ message: error.message || "Failed to delete chat history" });
		}
	});

	// ============================================
	// CHAT SESSION ROUTES
	// ============================================

	// Get all sessions for user
	app.get("/api/chat/sessions", isAuthenticated, async (req, res) => {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 20;
			const result = await storage.getUserSessions(req.userId, page, limit);
			res.json(result);
		} catch (error) {
			console.error("Error fetching sessions:", error);
			res.status(500).json({ message: "Failed to fetch sessions" });
		}
	});

	// Create new session
	app.post("/api/chat/sessions", isAuthenticated, async (req, res) => {
		try {
			const { title } = req.body;
			const session = await storage.createSession(req.userId, title);
			res.status(201).json(session);
		} catch (error) {
			console.error("Error creating session:", error);
			res.status(500).json({ message: "Failed to create session" });
		}
	});

	// Get active session (or create one)
	app.get("/api/chat/sessions/active", isAuthenticated, async (req, res) => {
		try {
			const session = await storage.getActiveSession(req.userId);
			res.json(session);
		} catch (error) {
			console.error("Error fetching active session:", error);
			res.status(500).json({ message: "Failed to fetch active session" });
		}
	});

	// Get session by ID
	app.get("/api/chat/sessions/:id", isAuthenticated, async (req, res) => {
		try {
			const session = await storage.getSession(req.params.id);
			if (!session) {
				return res.status(404).json({ message: "Session not found" });
			}
			if (session.userId !== req.userId) {
				return res.status(403).json({ message: "Access denied" });
			}
			res.json(session);
		} catch (error) {
			console.error("Error fetching session:", error);
			res.status(500).json({ message: "Failed to fetch session" });
		}
	});

	// Update session
	app.patch("/api/chat/sessions/:id", isAuthenticated, async (req, res) => {
		try {
			const session = await storage.getSession(req.params.id);
			if (!session) {
				return res.status(404).json({ message: "Session not found" });
			}
			if (session.userId !== req.userId) {
				return res.status(403).json({ message: "Access denied" });
			}

			const { title, isActive } = req.body;
			const updated = await storage.updateSession(req.params.id, { title, isActive });
			res.json(updated);
		} catch (error) {
			console.error("Error updating session:", error);
			res.status(500).json({ message: "Failed to update session" });
		}
	});

	// Delete session
	app.delete("/api/chat/sessions/:id", isAuthenticated, async (req, res) => {
		try {
			const session = await storage.getSession(req.params.id);
			if (!session) {
				return res.status(404).json({ message: "Session not found" });
			}
			if (session.userId !== req.userId) {
				return res.status(403).json({ message: "Access denied" });
			}

			await storage.deleteSession(req.params.id);
			res.json({ message: "Session deleted successfully" });
		} catch (error) {
			console.error("Error deleting session:", error);
			res.status(500).json({ message: "Failed to delete session" });
		}
	});

	// ============================================
	// BOOKMARK ROUTES
	// ============================================

	// Get all bookmarks
	app.get("/api/bookmarks", isAuthenticated, async (req, res) => {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 20;
			const category = req.query.category || null;
			const result = await storage.getUserBookmarks(req.userId, category, page, limit);
			res.json(result);
		} catch (error) {
			console.error("Error fetching bookmarks:", error);
			res.status(500).json({ message: "Failed to fetch bookmarks" });
		}
	});

	// Create bookmark
	app.post("/api/bookmarks", isAuthenticated, async (req, res) => {
		try {
			const schema = z.object({
				messageId: z.string(),
				messageContent: z.string(),
				category: z.enum(["spiritual", "practical", "inspiring", "study", "other"]).optional(),
				note: z.string().optional(),
			});

			const data = schema.parse(req.body);
			const bookmark = await storage.createBookmark({
				userId: req.userId,
				...data,
			});
			res.status(201).json(bookmark);
		} catch (error) {
			console.error("Error creating bookmark:", error);
			if (error instanceof z.ZodError) {
				return res.status(400).json({ message: "Invalid input", errors: error.errors });
			}
			res.status(500).json({ message: "Failed to create bookmark" });
		}
	});

	// Check if message is bookmarked
	app.get("/api/bookmarks/check/:messageId", isAuthenticated, async (req, res) => {
		try {
			const result = await storage.isMessageBookmarked(req.userId, req.params.messageId);
			res.json(result);
		} catch (error) {
			console.error("Error checking bookmark:", error);
			res.status(500).json({ message: "Failed to check bookmark" });
		}
	});

	// Update bookmark
	app.patch("/api/bookmarks/:id", isAuthenticated, async (req, res) => {
		try {
			const { category, note } = req.body;
			const bookmark = await storage.updateBookmark(req.params.id, { category, note });
			if (!bookmark) {
				return res.status(404).json({ message: "Bookmark not found" });
			}
			res.json(bookmark);
		} catch (error) {
			console.error("Error updating bookmark:", error);
			res.status(500).json({ message: "Failed to update bookmark" });
		}
	});

	// Delete bookmark
	app.delete("/api/bookmarks/:id", isAuthenticated, async (req, res) => {
		try {
			await storage.deleteBookmark(req.params.id);
			res.json({ message: "Bookmark deleted successfully" });
		} catch (error) {
			console.error("Error deleting bookmark:", error);
			res.status(500).json({ message: "Failed to delete bookmark" });
		}
	});

	// ============================================
	// FEEDBACK ROUTES
	// ============================================

	// Submit feedback (public)
	app.post("/api/feedback", async (req, res) => {
		try {
			const schema = z.object({
				name: z.string().min(1),
				email: z.string().email(),
				message: z.string().min(1),
				rating: z.number().min(1).max(5).optional(),
			});

			const data = schema.parse(req.body);
			const feedback = await storage.createFeedback(data);

			res.status(201).json({
				message: "Feedback submitted successfully",
				feedback,
			});
		} catch (error) {
			console.error("Error submitting feedback:", error);
			if (error instanceof z.ZodError) {
				return res
					.status(400)
					.json({ message: "Invalid input", errors: error.errors });
			}
			res.status(500).json({ message: error.message || "Failed to submit feedback" });
		}
	});

	// ============================================
	// ADMIN ROUTES (PIN Protected: 7020)
	// ============================================

	// Verify admin PIN
	app.post("/api/admin/verify", (req, res) => {
		const { pin } = req.body;
		if (pin === "7020") {
			res.json({ success: true, message: "PIN verified" });
		} else {
			res.status(401).json({ success: false, message: "Invalid PIN" });
		}
	});

	// Get all feedback (admin only)
	app.get("/api/admin/feedback", (req, res) => {
		const pin = req.headers["x-admin-pin"];
		if (pin !== "7020") {
			return res.status(401).json({ message: "Unauthorized" });
		}

		storage.getAllFeedback()
			.then((feedback) => res.json(feedback))
			.catch((error) => {
				console.error("Error fetching feedback:", error);
				res.status(500).json({ message: "Failed to fetch feedback" });
			});
	});

	// Delete feedback (admin only)
	app.delete("/api/admin/feedback/:id", async (req, res) => {
		const pin = req.headers["x-admin-pin"];
		if (pin !== "7020") {
			return res.status(401).json({ message: "Unauthorized" });
		}

		try {
			await storage.deleteFeedback(req.params.id);
			res.json({ message: "Feedback deleted successfully" });
		} catch (error) {
			console.error("Error deleting feedback:", error);
			res.status(500).json({ message: "Failed to delete feedback" });
		}
	});

	const httpServer = createServer(app);
	return httpServer;
}

module.exports = { registerRoutes };
