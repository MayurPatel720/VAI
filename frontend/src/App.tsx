import { queryClient } from "./lib/queryClient";
import Chat from "./pages/Chat";
import Landing from "./pages/Landing";
import NotFound from "./pages/not-found";
import { useAuth } from "./hooks/useAuth";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import {
	BrowserRouter,
	Route,
	Routes,
	useNavigate,
	useLocation,
} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import AnimatedPage from "./pages/AnimatedPage";

function RouterContent() {
	const { isAuthenticated, isLoading } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		if (isLoading) return;

		if (!isAuthenticated && location.pathname !== "/register") {
			navigate("/login");
		} else if (isAuthenticated && location.pathname === "/login") {
			navigate("/");
		}
	}, [isAuthenticated, isLoading, location.pathname, navigate]);

	console.log("Auth status:", isAuthenticated);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
