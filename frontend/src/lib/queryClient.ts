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

export async function apiRequest(
	method: string,
	url: string,
	data?: unknown | undefined
): Promise<Response> {
	console.log(url);
	const token = localStorage.getItem("token");

	const res = await fetch(baseURL + url, {
		method,
		headers: {
			...(data ? { "Content-Type": "application/json" } : {}),
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: data ? JSON.stringify(data) : undefined,
		credentials: "include",
	});

	await throwIfResNotOk(res);
	return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
	on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
	({ on401: unauthorizedBehavior }) =>
	async ({ queryKey }) => {
		const res = await fetch(queryKey.join("/") as string, {
			credentials: "include",
		});
		if (unauthorizedBehavior === "returnNull" && res.status === 401) {
			return null;
		}
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
