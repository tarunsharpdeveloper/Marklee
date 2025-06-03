import './globals.css';

export const metadata = {
  title: "Marklee",
  description: "Your Digital Journey Starts Here",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
