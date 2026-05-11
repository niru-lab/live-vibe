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
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Die Nacht wartet auf dich. Bestätige deine Mail ✦</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={hero}>
          <Text style={kicker}>FEYRN</Text>
          <Heading style={h1}>Welcome to the night.</Heading>
          <Text style={subtitle}>
            Schön, dass du da bist. Eine letzte Sache fehlt noch — dann
            geht's los.
          </Text>
        </Section>

        <Section style={card}>
          <Text style={text}>
            Hey 👋 willkommen bei{' '}
            <Link href={siteUrl} style={link}>
              <strong>Feyrn</strong>
            </Link>
            . Ab jetzt verpasst du keine Nacht mehr — Events, Crews und
            Momente, alles an einem Ort.
          </Text>
          <Text style={text}>
            Tipp einmal auf den Button und du bist drin:
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0 8px' }}>
            <Button style={button} href={confirmationUrl}>
              Let's go ✦
            </Button>
          </Section>
          <Text style={small}>
            Mail-Adresse:{' '}
            <Link href={`mailto:${recipient}`} style={muted}>
              {recipient}
            </Link>
          </Text>
        </Section>

        <Text style={footer}>
          Du kennst Feyrn nicht und das war nicht du? Kein Stress — ignorier
          diese Mail einfach, dann passiert nichts.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
}
const container = { padding: '24px 20px', maxWidth: '560px' }
const hero = {
  background:
    'linear-gradient(135deg, #08080f 0%, #1a1535 60%, #7F77DD 140%)',
  borderRadius: '20px',
  padding: '40px 28px',
  textAlign: 'center' as const,
  marginBottom: '20px',
}
const kicker = {
  fontSize: '11px',
  letterSpacing: '3px',
  color: '#7F77DD',
  fontWeight: 600,
  margin: '0 0 14px',
}
const h1 = {
  fontSize: '30px',
  fontWeight: 700,
  color: '#ffffff',
  margin: '0 0 12px',
  letterSpacing: '-0.5px',
}
const subtitle = {
  fontSize: '15px',
  color: 'rgba(255,255,255,0.75)',
  lineHeight: '1.5',
  margin: 0,
}
const card = {
  backgroundColor: '#ffffff',
  border: '1px solid #ececf5',
  borderRadius: '16px',
  padding: '28px 24px',
}
const text = {
  fontSize: '15px',
  color: '#2a2a35',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const small = {
  fontSize: '12px',
  color: '#8a8a98',
  textAlign: 'center' as const,
  margin: '16px 0 0',
}
const link = { color: '#7F77DD', textDecoration: 'none', fontWeight: 600 }
const muted = { color: '#8a8a98', textDecoration: 'underline' }
const button = {
  backgroundColor: '#7F77DD',
  backgroundImage: 'linear-gradient(135deg, #7F77DD 0%, #5a4fc7 100%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  borderRadius: '999px',
  padding: '14px 36px',
  textDecoration: 'none',
  display: 'inline-block',
  letterSpacing: '0.3px',
}
const footer = {
  fontSize: '12px',
  color: '#a0a0ad',
  textAlign: 'center' as const,
  margin: '24px 8px 0',
  lineHeight: '1.5',
}
