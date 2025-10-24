import "./globals.css";

export const metadata = {
  title: "Multi-Tenant Calendar",
  description: "Assignment Project",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}