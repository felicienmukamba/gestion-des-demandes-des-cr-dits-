// components/Header.tsx
'use client';

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { CreditCard, LogOut, Loader2 } from "lucide-react";

export function Header() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              CréditSave
            </span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {/* Afficher un loader pendant le chargement de la session */}
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-gray-500" />
            )}

            {/* Logique conditionnelle pour les boutons */}
            {!isLoading && session?.user ? (
              // Utilisateur CONNECTÉ
              <>
                <span className="text-gray-600 hidden sm:inline">
                  Bonjour, {session.user.name || session.user.email}!
                </span>
                {/* L'utilisateur est connecté, le lien de déconnexion est actif */}
                <Button 
                  onClick={() => signOut({ callbackUrl: '/' })} 
                  variant="ghost" 
                  className="text-red-600 hover:bg-red-50"
                >
                  <LogOut className="mr-2 w-4 h-4" />
                  Déconnexion
                </Button>
                {/* Exemple de lien vers un dashboard (si l'utilisateur est connecté) */}
                <Link href="/dashboard">
                  <Button className="bg-green-600 hover:bg-green-700">
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : !isLoading && (
              // Utilisateur DÉCONNECTÉ
              <>
                <Link href="/auth/signin">
                  <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                    Se connecter
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Créer un compte
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}