"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Award, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Certificate } from "@/components/learn/Certificate";

interface CertificateData {
  id: string;
  name: string;
  completedAt: string;
  valid: boolean;
}

interface CertificateViewProps {
  certificateId: string;
}

export function CertificateView({ certificateId }: CertificateViewProps) {
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        // In a real app, fetch from API
        // const res = await fetch(`/api/learn/certificate/${certificateId}`);
        // const data = await res.json();
        
        // For demo, simulate API response
        // Check if certificate ID format is valid
        if (!certificateId.startsWith("WC-") || certificateId.length !== 11) {
          setError("Certificate not found");
          setLoading(false);
          return;
        }

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Mock certificate data
        // In production, this would come from the database
        setCertificate({
          id: certificateId,
          name: "Course Graduate", // Would come from DB
          completedAt: new Date().toISOString(),
          valid: true,
        });
      } catch (err) {
        setError("Failed to load certificate");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading certificate...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <Award className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Certificate Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This certificate doesn't exist or may have been removed. 
            The certificate ID may be incorrect.
          </p>
          <Link href="/learn">
            <Button>
              Start the Course
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Valid certificate
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Award className="w-4 h-4" />
            Verified Certificate
          </div>
          <h1 className="text-3xl font-bold mb-3">
            Course Completion Certificate
          </h1>
          <p className="text-muted-foreground">
            This certificate verifies completion of the FIRE: Financial Independence Course
          </p>
        </motion.div>

        {/* Certificate */}
        <Certificate
          name={certificate.name}
          completionDate={new Date(certificate.completedAt)}
          certificateId={certificate.id}
        />

        {/* Verification info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-4 rounded-xl bg-muted/50 text-center"
        >
          <p className="text-sm text-muted-foreground">
            <span className="text-primary">✓</span> This certificate is verified and valid.
            Certificate ID: <code className="text-foreground">{certificate.id}</code>
          </p>
        </motion.div>

        {/* CTA for visitors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-6 rounded-xl border border-primary/30 bg-primary/5 text-center"
        >
          <h3 className="font-semibold mb-2">
            Want to earn your own certificate?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Learn personal finance, investing, and the path to financial independence with our free course.
          </p>
          <Link href="/learn">
            <Button className="gap-2">
              Start Learning Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
