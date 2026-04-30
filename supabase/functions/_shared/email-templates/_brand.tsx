/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { brandName, brandRow } from './_styles.ts'

export const BrandHeader = ({ siteName }: { siteName: string }) => (
  <table
    role="presentation"
    cellPadding={0}
    cellSpacing={0}
    border={0}
    style={brandRow}
  >
    <tbody>
      <tr>
        <td
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'hsl(220, 13%, 9%)',
            borderRadius: '10px',
            verticalAlign: 'middle',
            textAlign: 'center',
            color: '#ffffff',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            fontSize: '15px',
            fontWeight: 700,
          }}
        >
          ✦
        </td>
        <td style={{ paddingLeft: '10px', verticalAlign: 'middle' }}>
          <span style={brandName}>{siteName}</span>
        </td>
      </tr>
    </tbody>
  </table>
)
