require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { registerRoutes } = require("./routes");

const app = express();

// Security middleware
app.use(
	helmet({
		crossOriginResourcePolicy: false, // <-- IMPORTANT
		crossOriginOpenerPolicy: false, // optional
		crossOriginEmbedderPolicy: false, // optional
	})
);

// CORS configuration
app.use(
	cors({
		origin: ["http://localhost:5173", "https://vachnamrutai.web.app"],
		credentials: true,
	})
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Passport middleware
const passport = require("./middleware/passport");
app.use(passport.initialize());


// Request logging middleware
app.use((req, res, next) => {
	const start = Date.now();
	const path = req.path;
	let capturedJsonResponse = undefined;

	const originalResJson = res.json;
	res.json = function (bodyJson, ...args) {
		capturedJsonResponse = bodyJson;
		return originalResJson.apply(res, [bodyJson, ...args]);
	};

	res.on("finish", () => {
		const duration = Date.now() - start;
		if (path.startsWith("/api")) {
			let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
			if (capturedJsonResponse) {
				logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
			}

			if (logLine.length > 80) {
				logLine = logLine.slice(0, 79) + "…";
			}

			console.log(logLine);
		}
	});

	next();
});

app.get("/health", (_req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

(async () => {
	try {
		// Register API routes
		const server = await registerRoutes(app);

		// Global error handler
		app.use((err, _req, res, _next) => {
			const status = err.status || err.statusCode || 500;
			const message = err.message || "Internal Server Error";

			console.error("Error:", err);
			res.status(status).json({
				message,
				...(process.env.NODE_ENV === "development" && { stack: err.stack }),
			});
		});

		// 404 handler
		app.use((_req, res) => {
			res.status(404).json({ message: "Route not found" });
		});

		const PORT = parseInt(process.env.PORT || "5000", 10);

		server.listen(PORT, () => {
			console.log(`✅ Server running on http://localhost:${PORT}`);
			console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
			console.log(
				`🗄️  Database: ${
					process.env.MONGODB_URI ? "Connected" : "Not configured"
				}`
			);
		});

		// Graceful shutdown
		process.on("SIGTERM", () => {
			console.log("SIGTERM signal received: closing HTTP server");
			server.close(() => {
				console.log("HTTP server closed");
				process.exit(0);
			});
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
})();
