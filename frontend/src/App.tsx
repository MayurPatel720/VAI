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
import Admin from "./pages/Admin";
import Bookmarks from "./pages/Bookmarks";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

import { useAuth } from "./hooks/useAuth";

function RouterContent() {
	const { isAuthenticated, isLoading } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		if (isLoading) return;

		const publicPaths = ["/", "/login", "/register", "/legal", "/admin"];

		// ⬅️ protect only chat
		if (!isAuthenticated && !publicPaths.includes(location.pathname)) {
			navigate("/login", { replace: true });
		}

		// ⬅️ logged-in users cannot go back to login
		if (isAuthenticated && location.pathname === "/login") {
			navigate("/", { replace: true });
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
			{/* Public */}
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
			<Route path="/legal" element={<LegalPolicies />} />

			{/* Protected */}
			<Route
				path="/chat"
				element={
					<AnimatedPage>
						<Chat />
					</AnimatedPage>
				}
			/>

			<Route
				path="/admin"
				element={
					<AnimatedPage>
						<Admin />
					</AnimatedPage>
				}
			/>

			<Route
				path="/bookmarks"
				element={
					<AnimatedPage>
						<Bookmarks />
					</AnimatedPage>
				}
			/>

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

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<TooltipProvider>
				<Toaster />
				<PWAInstallPrompt />
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
