const jwt = require("jsonwebtoken");
const { storage } = require("../storage");

const JWT_SECRET =
	process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

// Generate JWT token
function generateToken(payload) {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
function verifyToken(token) {
	return jwt.verify(token, JWT_SECRET);
}

// Authentication middleware
async function isAuthenticated(req, res, next) {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ message: "No token provided" });
		}

		const token = authHeader.substring(7);

		try {
			const decoded = verifyToken(token);

			// Verify user still exists in database
			const user = await storage.getUser(decoded.userId);

			if (!user) {
				return res.status(401).json({ message: "User not found" });
			}

			// Attach user info to request
			req.userId = decoded.userId;
			req.user = user;

			next();
		} catch (error) {
			if (error.name === "TokenExpiredError") {
				return res.status(401).json({ message: "Token expired" });
			}
			if (error.name === "JsonWebTokenError") {
				return res.status(401).json({ message: "Invalid token" });
			}
			throw error;
		}
	} catch (error) {
		console.error("Authentication error:", error);
		return res.status(500).json({ message: "Authentication failed" });
	}
}

// Optional auth middleware (doesn't fail if no token)
async function optionalAuth(req, res, next) {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return next();
		}

		const token = authHeader.substring(7);

		try {
			const decoded = verifyToken(token);
			const user = await storage.getUser(decoded.userId);

			if (user) {
				req.userId = decoded.userId;
				req.user = user;
			}
		} catch (error) {
			// Silently fail for optional auth
			console.log("Optional auth failed:", error);
		}

		next();
	} catch (error) {
		next();
	}
}

module.exports = {
	generateToken,
	verifyToken,
	isAuthenticated,
	optionalAuth,
};
