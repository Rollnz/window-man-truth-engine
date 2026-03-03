/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

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
} from 'npm:@react-email/components@0.0.22'

interface QuoteAnalysisEmailProps {
  firstName: string;
  overallScore: number;
  finalGrade: string;
  warnings: string[];
  missingItems: string[];
  summary: string;
  safetyScore: number;
  scopeScore: number;
  priceScore: number;
  finePrintScore: number;
  warrantyScore: number;
  pricePerOpening: string;
  vaultUrl: string;
}

const scoreColor = (score: number) =>
  score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';

const gradeColor = (grade: string) => {
  if (grade.startsWith('A')) return '#22c55e';
  if (grade.startsWith('B')) return '#3b82f6';
  if (grade.startsWith('C')) return '#eab308';
  return '#ef4444';
};

const PillarRow = ({ label, score }: { label: string; score: number }) => (
  <tr>
    <td style={pillarLabel}>{label}</td>
    <td style={pillarBarCell}>
      <div style={pillarBarTrack}>
        <div
          style={{
            ...pillarBarFill,
            width: `${Math.min(score, 100)}%`,
            backgroundColor: scoreColor(score),
          }}
        />
      </div>
    </td>
    <td style={pillarScore}>{score}/100</td>
  </tr>
);

export const QuoteAnalysisEmail = ({
  firstName,
  overallScore,
  finalGrade,
  warnings,
  missingItems,
  summary,
  safetyScore,
  scopeScore,
  priceScore,
  finePrintScore,
  warrantyScore,
  pricePerOpening,
  vaultUrl,
}: QuoteAnalysisEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      Your Quote Score: {overallScore}/100 — {warnings.length > 0 ? `${warnings.length} red flag${warnings.length > 1 ? 's' : ''} found` : 'See your full report'}
    </Preview>
    <Body style={main}>
      {/* ── Dark Header ── */}
      <Container style={headerContainer}>
        <Img
          src="https://itswindowman.com/icon-512.webp"
          width="48"
          height="48"
          alt="Window Truth Engine"
          style={{ margin: '0 auto', display: 'block', borderRadius: '8px' }}
        />
        <Text style={headerTitle}>Window Truth Engine</Text>
      </Container>

      {/* ── White Body ── */}
      <Container style={bodyContainer}>
        {/* Greeting */}
        <Text style={greeting}>
          {firstName ? `Hi ${firstName},` : 'Hi there,'}
        </Text>
        <Text style={bodyText}>
          We've analyzed your window quote. Here's what our AI found:
        </Text>

        {/* ── Score Gauge ── */}
        <Section style={scoreSection}>
          <table cellPadding="0" cellSpacing="0" style={{ margin: '0 auto' }}>
            <tbody>
              <tr>
                <td style={{ textAlign: 'center' as const, verticalAlign: 'middle' as const }}>
                  <div
                    style={{
                      width: '130px',
                      height: '130px',
                      borderRadius: '50%',
                      border: `6px solid ${scoreColor(overallScore)}`,
                      display: 'inline-block',
                      textAlign: 'center' as const,
                      lineHeight: '118px',
                    }}
                  >
                    <span style={{ fontSize: '44px', fontWeight: 'bold' as const, color: scoreColor(overallScore) }}>
                      {overallScore}
                    </span>
                  </div>
                </td>
                <td style={{ paddingLeft: '20px', verticalAlign: 'middle' as const }}>
                  <div
                    style={{
                      display: 'inline-block',
                      backgroundColor: gradeColor(finalGrade),
                      color: '#ffffff',
                      fontSize: '20px',
                      fontWeight: 'bold' as const,
                      padding: '8px 18px',
                      borderRadius: '8px',
                      letterSpacing: '1px',
                    }}
                  >
                    {finalGrade}
                  </div>
                  <Text style={{ color: '#6b7280', fontSize: '13px', margin: '8px 0 0' }}>
                    Overall Score
                  </Text>
                </td>
              </tr>
            </tbody>
          </table>
          {pricePerOpening && (
            <Text style={{ textAlign: 'center' as const, color: '#374151', fontSize: '14px', marginTop: '12px' }}>
              Estimated price per opening: <strong>{pricePerOpening}</strong>
            </Text>
          )}
        </Section>

        {/* ── Pillar Scores ── */}
        <Section style={sectionBlock}>
          <Heading as="h2" style={sectionHeading}>Score Breakdown</Heading>
          <table cellPadding="0" cellSpacing="0" style={{ width: '100%' }}>
            <tbody>
              <PillarRow label="Safety & Install" score={safetyScore} />
              <PillarRow label="Scope & Materials" score={scopeScore} />
              <PillarRow label="Pricing" score={priceScore} />
              <PillarRow label="Fine Print" score={finePrintScore} />
              <PillarRow label="Warranty" score={warrantyScore} />
            </tbody>
          </table>
        </Section>

        {/* ── Red Flags ── */}
        {warnings.length > 0 && (
          <Section style={sectionBlock}>
            <Heading as="h2" style={sectionHeading}>
              ⚠️ {warnings.length} Red Flag{warnings.length > 1 ? 's' : ''} Found
            </Heading>
            {warnings.map((w, i) => (
              <div key={i} style={flagCard}>
                <Text style={flagText}>⚠️ {w}</Text>
              </div>
            ))}
          </Section>
        )}

        {/* ── Missing Items ── */}
        {missingItems.length > 0 && (
          <Section style={sectionBlock}>
            <Heading as="h2" style={sectionHeading}>
              Missing From Your Quote
            </Heading>
            {missingItems.map((item, i) => (
              <div key={i} style={flagCard}>
                <Text style={flagText}>❌ {item}</Text>
              </div>
            ))}
          </Section>
        )}

        {/* ── Summary ── */}
        <Section style={sectionBlock}>
          <Heading as="h2" style={sectionHeading}>AI Summary</Heading>
          <Text style={bodyText}>{summary}</Text>
        </Section>

        <Hr style={{ borderColor: '#e5e7eb', margin: '28px 0' }} />

        {/* ── CTAs ── */}
        <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
          <Button href={vaultUrl} style={primaryButton}>
            View Full Results
          </Button>
        </Section>

        <Section style={{ textAlign: 'center' as const, margin: '16px 0' }}>
          <Button href="https://itswindowman.com/consultation" style={secondaryButton}>
            Get a Transparent Quote From Us
          </Button>
        </Section>

        <Text style={{ ...bodyText, fontSize: '13px', color: '#9ca3af', marginTop: '24px', textAlign: 'center' as const }}>
          Over 1,200 Florida homeowners have used our tools to protect themselves.
        </Text>
      </Container>

      {/* ── Footer ── */}
      <Container style={footerContainer}>
        <Text style={footerText}>
          Window Truth Engine by{' '}
          <Link href="https://itswindowman.com" style={{ color: '#9ca3af', textDecoration: 'underline' }}>
            Its Window Man
          </Link>
        </Text>
        <Text style={footerText}>
          You received this because you used our AI Quote Scanner.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default QuoteAnalysisEmail;

// ═══════════════════════════════════════
// Styles — all inlined for Gmail/Outlook
// ═══════════════════════════════════════

const fontStack = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const main = {
  backgroundColor: '#ffffff',
  fontFamily: fontStack,
};

const headerContainer = {
  backgroundColor: '#070A0F',
  padding: '28px 24px 20px',
  textAlign: 'center' as const,
  borderRadius: '12px 12px 0 0',
  maxWidth: '600px',
  margin: '0 auto',
};

const headerTitle = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold' as const,
  margin: '12px 0 0',
  textAlign: 'center' as const,
  letterSpacing: '-0.01em',
};

