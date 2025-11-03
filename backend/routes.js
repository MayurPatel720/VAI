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

			// Save user message
			await storage.createChatMessage({
				userId: req.userId,
				message,
				isBot: false,
			});

			// Get AI response using OpenAI
			const completion = await openai.chat.completions.create({
				model: "gpt-4o-mini",
				messages: [
					{
						role: "system",
						content: `You are a spiritual guide based on the Vachanamrut, a sacred scripture in the Swaminarayan tradition. Provide wisdom, guidance, and insights rooted in the teachings of Vachanamrut. Be compassionate, respectful, and thoughtful in your responses. Address questions about devotion (bhakti), dharma, spiritual practices, and the path to liberation with references to Vachanamrut teachings when appropriate. Respond in a warm, reverent tone befitting spiritual guidance.`,
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
				"I apologize, but I'm having trouble responding right now. Please try again.";

			// Save bot response
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

	const httpServer = createServer(app);
	return httpServer;
}

module.exports = { registerRoutes };
