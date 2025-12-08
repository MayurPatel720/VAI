import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from "@radix-ui/react-toast";
import { useToast } from "../../hooks/use-toast";

export function Toaster() {
	const { toasts } = useToast();

	return (
		<ToastProvider swipeDirection="right" duration={4000}>
			{toasts.map(({ id, title, description, action, ...props }) => (
				<Toast
					key={id}
					{...props}
					className="bg-[#1a1917] border border-[#3a3935] text-white rounded-lg p-4 shadow-lg flex items-start gap-3 animate-in fade-in slide-in-from-right-5"
				>
					<div className="grid gap-1">
						{title && (
							<ToastTitle className="font-semibold text-[#f0e6d2]">
								{title}
							</ToastTitle>
						)}
						{description && (
							<ToastDescription className="text-sm text-[#c7c2b7]">
								{description}
							</ToastDescription>
						)}
					</div>
					{action}
					<ToastClose className="text-white opacity-70 hover:opacity-100" />
				</Toast>
			))}

			{/* REQUIRED FIX !! */}
			<ToastViewport className="fixed bottom-6 right-6 flex flex-col gap-4 z-[99999] outline-none w-[360px] max-w-[90vw]" />
		</ToastProvider>
	);
}
