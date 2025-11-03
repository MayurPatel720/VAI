// components/Login.tsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import logoImage from "@assets/generated_images/Spiritual_lotus_book_logo_bce59c2c.png";

export default function Login() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const loginMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch("http://localhost:3000/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});
			const data = await res.json();
			if (data.token) {
				localStorage.setItem("token", data.token);
			}
			return data;
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["user"] });
			navigate("/");
		},
	});

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-amber-100 dark:from-slate-900 dark:to-slate-800 px-4">
			<div className="bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-8 w-full max-w-md text-center">
				<img src={logoImage} alt="Logo" className="w-20 mx-auto mb-4" />
				<h2 className="text-3xl font-serif font-bold mb-2 text-primary">
					Welcome Back
				</h2>
				<p className="text-sm text-muted-foreground mb-6">
					Continue your spiritual journey
				</p>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						loginMutation.mutate();
					}}
					className="space-y-4"
				>
					<input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
					/>
					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
					/>
					<Button
						type="submit"
						disabled={loginMutation.isPending}
						className="w-full bg-primary text-white rounded-md py-2"
					>
						{loginMutation.isPending ? "Logging in..." : "Login"}
					</Button>
				</form>

				<p className="text-sm text-muted-foreground mt-6">
					New here?{" "}
					<button
						onClick={() => navigate("/register")}
						className="text-primary underline"
					>
						Create an account
					</button>
				</p>
			</div>
		</div>
	);
}
