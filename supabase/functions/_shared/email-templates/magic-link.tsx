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
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Dein Magic Link ist da ✦</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={hero}>
          <Text style={kicker}>FEYRN</Text>
          <Heading style={h1}>Ein Klick und du bist drin.</Heading>
          <Text style={subtitle}>Kein Passwort. Keine Tipparbeit. ✦</Text>
        </Section>

        <Section style={card}>
          <Text style={text}>
            Hier ist dein Login-Link für {siteName}. Tipp drauf und du bist
            sofort eingeloggt — der Link läuft aber bald ab, also nicht zu
            lange warten:
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0 8px' }}>
            <Button style={button} href={confirmationUrl}>
              Einloggen ✦
            </Button>
          </Section>
        </Section>

        <Text style={footer}>
          Du hast den Link nicht angefordert? Dann ignorier die Mail einfach.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
