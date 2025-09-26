// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers'; // Fournit le SessionProvider
import { Header } from '@/components/Header'; // <-- NOUVEL IMPORT

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Système de Gestion d\'Épargne et de Crédit',
  description: 'Application de gestion financière moderne',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>
          {/* Le Header est placé dans le Layout pour être sur toutes les pages */}
          <Header /> 
          <main>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}