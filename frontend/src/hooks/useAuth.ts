import { useQuery } from "@tanstack/react-query";
import type { User, Subscription } from "../shared/schema";
import { baseURL } from "../lib/queryClient";

interface UserWithSubscription extends User {
	subscription?: Subscription;
}

export function useAuth() {
	const query = useQuery<UserWithSubscription | null>({
		queryKey: ["/api/auth/user"],
		queryFn: async () => {
			const token = localStorage.getItem("token");
			if (!token) return null;

			const res = await fetch(`${baseURL}/api/auth/user`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (res.status === 401) return null;
			if (!res.ok) throw new Error("Failed to fetch user");

			return res.json();
		},

		retry: false,
		refetchOnWindowFocus: false,
	});

	return {
		user: query.data,
		isLoading: query.isLoading,
		isAuthenticated: !!query.data,
		refetchUser: query.refetch,
	};
}
