import './globals.css';
import { DarkModeProvider } from './context/DarkModeContext';

export const metadata = {
  title: "Marklee",
  description: "Your Digital Journey Starts Here",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
      </head>
      <body>
        <DarkModeProvider>
          {children}
        </DarkModeProvider>
      </body>
    </html>
  );
}
