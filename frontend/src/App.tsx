// src/App.tsx
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import {
	BrowserRouter,
	Routes,
	Route,
	useNavigate,
	useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Chat from "./pages/Chat";
import Landing from "./pages/Landing";
import NotFound from "./pages/not-found";
import Login from "./components/Login";
import Register from "./components/Register";
import AnimatedPage from "./pages/AnimatedPage";
import LegalPolicies from "./components/LegalPolicies";

import { useAuth } from "./hooks/useAuth";

// analytics
import {
	trackAppLoaded,
	trackPageView,
	attachGlobalErrorHandlers,
	getAnalyticsConsent,
	enableAnalytics,
	disableAnalytics,
} from "../src/service/analyticsService";

/**
 * RouterContent handles route-level logic and analytics tracking.
 */
function RouterContent() {
	const { isAuthenticated, isLoading } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	// attach global error handlers once
	useEffect(() => {
		attachGlobalErrorHandlers();
	}, []);

	// app loaded
	useEffect(() => {
		// initialize analytics consent (no-op if already set)
		const consent = getAnalyticsConsent();
		if (!consent) {
			disableAnalytics().catch(() => {});
		} else {
			enableAnalytics().catch(() => {});
		}

		// track app load
		trackAppLoaded();
	}, []);

	// track page views on route change
	useEffect(() => {
		trackPageView(location.pathname);
	}, [location.pathname]);

	// auth routing
	useEffect(() => {
		if (isLoading) return;
		if (!isAuthenticated && location.pathname !== "/register") {
			navigate("/login");
		} else if (isAuthenticated && location.pathname === "/login") {
			navigate("/");
		}
	}, [isAuthenticated, isLoading, location.pathname, navigate]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
					<p className="text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<Routes>
			{!isAuthenticated && (
				<>
					<Route
						path="/login"
						element={
							<AnimatedPage>
								<Login />
							</AnimatedPage>
						}
					/>
					<Route
						path="/register"
						element={
							<AnimatedPage>
								<Register />
							</AnimatedPage>
						}
					/>
				</>
			)}

			<Route
				path="/"
				element={
					<AnimatedPage>
						<Landing />
					</AnimatedPage>
				}
			/>

			<Route
				path="/chat"
				element={
					<AnimatedPage>
						<Chat />
					</AnimatedPage>
				}
			/>
			<Route path="/legal" element={<LegalPolicies />} />
			<Route
				path="*"
				element={
					<AnimatedPage>
						<NotFound />
					</AnimatedPage>
				}
			/>
		</Routes>
	);
}

/**
 * Top-level App component
 */
function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<TooltipProvider>
				<Toaster />
				<BrowserRouter>
					<AnimatePresence mode="wait">
						<RouterContent />
					</AnimatePresence>
				</BrowserRouter>
			</TooltipProvider>
		</QueryClientProvider>
	);
}

export default App;
