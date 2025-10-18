export const metadata = {
  title: 'Calendar Multi-tenant',
  description: 'Dev site'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body>
        {children}
      </body>
    </html>
  );
}
