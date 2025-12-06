/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import type { User, Subscription } from "../shared/schema";
import { baseURL } from "../lib/queryClient";

interface UserWithSubscription extends User {
	firstName: any;
	lastName: any;
	email: any;
	profileImageUrl: string | null;
	subscription?: Subscription;
}

export function useAuth() {
	const {
		data: user,
		isLoading,
		refetch: refetchUser, // 🔥 ADD THIS
	} = useQuery<UserWithSubscription>({
		queryKey: ["user"],
		queryFn: async () => {
			const token = localStorage.getItem("token");
			const res = await fetch(`${baseURL}/api/auth/user`, {
				headers: token ? { Authorization: `Bearer ${token}` } : {},
				credentials: "include",
			});

			if (!res.ok) throw new Error("Failed to fetch user");
			return res.json();
		},
		retry: false,
		refetchOnWindowFocus: false, // optional
	});

	return {
		user,
		isLoading,
		isAuthenticated: !!user,
		refetchUser, // 🔥 RETURN THIS
	};
}
