import { useState } from "react";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { FileText, FileJson, Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import logoImage from "@assets/generated_images/Spiritual_lotus_book_logo_bce59c2c.png";

interface ChatExportModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function ChatExportModal({ isOpen, onClose }: ChatExportModalProps) {
	const [copied, setCopied] = useState(false);
	const [exporting, setExporting] = useState(false);

	const getChatContent = (format: "text" | "json" | "markdown") => {
		const messages: { role: string; content: string; date: string }[] = [];
		document.querySelectorAll(".prose").forEach((el, index) => {
			const role = index % 2 === 0 ? "User" : "AI";
			const content = el.textContent || "";
			const date = new Date().toISOString();
			messages.push({ role, content, date });
		});

		if (format === "json") {
			return JSON.stringify({ conversation: messages, exportDate: new Date().toISOString() }, null, 2);
		}

		if (format === "markdown") {
			return messages.map(m => `**${m.role}** (${new Date(m.date).toLocaleString()}):\n${m.content}\n\n---\n`).join("\n");
		}

		return messages.map(m => `[${m.role}]: ${m.content}\n`).join("\n");
	};

	const handlePdfExport = async () => {
		setExporting(true);
		try {
			const doc = new jsPDF({
				format: 'a4',
				unit: 'mm',
			});
			
			const pageWidth = 210;
			const pageHeight = 297;
			const margin = 15;
			const contentWidth = pageWidth - (margin * 2);
			const headerY = 18; // Base Y for header elements
			
			// Helper function to add header/footer to each page
			const addPageDecoration = (pageNum: number, totalPages: number) => {
				// Page border
				doc.setDrawColor(255, 128, 0);
				doc.setLineWidth(0.5);
				doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
				
				// Logo - positioned to align center with text
				const img = new Image();
				img.src = logoImage;
				doc.addImage(img, 'PNG', margin, headerY - 6, 12, 12); // Smaller, centered
				
				// Title next to logo - ALIGNED with logo center
				doc.setFontSize(16);
				doc.setTextColor(255, 128, 0);
				doc.setFont("helvetica", "bold");
				doc.text("Vachanamrut AI", margin + 15, headerY + 1); // Vertically aligned with logo center
				
				// Date in top right - ALIGNED with title
				doc.setFontSize(9);
				doc.setTextColor(100);
				doc.setFont("helvetica", "normal");
				doc.text(new Date().toLocaleDateString(), pageWidth - margin, headerY + 1, { align: "right" });
				
				// Horizontal line below header
				doc.setDrawColor(220);
				doc.setLineWidth(0.3);
				doc.line(margin, headerY + 8, pageWidth - margin, headerY + 8);
				
				// Footer - single line layout
				const footerY = pageHeight - 12;
				doc.setFontSize(8);
				doc.setTextColor(120);
				doc.text("Vachanamrut AI", margin, footerY);
				
				doc.setTextColor(255, 128, 0);
				const link = "https://vachnamrutai.web.app/";
				doc.textWithLink(link, pageWidth / 2, footerY, { align: "center", url: link });
				
				doc.setTextColor(120);
				doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, footerY, { align: "right" });
			};

			// Get content
			const messages: { role: string; content: string }[] = [];
			document.querySelectorAll(".prose").forEach((el, index) => {
				const role = index % 2 === 0 ? "You" : "Vachanamrut AI";
				messages.push({ role, content: el.textContent || "" });
			});

			const startY = headerY + 14; // Content starts after header
			const lineHeight = 4.5; // Compact line height
			const msgGap = 6; // Gap between messages
			
			// Calculate pages first
			let y = startY;
			let pageCount = 1;
			
			messages.forEach((msg) => {
				const splitText = doc.splitTextToSize(msg.content, contentWidth);
				const msgHeight = 5 + (splitText.length * lineHeight) + msgGap;
				
				if (y + msgHeight > pageHeight - 20) {
					pageCount++;
					y = startY;
				}
				y += msgHeight;
			});

			// Render
			y = startY;
			let currentPage = 1;
			addPageDecoration(currentPage, pageCount);

			messages.forEach((msg) => {
				const splitText = doc.splitTextToSize(msg.content, contentWidth);
				const msgHeight = 5 + (splitText.length * lineHeight) + msgGap;
				
				if (y + msgHeight > pageHeight - 20) {
					doc.addPage();
					currentPage++;
					y = startY;
					addPageDecoration(currentPage, pageCount);
				}

				// Role
				doc.setFontSize(10);
				doc.setFont("helvetica", "bold");
				doc.setTextColor(msg.role === "You" ? 80 : 255, msg.role === "You" ? 80 : 128, msg.role === "You" ? 80 : 0);
				doc.text(msg.role, margin, y);
				y += 5;

				// Content - compact rendering
				doc.setFontSize(9);
				doc.setFont("helvetica", "normal");
				doc.setTextColor(50);
				
				splitText.forEach((line: string) => {
					doc.text(line, margin, y);
					y += lineHeight;
				});
				
				y += msgGap;
			});

			doc.save(`vachanamrut-chat-${new Date().toISOString().slice(0,10)}.pdf`);
		} catch (error) {
			console.error("PDF generation failed:", error);
		}
		setExporting(false);
		onClose();
	};

	const handleExport = (format: "text" | "json" | "markdown") => {
		const content = getChatContent(format);
		const blob = new Blob([content], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `vachanamrut-chat-${new Date().toISOString().slice(0,10)}.${format === "text" ? "txt" : format === "markdown" ? "md" : "json"}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		onClose();
	};

	const handleCopy = () => {
		const content = getChatContent("text");
		navigator.clipboard.writeText(content);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Export Conversation</DialogTitle>
					<DialogDescription>
						Download as PDF with branding, JSON backup, or plain text.
					</DialogDescription>
				</DialogHeader>

				<div className="grid grid-cols-1 gap-4 py-4">
					<div className="grid grid-cols-2 gap-3">
						<motion.button
							whileHover={{ scale: 1.02, backgroundColor: "rgba(var(--primary), 0.05)" }}
							whileTap={{ scale: 0.98 }}
							onClick={handlePdfExport}
							disabled={exporting}
							className="col-span-2 flex items-center justify-center p-4 border rounded-xl hover:border-primary/50 transition-colors gap-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20"
						>
							<div className="h-10 w-10 rounded-full bg-white dark:bg-black/20 flex items-center justify-center shadow-sm">
								<img src={logoImage} alt="PDF" className="h-6 w-6" />
							</div>
							<div className="text-left">
								<span className="block text-sm font-semibold text-foreground">Branded PDF</span>
								<span className="block text-xs text-muted-foreground">Best for sharing</span>
							</div>
						</motion.button>

						<motion.button
							whileHover={{ scale: 1.02, backgroundColor: "rgba(var(--primary), 0.05)" }}
							whileTap={{ scale: 0.98 }}
							onClick={() => handleExport("text")}
							className="flex flex-col items-center justify-center p-4 border rounded-xl hover:border-primary/50 transition-colors gap-2"
						>
							<FileText className="h-6 w-6 text-blue-500" />
							<span className="text-sm font-medium">Text</span>
						</motion.button>

						<motion.button
							whileHover={{ scale: 1.02, backgroundColor: "rgba(var(--primary), 0.05)" }}
							whileTap={{ scale: 0.98 }}
							onClick={() => handleExport("json")}
							className="flex flex-col items-center justify-center p-4 border rounded-xl hover:border-primary/50 transition-colors gap-2"
						>
							<FileJson className="h-6 w-6 text-amber-500" />
							<span className="text-sm font-medium">JSON</span>
						</motion.button>
					</div>

					<Button variant="outline" className="w-full mt-2" onClick={handleCopy}>
						{copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
						{copied ? "Copied to Clipboard" : "Copy to Clipboard"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
