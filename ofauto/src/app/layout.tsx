import './globals.css'

export const metadata = {
  title: 'OFAuto',
  description: 'Automation platform for content creators',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: 'white', color: 'black' }}>
        {children}
      </body>
    </html>
  );
}
