// app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'GareManager',
  description: 'Plateforme de gestion des gares routières',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  );
}