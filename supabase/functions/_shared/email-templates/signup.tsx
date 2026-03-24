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
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Bestätige dein Konto bei Feyrn ⚡</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logoText}>⚡ Feyrn</Text>
        </Section>
        <Heading style={h1}>Die Nacht ruft. 🌙</Heading>
        <Text style={subtitle}>Nur noch ein Klick — dann bist du dabei.</Text>
        <Text style={text}>Hey,</Text>
        <Text style={text}>
          du hast dich gerade bei Feyrn angemeldet — der Plattform, auf der du
          in Echtzeit siehst, wo heute Nacht wirklich was geht.
        </Text>
        <Text style={text}>
          Klick auf den Button unten, um dein Konto zu bestätigen und direkt loszulegen.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Jetzt bestätigen →
          </Button>
        </Section>
        <Text style={timerText}>⏱ Der Link ist 15 Minuten gültig.</Text>
        <Hr style={divider} />
        <Text style={fallbackText}>
          Button funktioniert nicht? Kopiere diesen Link in deinen Browser:
        </Text>
        <Text style={urlText}>{confirmationUrl}</Text>
        <Hr style={divider} />
        <Text style={footer}>
          Du hast dich nicht bei Feyrn angemeldet? Dann ignoriere diese Mail einfach.
        </Text>
        <Text style={footerBrand}>Feyrn — Wo die Party beginnt.</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Space Grotesk', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '32px' }
const logoText = { fontSize: '28px', fontWeight: 'bold' as const, color: '#7F77DD', margin: '0' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#08080f', margin: '0 0 8px', textAlign: 'center' as const }
const subtitle = { fontSize: '16px', color: '#555555', margin: '0 0 28px', textAlign: 'center' as const }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const buttonSection = { textAlign: 'center' as const, margin: '28px 0' }
const button = { backgroundColor: '#7F77DD', color: '#ffffff', fontSize: '16px', fontWeight: 'bold' as const, borderRadius: '12px', padding: '14px 32px', textDecoration: 'none' }
const timerText = { fontSize: '13px', color: '#888888', textAlign: 'center' as const, margin: '0 0 24px' }
const divider = { borderColor: '#e5e5e5', margin: '24px 0' }
const fallbackText = { fontSize: '12px', color: '#888888', margin: '0 0 8px' }
const urlText = { fontSize: '11px', color: '#7F77DD', wordBreak: 'break-all' as const, margin: '0 0 8px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 8px' }
const footerBrand = { fontSize: '12px', color: '#7F77DD', fontWeight: 'bold' as const, margin: '0' }
