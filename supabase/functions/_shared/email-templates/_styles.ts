// Shared brand styles for Check My UX auth emails.
// Body background must always be #ffffff per email guidelines.

export const fontStack =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", "Helvetica Neue", Arial, sans-serif'

export const main = {
  backgroundColor: '#ffffff',
  fontFamily: fontStack,
  margin: 0,
  padding: '40px 0',
}

export const container = {
  maxWidth: '480px',
  margin: '0 auto',
  padding: '32px 28px',
}

export const brandRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '32px',
}

export const brandName = {
  fontFamily: fontStack,
  fontSize: '15px',
  fontWeight: 600 as const,
  color: 'hsl(220, 13%, 9%)',
  letterSpacing: '-0.01em',
  margin: 0,
}

export const h1 = {
  fontFamily: fontStack,
  fontSize: '24px',
  fontWeight: 700 as const,
  color: 'hsl(220, 13%, 9%)',
  letterSpacing: '-0.02em',
  lineHeight: '1.25',
  margin: '0 0 16px',
}

export const text = {
  fontFamily: fontStack,
  fontSize: '15px',
  color: 'hsl(220, 13%, 35%)',
  lineHeight: '1.55',
  margin: '0 0 24px',
}

export const link = {
  color: 'hsl(220, 13%, 9%)',
  textDecoration: 'underline',
}

export const button = {
  backgroundColor: 'hsl(220, 13%, 9%)',
  color: '#ffffff',
  fontFamily: fontStack,
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '16px',
  padding: '14px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}

export const footer = {
  fontFamily: fontStack,
  fontSize: '13px',
  color: 'hsl(220, 13%, 45%)',
  lineHeight: '1.5',
  margin: '32px 0 0',
}

export const codeStyle = {
  fontFamily: '"SF Mono", "Menlo", "Courier New", monospace',
  fontSize: '28px',
  fontWeight: 700 as const,
  letterSpacing: '0.15em',
  color: 'hsl(220, 13%, 9%)',
  backgroundColor: 'hsl(220, 14%, 96%)',
  borderRadius: '12px',
  padding: '16px 20px',
  display: 'inline-block',
  margin: '0 0 24px',
}
