/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import { main, container, h1, text, link, button, footer } from './_styles.ts'
import { BrandHeader } from './_brand.tsx'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email to start auditing UX with {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader siteName={siteName} />
        <Heading style={h1}>Confirm your email</Heading>
        <Text style={text}>
          Welcome to{' '}
          <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>
          . Confirm your address (
          <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>
          ) to start running UX audits in seconds.
        </Text>
        <Button style={button} href={confirmationUrl}>Confirm email</Button>
        <Text style={footer}>
          If you didn't sign up for {siteName}, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
