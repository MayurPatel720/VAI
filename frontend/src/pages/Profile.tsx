import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import {
	ArrowLeft,
	User,
	Mail,
	Phone,
	Calendar,
	MessageSquare,
	Bookmark,
	Crown,
	Bell,
	Save,
	Loader2,
	Settings,
	History,
	Lock,
} from "lucide-react";

interface ProfileData {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	phone: string;
	bio: string;
	profileImageUrl: string;
	preferences: {
		language: string;
		theme: string;
	};
	notificationPreferences: {
		dailyQuote: boolean;
		chatComplete: boolean;
		subscriptionReminders: boolean;
		appUpdates: boolean;
	};
	createdAt: string;
	subscription: {
		plan: string;
		status: string;
		endDate: string;
	} | null;
	stats: {
		totalMessages: number;
		totalSessions: number;
		totalBookmarks: number;
		daysSinceJoined: number;
		memberSince: string;
		subscriptionHistory: Array<{
			id: string;
			plan: string;
			status: string;
			startDate: string;
			endDate: string;
		}>;
	};
}

function ChangePasswordForm() {
	const { toast } = useToast();
	const [formData, setFormData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const changePasswordMutation = useMutation({
		mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
			const res = await apiRequest("PUT", "/api/auth/change-password", data);
			return res.json();
		},
		onSuccess: () => {
			toast({
				title: "Password Changed",
				description: "Your password has been updated successfully.",
			});
			setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
		},
		onError: (error: any) => {
			toast({
				title: "Error",
				description: error.message || "Failed to change password.",
				variant: "destructive",
			});
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		
		if (formData.newPassword.length < 6) {
			toast({
				title: "Error",
				description: "New password must be at least 6 characters long.",
				variant: "destructive",
			});
			return;
		}
		
		if (formData.newPassword !== formData.confirmPassword) {
			toast({
				title: "Error",
				description: "New passwords do not match.",
				variant: "destructive",
			});
			return;
		}

		changePasswordMutation.mutate({
			currentPassword: formData.currentPassword,
			newPassword: formData.newPassword,
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4 max-w-md">
			<div>
				<label className="text-sm font-medium text-muted-foreground">Current Password</label>
				<div className="relative mt-1">
					<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<input
						type="password"
						value={formData.currentPassword}
						onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
						required
						className="w-full pl-9 pr-3 py-2 bg-background border rounded-lg"
					/>
				</div>
			</div>
			<div>
				<label className="text-sm font-medium text-muted-foreground">New Password</label>
				<div className="relative mt-1">
					<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<input
						type="password"
						value={formData.newPassword}
						onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
						required
						minLength={6}
						className="w-full pl-9 pr-3 py-2 bg-background border rounded-lg"
					/>
				</div>
			</div>
			<div>
				<label className="text-sm font-medium text-muted-foreground">Confirm New Password</label>
				<div className="relative mt-1">
					<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<input
						type="password"
						value={formData.confirmPassword}
						onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
						required
						minLength={6}
						className="w-full pl-9 pr-3 py-2 bg-background border rounded-lg"
					/>
				</div>
			</div>
			<Button type="submit" disabled={changePasswordMutation.isPending} className="w-full">
				{changePasswordMutation.isPending ? (
					<Loader2 className="h-4 w-4 animate-spin mr-2" />
				) : (
					<Lock className="h-4 w-4 mr-2" />
				)}
				Change Password
			</Button>
		</form>
	);
}

export default function Profile() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { toast } = useToast();
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		phone: "",
		bio: "",
	});

	// Fetch profile
	const { data: profile, isLoading } = useQuery<ProfileData>({
		queryKey: ["profile"],
		queryFn: async () => {
			const res = await apiRequest("GET", "/api/profile");
			return res.json();
		},
	});

	// Initialize form when profile loads
	useState(() => {
		if (profile) {
			setFormData({
				firstName: profile.firstName,
				lastName: profile.lastName,
				phone: profile.phone || "",
				bio: profile.bio || "",
			});
		}
	});

	// Update profile mutation
	const updateMutation = useMutation({
		mutationFn: async (data: Partial<ProfileData>) => {
			const res = await apiRequest("PUT", "/api/profile", data);
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["profile"] });
			queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
			setIsEditing(false);
			toast({
				title: "Profile Updated",
				description: "Your changes have been saved.",
			});
		},
		onError: () => {
			toast({
				title: "Error",
				description: "Failed to update profile.",
				variant: "destructive",
			});
		},
	});

	// Update notification preferences
	const updateNotificationsMutation = useMutation({
		mutationFn: async (prefs: Partial<ProfileData["notificationPreferences"]>) => {
			const res = await apiRequest("PUT", "/api/notifications/preferences", prefs);
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["profile"] });
			toast({ title: "Notifications Updated" });
		},
	});

	const handleSave = () => {
		updateMutation.mutate(formData);
	};

	const toggleNotification = (key: keyof ProfileData["notificationPreferences"]) => {
		if (!profile) return;
		updateNotificationsMutation.mutate({
			[key]: !profile.notificationPreferences[key],
		});
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<p className="text-muted-foreground">Failed to load profile</p>
			</div>
		);
	}

	const planColors: Record<string, string> = {
		silver: "bg-gray-400",
		gold: "bg-amber-500",
		premium: "bg-purple-500",
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b">
				<div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Button variant="ghost" size="icon" onClick={() => navigate("/")}>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						<h1 className="text-xl font-bold">Profile</h1>
					</div>
					{isEditing ? (
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => setIsEditing(false)}>
								Cancel
							</Button>
							<Button onClick={handleSave} disabled={updateMutation.isPending}>
								{updateMutation.isPending ? (
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
								) : (
									<Save className="h-4 w-4 mr-2" />
								)}
								Save
							</Button>
						</div>
					) : (
						<Button variant="outline" onClick={() => {
							setFormData({
								firstName: profile.firstName,
								lastName: profile.lastName,
								phone: profile.phone || "",
								bio: profile.bio || "",
							});
							setIsEditing(true);
						}}>
							<Settings className="h-4 w-4 mr-2" />
							Edit Profile
						</Button>
					)}
				</div>
			</header>

			<main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
				{/* Profile Header */}
				<div className="bg-card border rounded-2xl p-6 md:p-8">
					<div className="flex flex-col md:flex-row items-start md:items-center gap-6">
						<div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
							{profile.firstName[0]}{profile.lastName[0]}
						</div>
						<div className="flex-1">
							{isEditing ? (
								<div className="grid grid-cols-2 gap-4 max-w-md">
									<div>
										<label className="text-sm text-muted-foreground">First Name</label>
										<input
											type="text"
											value={formData.firstName}
											onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
											className="w-full px-3 py-2 bg-background border rounded-lg mt-1"
										/>
									</div>
									<div>
										<label className="text-sm text-muted-foreground">Last Name</label>
										<input
											type="text"
											value={formData.lastName}
											onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
											className="w-full px-3 py-2 bg-background border rounded-lg mt-1"
										/>
									</div>
								</div>
							) : (
								<h2 className="text-2xl font-bold">
									{profile.firstName} {profile.lastName}
								</h2>
							)}
							<div className="flex items-center gap-2 text-muted-foreground mt-2">
								<Mail className="h-4 w-4" />
								<span>{profile.email}</span>
							</div>
							{(profile.phone || isEditing) && (
								<div className="flex items-center gap-2 text-muted-foreground mt-1">
									<Phone className="h-4 w-4" />
									{isEditing ? (
										<input
											type="tel"
											value={formData.phone}
											onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
											placeholder="Add phone number"
											className="px-2 py-1 bg-background border rounded-lg text-sm"
										/>
									) : (
										<span>{profile.phone}</span>
									)}
								</div>
							)}
							{profile.subscription && (
								<div className="mt-3">
									<span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium text-white ${planColors[profile.subscription.plan]}`}>
										<Crown className="h-3.5 w-3.5" />
										{profile.subscription.plan.charAt(0).toUpperCase() + profile.subscription.plan.slice(1)} Plan
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Bio */}
					<div className="mt-6">
						<label className="text-sm font-medium text-muted-foreground">About</label>
						{isEditing ? (
							<textarea
								value={formData.bio}
								onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
								placeholder="Write a short bio..."
								rows={3}
								maxLength={500}
								className="w-full px-3 py-2 bg-background border rounded-lg mt-1 resize-none"
							/>
						) : (
							<p className="text-foreground/80 mt-1">
								{profile.bio || "No bio yet. Click Edit to add one."}
							</p>
						)}
					</div>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="bg-card border rounded-xl p-4 text-center">
						<MessageSquare className="h-6 w-6 mx-auto text-primary mb-2" />
						<div className="text-2xl font-bold">{profile.stats.totalMessages}</div>
						<div className="text-sm text-muted-foreground">Messages</div>
					</div>
					<div className="bg-card border rounded-xl p-4 text-center">
						<History className="h-6 w-6 mx-auto text-primary mb-2" />
						<div className="text-2xl font-bold">{profile.stats.totalSessions}</div>
						<div className="text-sm text-muted-foreground">Conversations</div>
					</div>
					<div className="bg-card border rounded-xl p-4 text-center">
						<Bookmark className="h-6 w-6 mx-auto text-primary mb-2" />
						<div className="text-2xl font-bold">{profile.stats.totalBookmarks}</div>
						<div className="text-sm text-muted-foreground">Bookmarks</div>
					</div>
					<div className="bg-card border rounded-xl p-4 text-center">
						<Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
						<div className="text-2xl font-bold">{profile.stats.daysSinceJoined}</div>
						<div className="text-sm text-muted-foreground">Days Active</div>
					</div>
				</div>

				{/* Notification Preferences */}
				<div className="bg-card border rounded-2xl p-6">
					<div className="flex items-center gap-2 mb-4">
						<Bell className="h-5 w-5 text-primary" />
						<h3 className="text-lg font-semibold">Push Notifications</h3>
					</div>
					<div className="space-y-4">
						{[
							{ key: "dailyQuote", label: "Daily Spiritual Quote", desc: "Receive a daily wisdom quote at 6 AM" },
							{ key: "chatComplete", label: "Chat Completion", desc: "Notify when AI response is ready" },
							{ key: "subscriptionReminders", label: "Subscription Reminders", desc: "Get notified before plan expires" },
							{ key: "appUpdates", label: "App Updates", desc: "News and feature announcements" },
						].map((item) => (
							<div key={item.key} className="flex items-center justify-between py-2">
								<div>
									<div className="font-medium">{item.label}</div>
									<div className="text-sm text-muted-foreground">{item.desc}</div>
								</div>
								<button
									onClick={() => toggleNotification(item.key as keyof ProfileData["notificationPreferences"])}
									className={`relative w-12 h-6 rounded-full transition-colors ${
										profile.notificationPreferences[item.key as keyof ProfileData["notificationPreferences"]]
											? "bg-primary"
											: "bg-muted"
									}`}
								>
									<span
										className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
											profile.notificationPreferences[item.key as keyof ProfileData["notificationPreferences"]]
												? "translate-x-6"
												: ""
										}`}
									/>
								</button>
							</div>
						))}
					</div>
				</div>

				{/* Change Password */}
				<div className="bg-card border rounded-2xl p-6">
					<div className="flex items-center gap-2 mb-4">
						<Settings className="h-5 w-5 text-primary" />
						<h3 className="text-lg font-semibold">Change Password</h3>
					</div>
					<ChangePasswordForm />
				</div>

				{/* Subscription History */}
				{profile.stats.subscriptionHistory.length > 0 && (
					<div className="bg-card border rounded-2xl p-6">
						<div className="flex items-center gap-2 mb-4">
							<Crown className="h-5 w-5 text-primary" />
							<h3 className="text-lg font-semibold">Subscription History</h3>
						</div>
						<div className="space-y-3">
							{profile.stats.subscriptionHistory.map((sub) => (
								<div key={sub.id} className="flex items-center justify-between py-2 border-b last:border-0">
									<div>
										<span className="font-medium capitalize">{sub.plan}</span>
										<span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
											sub.status === "active" ? "bg-green-100 text-green-700" :
											sub.status === "expired" ? "bg-gray-100 text-gray-600" :
											"bg-red-100 text-red-600"
										}`}>
											{sub.status}
										</span>
									</div>
									<div className="text-sm text-muted-foreground">
										{new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Member Since */}
				<div className="text-center text-sm text-muted-foreground">
					<User className="h-4 w-4 inline mr-1" />
					Member since {new Date(profile.stats.memberSince).toLocaleDateString("en-US", {
						month: "long",
						day: "numeric",
						year: "numeric",
					})}
				</div>
			</main>
		</div>
	);
}
