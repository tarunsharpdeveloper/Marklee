import { Inter } from 'next/font/google'
import GlobalStyles from './GlobalStyles'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Marklee Frontend',
  description: 'Marklee Frontend Application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GlobalStyles />
        {children}
      </body>
    </html>
  )
} 