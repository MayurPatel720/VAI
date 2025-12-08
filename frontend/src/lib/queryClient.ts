/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryClient, type QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
	if (!res.ok) {
		const text = (await res.text()) || res.statusText;
		throw new Error(`${res.status}: ${text}`);
	}
}
// export const baseURL = "http://localhost:3000";
export const baseURL = "https://vachanamrutai.onrender.com";
console.log(baseURL);

export async function apiRequest(method: string, url: string, data?: any) {
	const token = localStorage.getItem("token");

	const res = await fetch(baseURL + url, {
		method,
		headers: {
			...(data ? { "Content-Type": "application/json" } : {}),
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: data ? JSON.stringify(data) : undefined,
	});

	await throwIfResNotOk(res);
	return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
	on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
	({ on401 }) =>
	async ({ queryKey }) => {
		const endpoint = queryKey[0] as string;
		const token = localStorage.getItem("token");

		const res = await fetch(baseURL + endpoint, {
			method: "GET",
			headers: {
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		});

		if (on401 === "returnNull" && res.status === 401) return null;

		await throwIfResNotOk(res);
		return await res.json();
	};

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			queryFn: getQueryFn({ on401: "throw" }),
			refetchInterval: false,
			refetchOnWindowFocus: false,
			staleTime: Infinity,
			retry: false,
		},
		mutations: {
			retry: false,
		},
	},
});
