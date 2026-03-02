/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password — Window Truth Engine</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>🏠 Window Truth Engine</Text>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset your password. Click below to choose a new one.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Reset Password
        </Button>
        <Text style={note}>⏰ This link expires in 1 hour.</Text>
        <Text style={footer}>
          If you didn't request this, you can safely ignore this email. Your password won't change.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const logo = { fontSize: '18px', fontWeight: 'bold' as const, color: '#2563a8', margin: '0 0 24px', textAlign: 'center' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2332', margin: '0 0 16px', letterSpacing: '-0.02em' }
const text = { fontSize: '15px', color: '#6b7a8d', lineHeight: '1.6', margin: '0 0 20px' }
const note = { fontSize: '13px', color: '#d97706', backgroundColor: '#fef3c7', padding: '12px 16px', borderRadius: '8px', margin: '0 0 20px' }
const button = { backgroundColor: '#2563a8', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '8px', padding: '14px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }
