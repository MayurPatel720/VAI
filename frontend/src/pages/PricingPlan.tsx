/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Razorpay type
declare global {
	interface Window {
		Razorpay: any;
	}
}

interface Plan {
	name: string;
	monthlyPrice: string;
	yearlyPrice: string;
	description: string;
	features: string[];
	popular?: boolean;
}

const plans: Plan[] = [
	{
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
	const { user } = useAuth();

	// Handle backend value safely & normalize it
	const currentUserPlan =
		user?.subscription?.plan?.trim().toLowerCase() + " plan" || "";

	const handlePlanClick = (plan: Plan) => {
		// Free plan always navigates to chat
		if (plan.name === "Free Plan") {
			navigate("/chat");
			return;
		}

		// If current plan, also navigate
		if (plan.name.toLowerCase() === currentUserPlan) {
			navigate("/chat");
			return;
		}

		// Otherwise, trigger payment
		handlePayment(plan);
	};

	// Razorpay payment handler
	const handlePayment = (plan: Plan) => {
		const amount =
			billingCycle === "monthly"
				? parseInt(plan.monthlyPrice.replace("₹", "")) * 100
				: parseInt(plan.yearlyPrice.replace("₹", "")) * 100;

		const options = {
			key: "rzp_test_Ra2SvvOWqgqNtS",
			amount,
			currency: "INR",
			name: "Vachanamrut.ai",
			description: `Subscription for ${plan.name}`,
			image: "/logo.png",
			handler: function (response: any) {
				alert(
					`Payment successful for ${plan.name}! Payment ID: ${response.razorpay_payment_id}`
				);
				navigate("/chat");
			},
			prefill: {
				name: user?.firstName,
				email: user?.email,
			},
			theme: {
				color: "#f97316",
			},
		};

		const rzp = new window.Razorpay(options);
		rzp.open();
	};

	return (
		<div className="bg-background text-foreground min-h-screen flex flex-col items-center py-16">
			{/* Hero Section */}
			<motion.section
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="text-center px-4"
			>
				<h1 className="text-4xl font-bold mb-4 text-orange-600">
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
				className="flex items-center gap-4 mt-10 mb-8 bg-orange-50 p-2 rounded-full shadow-sm"
			>
				<button
					className={`px-4 py-2 rounded-full text-sm font-medium transition ${
						billingCycle === "monthly"
							? "bg-orange-500 text-white"
							: "text-orange-500"
					}`}
					onClick={() => setBillingCycle("monthly")}
				>
					Monthly Billing
				</button>
				<button
					className={`px-4 py-2 rounded-full text-sm font-medium transition ${
						billingCycle === "yearly"
							? "bg-orange-500 text-white"
							: "text-orange-500"
					}`}
					onClick={() => setBillingCycle("yearly")}
				>
					Annual Billing{" "}
					<span className="ml-1 text-xs opacity-80">(Save 15%)</span>
				</button>
			</motion.div>

			{/* Pricing Cards */}
			<section className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
				{plans.map((plan, index) => {
					const isCurrent =
						plan.name.toLowerCase() === (currentUserPlan || "").toLowerCase();

					return (
						<motion.div
							key={plan.name}
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1, duration: 0.4 }}
							className={`relative flex flex-col justify-between border rounded-2xl p-8 shadow-md hover:shadow-lg bg-white/50 backdrop-blur-sm transition-all duration-300 ${
								isCurrent
									? "border-green-500 shadow-green-200 animate-glow"
									: plan.popular
									? "border-orange-400"
									: "border-gray-200"
							}`}
						>
							{/* Tag Badges */}
							{plan.popular && !isCurrent && (
								<span className="absolute top-4 right-4 text-xs font-semibold bg-orange-500 text-white px-3 py-1 rounded-full">
									Most Popular
								</span>
							)}
							{isCurrent && (
								<span className="absolute top-4 right-4 text-xs font-semibold bg-green-600 text-white px-3 py-1 rounded-full shadow-md">
									Current Plan
								</span>
							)}

							{/* Content */}
							<div>
								<h3 className="text-xl font-semibold mb-2 text-orange-700">
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
											<span className="text-orange-500">✔</span>
											{feature}
										</li>
									))}
								</ul>
							</div>

							<button
								onClick={() => handlePlanClick(plan)}
								className={`mt-8 w-full py-3 rounded-lg font-medium transition-all duration-300 ${
									isCurrent
										? "bg-green-600 text-white shadow-lg shadow-green-300"
										: plan.popular
										? "bg-orange-500 text-white hover:bg-orange-600"
										: "border border-orange-300 text-orange-600 hover:bg-orange-50"
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
