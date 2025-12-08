/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { baseURL } from "../lib/queryClient";

declare global {
	interface Window {
		Razorpay: any;
	}
}

interface Plan {
	key: string;
	name: string;
	monthlyPrice: string;
	yearlyPrice: string;
	description: string;
	features: string[];
	popular?: boolean;
}
const token = localStorage.getItem("token") || "";

const plans: Plan[] = [
	{
		key: "free",
		name: "Free Plan",
		monthlyPrice: "₹0",
		yearlyPrice: "₹0",
		description: "Start your spiritual journey effortlessly.",
		features: [
			"Access to daily Vachanamrut quotes",
			"AI-powered short summaries",
			"Gujarati + English translation view",
			"Limited to 5 AI questions per day",
		],
	},

	{
		key: "silver",
		name: "Silver Plan",
		monthlyPrice: "₹149",
		yearlyPrice: "₹1490",
		description: "Enhance your experience with deeper insights.",
		features: [
			"Everything in Free Plan",
			"Ask up to 30 AI questions daily",
			"Save favorite Vachanamruts",
			"Spiritual meanings with explanations",
			"Daily reminder notifications",
		],
		popular: true,
	},

	{
		key: "gold",
		name: "Gold Plan",
		monthlyPrice: "₹299",
		yearlyPrice: "₹2990",
		description: "Get full personalized spiritual assistance.",
		features: [
			"Everything in Silver Plan",
			"AI chat about spiritual doubts",
			"Personalized reading recommendations",
			"Audio mode (Gujarati)",
			"Quiz & reflection journal",
			"Early access to new features",
		],
	},

	{
		key: "premium",
		name: "Premium Plan",
		monthlyPrice: "₹499",
		yearlyPrice: "₹4990",
		description: "For seekers who want everything unlimited.",
		features: [
			"Everything in Gold Plan",
			"AI Guru Mode — spiritual mentor chat",
			"Voice input in Gujarati & English",
			"Priority support & updates",
		],
	},
];

