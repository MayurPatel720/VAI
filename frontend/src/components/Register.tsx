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

export default function Register() {
	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		email: "",
		password: "",
	});
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const res = await fetch("/api/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});
			if (res.ok) navigate("/login");
		} finally {
			setLoading(false);
		}
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
