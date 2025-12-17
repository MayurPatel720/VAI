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
