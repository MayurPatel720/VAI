import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

export default function UpgradeModal({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const navigate = useNavigate();

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent
				className="
					w-[90%] 
					max-w-[380px] 
					rounded-2xl 
					p-5
					text-center 
					space-y-5 
					bg-card/95 
					backdrop-blur-xl 
					border border-white/10
					shadow-2xl
					animate-in 
					fade-in-0 
					zoom-in-95
				"
			>
				<DialogHeader>
					<DialogTitle className="text-xl font-bold text-foreground">
						Daily Chat Limit Reached
					</DialogTitle>
				</DialogHeader>

				<p className="text-sm text-muted-foreground leading-relaxed">
					You have used all your chats for today.
					<br />
					Upgrade your plan to continue chatting without limits.
				</p>

				<Button
					className="
						w-full 
						text-lg 
						font-semibold 
						rounded-xl 
						py-2
						bg-amber-600 
						hover:bg-amber-700 
						transition
						shadow-md
					"
					onClick={() => navigate("/")}
				>
					Upgrade Plan
				</Button>

				<p className="text-xs text-muted-foreground">
					Your limit renews at midnight.
				</p>
			</DialogContent>
		</Dialog>
	);
}
