/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>E-Mail-Adresse ändern — Feyrn ⚡</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logoText}>⚡ Feyrn</Text>
        </Section>
        <Heading style={h1}>E-Mail-Adresse ändern ✉️</Heading>
        <Text style={text}>
          Du möchtest deine E-Mail bei Feyrn von{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
          zu{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>{' '}
          ändern.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Änderung bestätigen →
          </Button>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          Falls du diese Änderung nicht angefordert hast, sichere bitte sofort dein Konto.
        </Text>
        <Text style={footerBrand}>Feyrn — Wo die Party beginnt.</Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Space Grotesk', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '32px' }
const logoText = { fontSize: '28px', fontWeight: 'bold' as const, color: '#7F77DD', margin: '0' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#08080f', margin: '0 0 20px', textAlign: 'center' as const }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const link = { color: '#7F77DD', textDecoration: 'underline' }
const buttonSection = { textAlign: 'center' as const, margin: '28px 0' }
const button = { backgroundColor: '#7F77DD', color: '#ffffff', fontSize: '16px', fontWeight: 'bold' as const, borderRadius: '12px', padding: '14px 32px', textDecoration: 'none' }
const divider = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 8px' }
const footerBrand = { fontSize: '12px', color: '#7F77DD', fontWeight: 'bold' as const, margin: '0' }
