"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Share2,
  Linkedin,
  Twitter,
  Link2,
  Check,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CertificateProps {
  name: string;
  completionDate: Date;
  certificateId: string;
  className?: string;
}

export function Certificate({
  name,
  completionDate,
  certificateId,
  className,
}: CertificateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/learn/certificate/${certificateId}`;

  // Format date
  const formattedDate = completionDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Draw certificate on canvas
  const drawCertificate = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // Background
      ctx.fillStyle = "#1F1F23";
      ctx.fillRect(0, 0, width, height);

      // Border
      const borderPadding = 20;
      ctx.strokeStyle = "#5FD383";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        borderPadding,
        borderPadding,
        width - borderPadding * 2,
        height - borderPadding * 2
      );

      // Inner decorative border
      ctx.strokeStyle = "#5FD38340";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        borderPadding + 10,
        borderPadding + 10,
        width - (borderPadding + 10) * 2,
        height - (borderPadding + 10) * 2
      );

      // Corner decorations
      const cornerSize = 30;
      ctx.strokeStyle = "#5FD383";
      ctx.lineWidth = 2;

      // Top left
      ctx.beginPath();
      ctx.moveTo(borderPadding, borderPadding + cornerSize);
      ctx.lineTo(borderPadding, borderPadding);
      ctx.lineTo(borderPadding + cornerSize, borderPadding);
      ctx.stroke();

      // Top right
      ctx.beginPath();
      ctx.moveTo(width - borderPadding - cornerSize, borderPadding);
      ctx.lineTo(width - borderPadding, borderPadding);
      ctx.lineTo(width - borderPadding, borderPadding + cornerSize);
      ctx.stroke();

      // Bottom left
      ctx.beginPath();
      ctx.moveTo(borderPadding, height - borderPadding - cornerSize);
      ctx.lineTo(borderPadding, height - borderPadding);
      ctx.lineTo(borderPadding + cornerSize, height - borderPadding);
      ctx.stroke();

      // Bottom right
      ctx.beginPath();
      ctx.moveTo(width - borderPadding - cornerSize, height - borderPadding);
      ctx.lineTo(width - borderPadding, height - borderPadding);
      ctx.lineTo(width - borderPadding, height - borderPadding - cornerSize);
      ctx.stroke();

      // WealthClaude logo/text
      ctx.fillStyle = "#5FD383";
      ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("WEALTHCLAUDE", width / 2, 70);

      // Certificate title
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "300 16px system-ui, -apple-system, sans-serif";
      ctx.fillText("CERTIFICATE OF COMPLETION", width / 2, 110);

      // Decorative line
      ctx.strokeStyle = "#5FD38360";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 100, 130);
      ctx.lineTo(width / 2 + 100, 130);
      ctx.stroke();

      // "This certifies that"
      ctx.fillStyle = "#9CA3AF";
      ctx.font = "300 14px system-ui, -apple-system, sans-serif";
      ctx.fillText("This certifies that", width / 2, 170);

      // Name
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 36px system-ui, -apple-system, sans-serif";
      ctx.fillText(name, width / 2, 220);

      // Underline for name
      const nameWidth = ctx.measureText(name).width;
      ctx.strokeStyle = "#5FD383";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2 - nameWidth / 2 - 20, 235);
      ctx.lineTo(width / 2 + nameWidth / 2 + 20, 235);
      ctx.stroke();

      // "has successfully completed"
      ctx.fillStyle = "#9CA3AF";
      ctx.font = "300 14px system-ui, -apple-system, sans-serif";
      ctx.fillText("has successfully completed the", width / 2, 275);

      // Course name
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
      ctx.fillText("FIRE: Financial Independence Course", width / 2, 315);

      // Course details
      ctx.fillStyle = "#9CA3AF";
      ctx.font = "300 12px system-ui, -apple-system, sans-serif";
      ctx.fillText(
        "14 chapters • 70 sections • Comprehensive personal finance education",
        width / 2,
        350
      );

      // Award icon (simple circle with star)
      ctx.fillStyle = "#5FD383";
      ctx.beginPath();
      ctx.arc(width / 2, 410, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#1F1F23";
      ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
      ctx.fillText("★", width / 2, 418);

      // Date
      ctx.fillStyle = "#9CA3AF";
      ctx.font = "300 12px system-ui, -apple-system, sans-serif";
      ctx.fillText("Completed on", width / 2, 470);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "500 16px system-ui, -apple-system, sans-serif";
      ctx.fillText(formattedDate, width / 2, 495);

      // Certificate ID
      ctx.fillStyle = "#6B7280";
      ctx.font = "300 10px system-ui, -apple-system, sans-serif";
      ctx.fillText(`Certificate ID: ${certificateId}`, width / 2, 540);

      // Verification URL
      ctx.fillStyle = "#5FD38380";
      ctx.font = "300 10px system-ui, -apple-system, sans-serif";
      ctx.fillText(`Verify at: wealthclaude.com/learn/certificate/${certificateId}`, width / 2, 558);
    },
    [name, formattedDate, certificateId]
  );

  // Render canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size (2x for retina)
    const width = 800;
    const height = 600;
    canvas.width = width * 2;
    canvas.height = height * 2;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(2, 2);

    drawCertificate(ctx, width, height);
  }, [drawCertificate]);

  // Download as PNG
  const handleDownloadPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `wealthclaude-certificate-${certificateId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [certificateId]);

  // Download as PDF (using canvas to PDF)
  const handleDownloadPDF = useCallback(async () => {
    setIsGenerating(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Dynamic import jsPDF
      const { jsPDF } = await import("jspdf");

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [800, 600],
      });

      pdf.addImage(imgData, "PNG", 0, 0, 800, 600);
      pdf.save(`wealthclaude-certificate-${certificateId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      // Fallback to PNG
      handleDownloadPNG();
    } finally {
      setIsGenerating(false);
    }
  }, [certificateId, handleDownloadPNG]);

  // Copy share link
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [shareUrl]);

  // Share to LinkedIn
  const handleShareLinkedIn = useCallback(() => {
    const text = `I just completed the FIRE: Financial Independence Course on WealthClaude! 🎉`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "width=600,height=400");
  }, [shareUrl]);

  // Share to Twitter/X
  const handleShareTwitter = useCallback(() => {
    const text = `I just completed the FIRE: Financial Independence Course on @WealthClaude! 🔥💰 #FIRE #FinancialIndependence`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
  }, [shareUrl]);

  return (
    <div className={cn("w-full", className)}>
      {/* Certificate canvas */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-xl overflow-hidden shadow-2xl mb-8"
      >
        <canvas
          ref={canvasRef}
          className="w-full max-w-[800px] mx-auto block"
          style={{ aspectRatio: "800 / 600" }}
        />
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        {/* Download buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {isGenerating ? "Generating..." : "Download PDF"}
          </Button>
          <Button variant="outline" onClick={handleDownloadPNG} className="gap-2">
            <Download className="w-4 h-4" />
            PNG
          </Button>
        </div>

        {/* Share buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleShareLinkedIn}
            className="gap-2"
          >
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </Button>
          <Button
            variant="outline"
            onClick={handleShareTwitter}
            className="gap-2"
          >
            <Twitter className="w-4 h-4" />
            Share
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="gap-2"
          >
            {copied ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ===========================================
// Certificate Preview Card (smaller version)
// ===========================================

interface CertificatePreviewProps {
  name: string;
  completionDate: Date;
  certificateId: string;
  onClick?: () => void;
  className?: string;
}

export function CertificatePreview({
  name,
  completionDate,
  certificateId,
  onClick,
  className,
}: CertificatePreviewProps) {
  const formattedDate = completionDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full p-6 rounded-xl border border-primary/30 bg-primary/5 text-left transition-colors hover:bg-primary/10",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Award className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1">
            Course Certificate
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            FIRE: Financial Independence Course
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{name}</span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>
        </div>
        <Share2 className="w-5 h-5 text-muted-foreground" />
      </div>
    </motion.button>
  );
}

// ===========================================
// Generate Certificate ID
// ===========================================

export function generateCertificateId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "WC-";
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}