const bodyContainer = {
  padding: '32px 28px',
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
};

const greeting = {
  fontSize: '17px',
  color: '#111827',
  fontWeight: '600' as const,
  margin: '0 0 8px',
};

const bodyText = {
  fontSize: '15px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const scoreSection = {
  margin: '28px 0',
  textAlign: 'center' as const,
};

const sectionBlock = {
  margin: '24px 0',
};

const sectionHeading = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: '#111827',
  margin: '0 0 14px',
  letterSpacing: '-0.01em',
};

// Pillar bar styles
const pillarLabel = {
  fontSize: '13px',
  color: '#6b7280',
  padding: '6px 0',
  width: '120px',
};

const pillarBarCell = {
  padding: '6px 10px',
};

const pillarBarTrack = {
  backgroundColor: '#f3f4f6',
  borderRadius: '4px',
  height: '10px',
  width: '100%',
  overflow: 'hidden' as const,
};

const pillarBarFill = {
  height: '10px',
  borderRadius: '4px',
  transition: 'width 0.3s',
};

const pillarScore = {
  fontSize: '13px',
  fontWeight: '600' as const,
  color: '#374151',
  width: '60px',
  textAlign: 'right' as const,
  padding: '6px 0',
};

// Flag card styles
const flagCard = {
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '12px 16px',
  marginBottom: '8px',
  backgroundColor: '#fef2f2',
};

const flagText = {
  fontSize: '14px',
  color: '#991b1b',
  margin: '0',
  lineHeight: '1.5',
};

// Button styles
const primaryButton = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600' as const,
  padding: '14px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block' as const,
};

const secondaryButton = {
  backgroundColor: '#ffffff',
  color: '#2563eb',
  fontSize: '14px',
  fontWeight: '600' as const,
  padding: '12px 24px',
  borderRadius: '8px',
  border: '2px solid #2563eb',
  textDecoration: 'none',
  display: 'inline-block' as const,
};

const footerContainer = {
  backgroundColor: '#f9fafb',
  padding: '20px 24px',
  textAlign: 'center' as const,
  borderRadius: '0 0 12px 12px',
  maxWidth: '600px',
  margin: '0 auto',
  borderTop: '1px solid #e5e7eb',
};

const footerText = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0 0 4px',
};