const PricingPlan: React.FC = () => {
	const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
		"monthly"
	);
	const navigate = useNavigate();
	const { user, refetchUser } = useAuth();

	const currentUserPlan =
		(user?.subscription?.plan?.trim().toLowerCase() || "") + " plan";

	const handlePlanClick = (plan: Plan) => {
		if (!user) {
			navigate("/login");
			return;
		}

		if (plan.key === "free" || plan.name.toLowerCase() === currentUserPlan) {
			return navigate("/chat");
		}

		handlePayment(plan);
	};

	const handlePayment = async (plan: any) => {
		if (!plan || !plan.key) {
			console.error("❌ NO PLAN PROVIDED:", plan);

			return;
		}
		const selectedPlan = plan.key; // silver/gold/premium

		// 1) Create Razorpay order
		const orderRes = await fetch(`${baseURL}/api/payment/create-order`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ plan: selectedPlan }),
		});

		const orderData = await orderRes.json();

		if (!orderData.orderId) {
			console.log("Failed to create order");
			return;
		}

		const options = {
			key: orderData.key,
			amount: orderData.amount,
			currency: orderData.currency,
			name: "Vachanamrut AI",
			description: `Subscription for ${plan.name}`,
			order_id: orderData.orderId,
			handler: async (response: {
				razorpay_order_id: any;
				razorpay_payment_id: any;
				razorpay_signature: any;
			}) => {
				const verifyRes = await fetch(`${baseURL}/api/payment/verify`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						razorpay_order_id: response.razorpay_order_id,
						razorpay_payment_id: response.razorpay_payment_id,
						razorpay_signature: response.razorpay_signature,
						plan: selectedPlan,
					}),
				});

				const verifyData = await verifyRes.json();

				if (verifyData.subscription) {
					console.log("Payment successful!");
					await refetchUser(); // refresh the user subscription instantly

					navigate("/chat");
				} else {
					console.log("Payment verification failed");
				}
			},
			theme: { color: "#b76e22" },
		};

		const rzp = new window.Razorpay(options);
		rzp.open();
	};

	return (
		<div className="min-h-screen flex flex-col items-center py-16 bg-background text-foreground transition-colors duration-300">
			{/* Hero Section */}
			<motion.section
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="text-center px-4"
			>
				<h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-orange-700 dark:text-[#f5d6b1]">
					Choose Your Spiritual Path
				</h1>
				<p className="text-muted-foreground max-w-xl mx-auto">
					Select a plan that matches your devotional journey. All plans include
					access to authentic Vachanamrut teachings and AI-powered insights.
				</p>
			</motion.section>

			{/* Billing Toggle */}
			<motion.div
				initial={{ opacity: 0 }}
				whileInView={{ opacity: 1 }}
				transition={{ delay: 0.3 }}
				className="flex items-center gap-4 mt-10 mb-8 bg-card p-2 rounded-full border border-border shadow-sm"
			>
				<button
					className={`px-4 py-2 rounded-full text-sm font-medium transition ${
						billingCycle === "monthly"
							? "bg-primary text-primary-foreground"
							: "text-primary"
					}`}
					onClick={() => setBillingCycle("monthly")}
				>
					Monthly Billing
				</button>
				<button
					className={`px-4 py-2 rounded-full text-sm font-medium transition ${
						billingCycle === "yearly"
							? "bg-primary text-primary-foreground"
							: "text-primary"
					}`}
					onClick={() => setBillingCycle("yearly")}
				>
					Annual Billing{" "}
					<span className="ml-1 text-xs opacity-80">(Save 15%)</span>
				</button>
			</motion.div>

			{/* Pricing Cards */}
			<section className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{plans.map((plan, index) => {
					const isCurrent =
						plan.name.toLowerCase() === (currentUserPlan || "").toLowerCase();

					return (
						<motion.div
							key={plan.name}
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1, duration: 0.4 }}
							className={`relative flex flex-col justify-between border rounded-2xl p-8 shadow-md hover:shadow-lg transition-all duration-300 
							bg-card text-card-foreground`}
						>
							{/* Badges */}
							{plan.popular && !isCurrent && (
								<span className="absolute top-4 right-4 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1 rounded-full">
									Most Popular
								</span>
							)}
							{isCurrent && (
								<span className="absolute top-4 right-4 text-xs font-semibold bg-green-600 text-white px-3 py-1 rounded-full shadow-md">
									Current Plan
								</span>
							)}

							{/* Plan Details */}
							<div>
								<h3 className="text-xl font-semibold mb-2 text-primary">
									{plan.name}
								</h3>
								<p className="text-muted-foreground mb-6">{plan.description}</p>
								<p className="text-4xl font-bold mb-2">
									{billingCycle === "monthly"
										? plan.monthlyPrice
										: plan.yearlyPrice}
								</p>
								<p className="text-sm text-muted-foreground mb-6">
									per {billingCycle === "monthly" ? "month" : "year"}
								</p>
								<ul className="space-y-2 text-sm">
									{plan.features.map((feature, i) => (
										<li key={i} className="flex items-center gap-2">
											<span className="text-primary">✔</span>
											{feature}
										</li>
									))}
								</ul>
							</div>

							{/* Button */}
							<button
								onClick={() => handlePlanClick(plan)}
								className={`mt-8 w-full py-3 rounded-lg font-medium transition-all duration-300 ${
									isCurrent
										? "bg-green-600 text-white"
										: plan.popular
										? "bg-primary text-primary-foreground hover:opacity-90"
										: "border border-primary text-primary hover:bg-muted"
								}`}
							>
								{isCurrent || plan.name === "Free Plan"
									? "Get Started"
									: "Upgrade Plan"}
							</button>
						</motion.div>
					);
				})}
			</section>
		</div>
	);
};

export default PricingPlan;
