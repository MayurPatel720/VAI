/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Check } from "lucide-react";
import { cn } from "../lib/utils";
import { useState } from "react";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { isUnauthorizedError } from "../lib/authUtils";

interface PricingCardProps {
	title: string;
	titleGu: string;
	price: string;
	period?: string;
	features: Array<{ text: string; textGu: string }>;
	idealFor: string;
	idealForGu: string;
	highlighted?: boolean;
	icon?: string;
	planId?: "free" | "silver" | "gold" | "premium";
}

declare global {
	interface Window {
		Razorpay: any;
	}
}

export default function PricingCard({
	title,
	titleGu,
	price,
	period,
	features,

	highlighted = false,
	icon = "✅",
	planId = "free",
}: PricingCardProps) {
	const [isProcessing, setIsProcessing] = useState(false);
	const { toast } = useToast();
	const { user, isAuthenticated } = useAuth();

	const currentPlan = user?.subscription?.plan;
	const isCurrentPlan =
		currentPlan === planId && user?.subscription?.status === "active";

	const handleSelectPlan = async () => {
		if (planId === "free") {
			toast({
				title: "Free Plan Active",
				description: "You're using the free plan. Enjoy basic features!",
			});
			return;
		}

		if (!isAuthenticated) {
			toast({
				title: "Login Required",
				description: "Please login to subscribe to a plan",
				variant: "destructive",
			});
			setTimeout(() => {
				window.location.href = "/login";
			}, 1000);
			return;
		}

		if (isCurrentPlan) {
			toast({
				title: "Already Subscribed",
				description: `You're already on the ${title} plan`,
			});
			return;
		}

		setIsProcessing(true);

		try {
			const orderResponse = await apiRequest(
				"POST",
				"/api/payment/create-order",
				{
					plan: planId,
				}
			);
			const orderData = await orderResponse.json();

			const options = {
				key: orderData.key,
				amount: orderData.amount,
				currency: orderData.currency,
				name: "Vachanamrut",
				description: `${title} Subscription`,
				order_id: orderData.orderId,
				handler: async function (response: any) {
					try {
						const verifyResponse = await apiRequest(
							"POST",
							"/api/payment/verify",
							{
								razorpay_order_id: response.razorpay_order_id,
								razorpay_payment_id: response.razorpay_payment_id,
								razorpay_signature: response.razorpay_signature,
								plan: planId,
							}
						);
						await verifyResponse.json();
						toast({
							title: "Payment Successful!",
							description: `You're now subscribed to ${title}`,
						});
						setTimeout(() => window.location.reload(), 1500);
					} catch (error: any) {
						toast({
							title: "Payment Verification Failed",
							description: error.message || "Please contact support",
							variant: "destructive",
						});
					}
				},
				prefill: {
					email: user?.email || "",
					name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
				},
				theme: { color: "#D97638" },
			};

			const razorpay = new window.Razorpay(options);
			razorpay.open();
			razorpay.on("payment.failed", (response: any) => {
				toast({
					title: "Payment Failed",
					description: response.error.description || "Please try again",
					variant: "destructive",
				});
			});
		} catch (error: any) {
			if (isUnauthorizedError(error)) {
				toast({
					title: "Session Expired",
					description: "Please login again to continue",
					variant: "destructive",
				});
				setTimeout(() => {
					window.location.href = "/login";
				}, 1000);
				return;
			}
			toast({
				title: "Error",
				description: error.message || "Failed to process payment",
				variant: "destructive",
			});
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<Card
			className={cn(
				"p-6 flex flex-col h-full transition-all duration-200",
				highlighted && "border-primary border-2 shadow-md",
				isCurrentPlan && "border-green-500 border-2"
			)}
		>
			<div className="text-center mb-4">
				<div className="text-3xl mb-2">{icon}</div>
				<h3 className="text-xl font-serif font-semibold text-foreground mb-1">
					{title}
				</h3>
				<p className="text-sm text-muted-foreground mb-3">{titleGu}</p>
				<div className="flex items-baseline justify-center gap-1">
					<span className="text-3xl font-bold text-foreground">{price}</span>
					{period && (
						<span className="text-sm text-muted-foreground">/{period}</span>
					)}
				</div>
			</div>

			<div className="flex-1 space-y-3 mb-6">
				{features.map((feature, i) => (
					<div key={i} className="flex items-start gap-2">
						<Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
						<div>
							<p className="text-sm">{feature.text}</p>
							<p className="text-xs text-muted-foreground">{feature.textGu}</p>
						</div>
					</div>
				))}
			</div>

			<Button
				className="w-full mt-4"
				variant={
					isCurrentPlan ? "secondary" : highlighted ? "default" : "outline"
				}
				onClick={handleSelectPlan}
				disabled={isProcessing || isCurrentPlan}
			>
				{isCurrentPlan
					? "Current Plan"
					: isProcessing
					? "Processing..."
					: price === "Free"
					? "Get Started"
					: "Choose Plan"}
			</Button>
		</Card>
	);
}
