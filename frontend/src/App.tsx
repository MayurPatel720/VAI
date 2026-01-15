// src/App.tsx
import { useEffect, useState } from "react";
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
import PushNotificationPrompt from "./components/PushNotificationPrompt";
import SharedView from "./pages/SharedView";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import OAuthCallback from "./pages/OAuthCallback";


import { useAuth } from "./hooks/useAuth";
import Test from "./pages/Test";

function RouterContent() {
	const { isAuthenticated, isLoading } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	// Check if intro should show: on first load OR after login
	const [showIntro, setShowIntro] = useState(() => {
		// Check for first-ever load OR post-login trigger
		const isFirstLoad = !sessionStorage.getItem("introShown");
		const isPostLogin = sessionStorage.getItem("showWelcomeIntro") === "true";
		// Clear the flag immediately if it exists to prevent loops
		if (isPostLogin) {
			sessionStorage.removeItem("showWelcomeIntro");
		}
		return isFirstLoad || isPostLogin;
	});

	// Also check for welcome intro flag on location change (handles redirect)
	useEffect(() => {
		const isPostLogin = sessionStorage.getItem("showWelcomeIntro") === "true";
		if (isPostLogin) {
			sessionStorage.removeItem("showWelcomeIntro");
			setShowIntro(true);
		}
	}, [location.pathname]);

	// Intro animation timer
	useEffect(() => {
		if (!showIntro) return;
		
		const timer = setTimeout(() => {
			setShowIntro(false);
			sessionStorage.setItem("introShown", "true");
		}, 3100); // 3.1 seconds

		return () => clearTimeout(timer);
	}, [showIntro]);

	// Minimum loading time to ensure animation is visible
	const [minLoadingDone, setMinLoadingDone] = useState(false);
	useEffect(() => {
		// Only start timer if we're not showing intro (intro takes precedence)
		if (showIntro) return;
		
		const timer = setTimeout(() => {
			setMinLoadingDone(true);
		}, 1500); // Minimum 1.5 seconds loading display

		return () => clearTimeout(timer);
	}, [showIntro]);

	// Effective loading state: true if auth is loading OR minimum time hasn't passed
	const effectiveLoading = isLoading || (!minLoadingDone && !showIntro);

	useEffect(() => {
		if (isLoading) return;

		const publicPaths = ["/", "/login", "/register", "/legal", "/admin", "/share/"];
		
		const isPublicShare = location.pathname.startsWith("/share/");

		// ⬅️ protect only chat
		if (!isAuthenticated && !publicPaths.includes(location.pathname) && !isPublicShare) {
			navigate("/login", { replace: true });
		}

		// ⬅️ logged-in users cannot go back to login
		if (isAuthenticated && location.pathname === "/login") {
			navigate("/", { replace: true });
		}
	}, [isAuthenticated, isLoading, location.pathname, navigate]);

	// Show intro animation (Original Style: 3s, fill once, min-height)
	if (showIntro) {
		return (
			<div className="intro-container">
				<svg 
					className="intro-svg"
					viewBox="0 0 600 80" 
					preserveAspectRatio="xMidYMid meet"
				>
					<text x="50%" y="55" textAnchor="middle" className="text-outline">
						Vachanamrut AI
					</text>
					<text x="50%" y="55" textAnchor="middle" className="text-fill">
						Vachanamrut AI
					</text>
				</svg>

				<style>{`
					@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
					
					.intro-container {
						display: flex;
						align-items: center;
						justify-content: center;
						min-height: 100vh;
						background-color: #1a1a1a;
						padding: 20px;
					}
					
					.intro-svg {
						width: 90vw;
						max-width: 600px;
						height: auto;
					}
					
					.text-outline {
						font-family: 'Dancing Script', cursive;
						font-size: 48px;
						font-weight: 700;
						fill: none;
						stroke: #f97316;
						stroke-width: 0.3;
						stroke-linecap: round;
						stroke-linejoin: round;
					}
					
					.text-fill {
						font-family: 'Dancing Script', cursive;
						font-size: 48px;
						font-weight: 700;
						fill: #f97316;
						clip-path: inset(0 100% 0 0);
						animation: fillText 3s ease-out forwards;
					}
					
					@keyframes fillText {
						0% { clip-path: inset(0 100% 0 0); }
						100% { clip-path: inset(0 0% 0 0); }
					}
					
					@media (max-width: 480px) {
						.text-outline, .text-fill { font-size: 42px; }
						.intro-svg { width: 98vw; max-width: none; }
					}
				`}</style>
			</div>
		);
	}

	// Show loading animation (New Style: infinite loop, fixed position, bigger text)
	if (effectiveLoading) {
		return (
			<div className="loading-container">
				<svg 
					className="loading-svg"
					viewBox="0 0 600 80" 
					preserveAspectRatio="xMidYMid meet"
				>
					<text x="50%" y="55" textAnchor="middle" className="text-outline-loading">
						Vachanamrut AI
					</text>
					<text x="50%" y="55" textAnchor="middle" className="text-fill-loading">
						Vachanamrut AI
					</text>
				</svg>

				<style>{`
					@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
					
					.loading-container {
						display: flex;
						align-items: center;
						justify-content: center;
						position: fixed;
						top: 0;
						left: 0;
						width: 100%;
						height: 100%;
						z-index: 9999;
						background-color: #1a1a1a;
						padding: 20px;
					}
					
					.loading-svg {
						width: 90vw;
						max-width: 600px;
						height: auto;
					}
					
					.text-outline-loading {
						font-family: 'Dancing Script', cursive;
						font-size: 48px;
						font-weight: 700;
						fill: none;
						stroke: #f97316;
						stroke-width: 0.3;
						stroke-linecap: round;
						stroke-linejoin: round;
					}
					
					.text-fill-loading {
						font-family: 'Dancing Script', cursive;
						font-size: 48px;
						font-weight: 700;
						fill: #f97316;
						clip-path: inset(0 100% 0 0);
						animation: fillTextLoading 2s ease-in-out infinite;
					}
					
					@keyframes fillTextLoading {
						0% { clip-path: inset(0 100% 0 0); }
						50% { clip-path: inset(0 0% 0 0); }
						100% { clip-path: inset(0 0% 0 0); }
					}
					
					@media (max-width: 480px) {
						.text-outline-loading, .text-fill-loading { font-size: 52px; }
						.loading-svg { width: 98vw; max-width: none; }
					}
				`}</style>
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
				path="/profile"
				element={
					<AnimatedPage>
						<Profile />
					</AnimatedPage>
				}
			/>

			<Route
				path="/search"
				element={
					<AnimatedPage>
						<Search />
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
			<Route
				path="/test"
				element={
					<Test />
				}
			/>
			<Route path="/share/:token" element={<SharedView />} />
		
			{/* OAuth Callback Route */}
			<Route path="/auth/callback" element={<OAuthCallback />} />
		</Routes>
	);
}

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<TooltipProvider>
				<Toaster />
				<PWAInstallPrompt />
				<PushNotificationPrompt />
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
