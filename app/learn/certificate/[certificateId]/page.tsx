import { Metadata } from "next";
import { CertificateView } from "./CertificateView";

interface PageProps {
  params: Promise<{
    certificateId: string;
  }>;
}

// Generate metadata for social sharing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { certificateId } = await params;
  
  // In a real app, fetch certificate data from database
  // For now, use placeholder data
  const title = "FIRE Course Certificate | WealthClaude";
  const description = "I completed the FIRE: Financial Independence Course on WealthClaude. Learn personal finance, investing, and the path to financial independence.";
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://wealthclaude.com/learn/certificate/${certificateId}`,
      images: [
        {
          url: `https://wealthclaude.com/api/og/certificate/${certificateId}`,
          width: 1200,
          height: 630,
          alt: "WealthClaude FIRE Course Certificate",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`https://wealthclaude.com/api/og/certificate/${certificateId}`],
    },
  };
}

export default async function CertificateSharePage({ params }: PageProps) {
  const { certificateId } = await params;
  
  return <CertificateView certificateId={certificateId} />;
}
