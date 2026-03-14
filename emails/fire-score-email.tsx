import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface FireScoreEmailProps {
  name: string;
  score: number;
  percentile: string;
  tips: Array<{
    priority: "critical" | "moderate" | "good";
    title: string;
    description: string;
    action: string;
  }>;
  pdfUrl?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wealthclaude.com";

export const FireScoreEmail = ({
  name = "Friend",
  score = 47,
  percentile = "top 35%",
  tips = [],
  pdfUrl,
}: FireScoreEmailProps) => {
  const firstName = name.split(" ")[0];

  const getScoreColor = (s: number) => {
    if (s >= 80) return "#22c55e";
    if (s >= 60) return "#22c55e";
    if (s >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return "Excellent";
    if (s >= 60) return "Good";
    if (s >= 40) return "Fair";
    return "Needs Work";
  };

  const getPriorityColor = (p: string) => {
    if (p === "critical") return "#ef4444";
    if (p === "moderate") return "#f59e0b";
    return "#22c55e";
  };

  return (
    <Html>
      <Head />
      <Preview>
        Your FIRE Score is {score}/100 - See your personalized roadmap
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>WealthClaude</Text>
          </Section>

          {/* Greeting */}
          <Section style={section}>
            <Heading style={h1}>Hey {firstName}! 👋</Heading>
            <Text style={text}>
              Thanks for taking the FIRE Score assessment. Here's your complete
              breakdown and personalized roadmap to financial freedom.
            </Text>
          </Section>

          {/* Score Section */}
          <Section style={scoreSection}>
            <table style={{ width: "100%" }}>
              <tr>
                <td align="center">
                  <div style={scoreCircleOuter}>
                    <div
                      style={{
                        ...scoreCircleInner,
                        borderColor: getScoreColor(score),
                      }}
                    >
                      <Text style={scoreNumber}>{score}</Text>
                      <Text style={scoreLabel}>/100</Text>
                    </div>
                  </div>
                </td>
              </tr>
            </table>
            <Text style={scoreStatus}>
              <span style={{ color: getScoreColor(score), fontWeight: "bold" }}>
                {getScoreLabel(score)}
              </span>{" "}
              — You're in the {percentile} of wealth builders
            </Text>
          </Section>

          {/* Timeline Comparison */}
          <Section style={section}>
            <table style={comparisonTable}>
              <tr>
                <td style={comparisonCell}>
                  <Text style={comparisonLabel}>Current Path</Text>
                  <Text style={comparisonValue}>~3.2 years</Text>
                  <Text style={comparisonSubtext}>to optimal score</Text>
                </td>
                <td style={comparisonDivider}></td>
                <td style={comparisonCell}>
                  <Text style={{ ...comparisonLabel, color: "#22c55e" }}>
                    With Guidance
                  </Text>
                  <Text style={{ ...comparisonValue, color: "#22c55e" }}>
                    ~12 months
                  </Text>
                  <Text style={comparisonSubtext}>to optimal score</Text>
                </td>
              </tr>
            </table>
          </Section>

          <Hr style={hr} />

          {/* Priority Recommendations */}
          <Section style={section}>
            <Heading style={h2}>🎯 Your Priority Recommendations</Heading>

            {tips.map((tip, index) => (
              <div key={index} style={tipCard}>
                <table style={{ width: "100%" }}>
                  <tr>
                    <td>
                      <Text
                        style={{
                          ...tipPriority,
                          color: getPriorityColor(tip.priority),
                        }}
                      >
                        {tip.priority.toUpperCase()}
                      </Text>
                      <Text style={tipTitle}>{tip.title}</Text>
                      <Text style={tipDescription}>{tip.description}</Text>
                      <Text style={tipAction}>
                        <strong>Action:</strong> {tip.action}
                      </Text>
                    </td>
                  </tr>
                </table>
              </div>
            ))}
          </Section>

          <Hr style={hr} />

          {/* The Gap Section */}
          <Section style={gapSection}>
            <Heading style={h2}>💡 The Wealth Gap Reality</Heading>
            <Text style={text}>
              Here's what separates the stuck zone from financial freedom:
            </Text>

            <table style={gapTable}>
              <tr>
                <td style={gapHeaderRetail}>❌ Retail Mindset</td>
                <td style={gapHeaderWealth}>✓ Wealthy Mindset</td>
              </tr>
              <tr>
                <td style={gapCellRetail}>"I'll figure it out myself"</td>
                <td style={gapCellWealth}>CPA + CFA + Advisor team</td>
              </tr>
              <tr>
                <td style={gapCellRetail}>$500 on things they don't need</td>
                <td style={gapCellWealth}>$500 on tax strategy</td>
              </tr>
              <tr>
                <td style={gapCellRetail}>Ignores tax optimization</td>
                <td style={gapCellWealth}>Saves $10K+/year in taxes</td>
              </tr>
              <tr>
                <td style={{ ...gapCellRetail, borderBottom: "none" }}>
                  Stuck for 10+ years
                </td>
                <td style={{ ...gapCellWealth, borderBottom: "none" }}>
                  FIRE in 5-7 years
                </td>
              </tr>
            </table>
          </Section>

          <Hr style={hr} />

          {/* CTA Section */}
          <Section style={ctaSection}>
            <Heading style={h2}>🚀 Ready to Accelerate?</Heading>
            <Text style={text}>
              You don't have to stay stuck. Book a free 30-minute strategy call
              and get a personalized plan to reach your FIRE goal faster.
            </Text>

            <Button style={ctaButton} href={`${baseUrl}/book`}>
              Book Free Strategy Call
            </Button>

            {pdfUrl && (
              <Text style={pdfLink}>
                <Link href={pdfUrl} style={link}>
                  📄 Download your full PDF report
                </Link>
              </Text>
            )}
          </Section>

          {/* Free App Section */}
          <Section style={appSection}>
            <Text style={appTitle}>
              🎁 BONUS: When you work with us, you get FREE lifetime access to
              WealthClaude — our wealth tracking app where you can:
            </Text>
            <Text style={appFeatures}>
              ✓ Track all assets (Stocks, Real Estate, Gold, Crypto)
              <br />
              ✓ Monitor your debts and net worth
              <br />
              ✓ Watch your FIRE Score update in real-time
              <br />✓ Set and track your financial goals
            </Text>
            <Text style={appValue}>
              (Most apps charge $50-200/month for this — you get it FREE)
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              The wealthy don't have secrets. They just have the right team.
            </Text>
            <Text style={footerLinks}>
              <Link href={baseUrl} style={footerLink}>
                Website
              </Link>{" "}
              ·{" "}
              <Link href={`${baseUrl}/services`} style={footerLink}>
                Services
              </Link>{" "}
              ·{" "}
              <Link href={`${baseUrl}/book`} style={footerLink}>
                Book a Call
              </Link>
            </Text>
            <Text style={footerDisclaimer}>
              © 2026 WealthClaude · wealthclaude.com
              <br />
              This email is for educational purposes only and does not
              constitute financial advice.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default FireScoreEmail;

// Styles
const main = {
  backgroundColor: "#0a0f18",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#0a0f18",
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
};

const header = {
  padding: "24px",
  textAlign: "center" as const,
  borderBottom: "1px solid rgba(255,255,255,0.1)",
};

const logo = {
  color: "#22c55e",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
};

const section = {
  padding: "24px",
};

const h1 = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const h2 = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const text = {
  color: "rgba(255,255,255,0.7)",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
};

const scoreSection = {
  padding: "32px 24px",
  textAlign: "center" as const,
  backgroundColor: "rgba(255,255,255,0.02)",
  borderRadius: "16px",
  margin: "0 24px",
};

const scoreCircleOuter = {
  display: "inline-block",
  padding: "8px",
};

const scoreCircleInner = {
  width: "120px",
  height: "120px",
  borderRadius: "50%",
  border: "6px solid",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(255,255,255,0.05)",
};

const scoreNumber = {
  color: "#ffffff",
  fontSize: "48px",
  fontWeight: "bold",
  margin: "0",
  lineHeight: "1",
};

const scoreLabel = {
  color: "rgba(255,255,255,0.5)",
  fontSize: "14px",
  margin: "0",
};

const scoreStatus = {
  color: "rgba(255,255,255,0.7)",
  fontSize: "16px",
  marginTop: "16px",
};

const comparisonTable = {
  width: "100%",
  backgroundColor: "rgba(255,255,255,0.05)",
  borderRadius: "12px",
  padding: "16px",
};

const comparisonCell = {
  textAlign: "center" as const,
  padding: "12px",
  width: "45%",
};

const comparisonDivider = {
  width: "10%",
  borderLeft: "1px solid rgba(255,255,255,0.1)",
};

const comparisonLabel = {
  color: "#f59e0b",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  margin: "0 0 4px 0",
};

const comparisonValue = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
};

const comparisonSubtext = {
  color: "rgba(255,255,255,0.4)",
  fontSize: "12px",
  margin: "4px 0 0 0",
};

const hr = {
  borderColor: "rgba(255,255,255,0.1)",
  margin: "0",
};

const tipCard = {
  backgroundColor: "rgba(255,255,255,0.03)",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "12px",
  borderLeft: "4px solid",
  borderLeftColor: "#22c55e",
};

const tipPriority = {
  fontSize: "10px",
  fontWeight: "bold",
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
};

const tipTitle = {
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0 0 8px 0",
};

const tipDescription = {
  color: "rgba(255,255,255,0.6)",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 8px 0",
};

const tipAction = {
  color: "rgba(255,255,255,0.8)",
  fontSize: "14px",
  margin: "0",
};

const gapSection = {
  padding: "24px",
  backgroundColor: "rgba(255,255,255,0.02)",
};

const gapTable = {
  width: "100%",
  borderCollapse: "collapse" as const,
  marginTop: "16px",
};

const gapHeaderRetail = {
  backgroundColor: "rgba(239,68,68,0.1)",
  color: "#ef4444",
  padding: "12px",
  fontSize: "14px",
  fontWeight: "bold",
  textAlign: "center" as const,
  borderRadius: "8px 0 0 0",
};

const gapHeaderWealth = {
  backgroundColor: "rgba(34,197,94,0.1)",
  color: "#22c55e",
  padding: "12px",
  fontSize: "14px",
  fontWeight: "bold",
  textAlign: "center" as const,
  borderRadius: "0 8px 0 0",
};

const gapCellRetail = {
  padding: "12px",
  fontSize: "13px",
  color: "rgba(255,255,255,0.6)",
  textAlign: "center" as const,
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  backgroundColor: "rgba(239,68,68,0.02)",
};

const gapCellWealth = {
  padding: "12px",
  fontSize: "13px",
  color: "rgba(255,255,255,0.8)",
  textAlign: "center" as const,
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  backgroundColor: "rgba(34,197,94,0.02)",
};

const ctaSection = {
  padding: "32px 24px",
  textAlign: "center" as const,
};

const ctaButton = {
  backgroundColor: "#22c55e",
  borderRadius: "12px",
  color: "#000000",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "16px 32px",
  margin: "24px auto",
};

const pdfLink = {
  marginTop: "16px",
  textAlign: "center" as const,
};

const link = {
  color: "#22c55e",
  textDecoration: "underline",
};

const appSection = {
  padding: "24px",
  backgroundColor: "rgba(34,197,94,0.05)",
  borderRadius: "16px",
  margin: "0 24px 24px",
  border: "1px solid rgba(34,197,94,0.2)",
};

const appTitle = {
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px 0",
};

const appFeatures = {
  color: "rgba(255,255,255,0.7)",
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "0 0 16px 0",
};

const appValue = {
  color: "#22c55e",
  fontSize: "13px",
  fontStyle: "italic",
  margin: "0",
};

const footer = {
  padding: "24px",
  textAlign: "center" as const,
};

const footerText = {
  color: "rgba(255,255,255,0.5)",
  fontSize: "14px",
  fontStyle: "italic",
  margin: "0 0 16px 0",
};

const footerLinks = {
  margin: "0 0 16px 0",
};

const footerLink = {
  color: "#22c55e",
  fontSize: "14px",
  textDecoration: "none",
};

const footerDisclaimer = {
  color: "rgba(255,255,255,0.3)",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
};
