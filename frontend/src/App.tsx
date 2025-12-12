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
import SharedView from "./pages/SharedView";

import { useAuth } from "./hooks/useAuth";
import Test from "./pages/Test";

function RouterContent() {
	const { isAuthenticated, isLoading } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [showIntro, setShowIntro] = useState(true);

	// Intro animation timer
	useEffect(() => {
		const timer = setTimeout(() => {
			setShowIntro(false);
		}, 3100); // 5 seconds

		return () => clearTimeout(timer)
	}, []);

	useEffect(() => {
		if (isLoading) return;

		const publicPaths = ["/", "/login", "/register", "/legal", "/admin", "/share/"];
		
		// Check if path starts with /share/ (to handle dynamic tokens)
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

	// Show intro animation during loading OR for first 5 seconds
	if (isLoading || showIntro) {
		return (
			<div className="intro-container">
				<svg 
					className="intro-svg"
					viewBox="0 0 600 80" 
					preserveAspectRatio="xMidYMid meet"
				>
					{/* Outline stroke text (always visible) */}
					<text 
						x="50%" 
						y="55" 
						textAnchor="middle"
						className="text-outline"
					>
						Vachanamrut AI
					</text>
					
					{/* Filled text (revealed with clip-path animation) */}
					<text 
						x="50%" 
						y="55" 
						textAnchor="middle"
						className="text-fill"
					>
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
						0% {
							clip-path: inset(0 100% 0 0);
						}
						100% {
							clip-path: inset(0 0% 0 0);
						}
					}
					
					/* Mobile responsive */
					@media (max-width: 480px) {
						.text-outline,
						.text-fill {
							font-size: 42px;
						}
						.intro-svg {
							width: 98vw;
							max-width: none;
						}
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
