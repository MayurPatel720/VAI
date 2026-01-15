import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { baseURL, queryClient } from "../lib/queryClient";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import logoImage from "@assets/generated_images/Spiritual_lotus_book_logo_bce59c2c.png";
import { useToast } from "../hooks/use-toast";

export default function Login() {
	const navigate = useNavigate();
	const { toast } = useToast();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const loginMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch(`${baseURL}/api/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const data = await res.json();
			return { status: res.status, data };
		},

		onSuccess: async (response) => {
			const { status, data } = response;

			if (status === 200 && data.token) {
				localStorage.setItem("token", data.token);

				toast({
					title: "Login Successful 🎉",
					description: "Welcome back to your spiritual journey.",
				});

				await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

				// Set flag to show welcome intro after redirect
				sessionStorage.setItem("showWelcomeIntro", "true");
				
				setTimeout(() => {
					navigate("/");
				}, 500);
			} else {
				toast({
					variant: "destructive",
					title: "Login Failed ❌",
					description: data.message || "Invalid email or password.",
				});
			}
		},

		onError: () => {
			toast({
				variant: "destructive",
				title: "Server Error ❗",
				description: "Unable to connect to the server.",
			});
		},
	});

const handleGoogleLogin = () => {
	// Redirect to backend Google OAuth route
	window.location.href = `${baseURL}/api/auth/google`;
};

	return (
		<div className="min-h-screen flex items-center justify-center bg-[#0d0c0a] px-4">
			<div className="bg-[#111010] border border-[#2a2927] shadow-[0_0_30px_rgba(0,0,0,0.4)] rounded-2xl p-8 w-full max-w-md text-center">
				<img src={logoImage} alt="Logo" className="w-20 mx-auto mb-4  ]" />

				<h2 className="text-3xl font-serif font-bold mb-2 text-[#f0e6d2]">
					Welcome Back
				</h2>
				<p className="text-sm text-[#b8b2a1] mb-6">
					Continue your spiritual journey
				</p>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						loginMutation.mutate();
					}}
					className="space-y-4 text-left"
				>
					<input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className="w-full border border-[#3a3935] bg-[#1a1917] rounded-md px-3 py-2 text-sm text-[#f0e6d2] placeholder:text-[#7b776d] focus:outline-none focus:ring-2 focus:ring-[#b76e22] transition-all duration-200"
					/>

					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						className="w-full border border-[#3a3935] bg-[#1a1917] rounded-md px-3 py-2 text-sm text-[#f0e6d2] placeholder:text-[#7b776d] focus:outline-none focus:ring-2 focus:ring-[#b76e22] transition-all duration-200"
					/>

					<Button
						type="submit"
						disabled={loginMutation.isPending}
						className="w-full bg-[#b76e22] hover:bg-[#c1782e] text-white font-medium rounded-md py-2 transition-all duration-200"
					>
						{loginMutation.isPending ? "Logging in..." : "Login"}
					</Button>
				</form>

			{/* Divider */}
			<div className="relative my-6">
				<div className="absolute inset-0 flex items-center">
					<div className="w-full border-t border-[#3a3935]"></div>
				</div>
				<div className="relative flex justify-center text-xs">
					<span className="bg-[#111010] px-2 text-[#7b776d]">Or continue with</span>
				</div>
			</div>

			{/* Google Sign-In Button */}
			<Button
				type="button"
				onClick={handleGoogleLogin}
				variant="outline"
				className="w-full border-[#3a3935] bg-[#1a1917] hover:bg-[#252320] text-[#f0e6d2] font-medium rounded-md py-2 transition-all duration-200 flex items-center justify-center gap-2"
			>
				<svg className="w-5 h-5" viewBox="0 0 24 24">
					<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
					<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
					<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
					<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
				</svg>
				Sign in with Google
			</Button>

				<p className="text-sm text-[#a59c8d] mt-6">
					New here?{" "}
					<button
						onClick={() => navigate("/register")}
						className="text-[#b76e22] hover:text-[#d58a40] underline transition-colors"
					>
						Create an account
					</button>
				</p>
			</div>
		</div>
	);
}
