import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { Loader2 } from "lucide-react";
import { baseURL } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";

export default function Register() {
	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		email: "",
		password: "",
	});
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { toast } = useToast();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const res = await fetch(`${baseURL}/api/auth/register`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});

			const data = await res.json();

			if (!res.ok) {
				toast({
					variant: "destructive",
					title: "Registration Failed ❌",
					description: data.message || "Something went wrong.",
				});
				return;
			}

			// Store token (auto login)
			localStorage.setItem("token", data.token);

			toast({
				title: "Account Created 🎉",
				description: "Welcome to your spiritual journey.",
			});

			// Redirect to homepage instead of login
			setTimeout(() => {
				navigate("/");
			}, 600);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			toast({
				variant: "destructive",
				title: "Server Error ❗" + err?.message,
				description: "Unable to register right now.",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSignup = () => {
		// Redirect to backend Google OAuth route
		window.location.href = `${baseURL}/api/auth/google`;
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background px-4">
			<Card className="max-w-md w-full shadow-lg border rounded-2xl">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-serif font-bold">
						Create Account
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						Begin your spiritual journey today
					</p>
				</CardHeader>

				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-2 gap-3">
							<Input
								placeholder="First Name"
								required
								value={form.firstName}
								onChange={(e) =>
									setForm({ ...form, firstName: e.target.value })
								}
							/>
							<Input
								placeholder="Last Name"
								required
								value={form.lastName}
								onChange={(e) => setForm({ ...form, lastName: e.target.value })}
							/>
						</div>

						<Input
							type="email"
							placeholder="Email"
							required
							value={form.email}
							onChange={(e) => setForm({ ...form, email: e.target.value })}
						/>

						<Input
							type="password"
							placeholder="Password"
							required
							value={form.password}
							onChange={(e) => setForm({ ...form, password: e.target.value })}
						/>

						<Button className="w-full" disabled={loading}>
							{loading ? (
								<Loader2 className="animate-spin mr-2 h-4 w-4" />
							) : (
								"Register"
							)}
						</Button>
					</form>

					{/* Divider */}
					<div className="relative my-6">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-border"></div>
						</div>
						<div className="relative flex justify-center text-xs">
							<span className="bg-card px-2 text-muted-foreground">Or continue with</span>
						</div>
					</div>

					{/* Google Sign-Up Button */}
					<Button
						type="button"
						onClick={handleGoogleSignup}
						variant="outline"
						className="w-full font-medium flex items-center justify-center gap-2"
					>
						<svg className="w-5 h-5" viewBox="0 0 24 24">
							<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
							<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
							<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
							<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
						</svg>
						Sign up with Google
					</Button>

					<p className="text-sm text-center mt-4 text-muted-foreground">
						Already have an account?{" "}
						<span
							className="text-primary cursor-pointer"
							onClick={() => navigate("/login")}
						>
							Login
						</span>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
