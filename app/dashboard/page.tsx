"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  History,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Send
} from "lucide-react";
import Link from "next/link";

interface Account {
  id: string;
  accountNumber: string;
  type: string;
  balance: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface CreditRequest {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountsRes, transactionsRes, creditRequestsRes] = await Promise.all([
          fetch("/api/accounts"),
          fetch("/api/transactions"),
          fetch("/api/credit-requests"),
        ]);

        const [accountsData, transactionsData, creditRequestsData] = await Promise.all([
          accountsRes.json(),
          transactionsRes.json(),
          creditRequestsRes.json(),
        ]);

        setAccounts(accountsData);
        setTransactions(transactionsData);
        setCreditRequests(creditRequestsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchData();
    }
  }, [session]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "text-yellow-600 bg-yellow-50";
      case "APPROVED": return "text-green-600 bg-green-50";
      case "REJECTED": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const savingsAccount = accounts.find(acc => acc.type === "SAVINGS");
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bonjour, {session?.user?.name}
          </h1>
          <p className="text-gray-600 mt-1">Gérez vos finances en toute simplicité</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Solde Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalBalance)}
              </div>
              <div className="flex items-center mt-2">
                <Wallet className="w-4 h-4 mr-2" />
                <span className="text-sm opacity-90">
                  {accounts.length} compte{accounts.length > 1 ? 's' : ''}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Épargne
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {savingsAccount ? formatCurrency(savingsAccount.balance) : "€0"}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Compte {savingsAccount?.accountNumber}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Demandes de Crédit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {creditRequests.length}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {creditRequests.filter(cr => cr.status === "PENDING").length} en attente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <History className="w-4 h-4 mr-2" />
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {transactions.length}
              </div>
              <p className="text-xs text-gray-500 mt-2">Ce mois</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/dashboard/deposit">
            <Button className="w-full h-14 bg-green-600 hover:bg-green-700 text-white">
              <ArrowDownRight className="w-5 h-5 mr-2" />
              Faire un Dépôt
            </Button>
          </Link>
          
          <Link href="/dashboard/withdraw">
            <Button className="w-full h-14 bg-red-600 hover:bg-red-700 text-white">
              <ArrowUpRight className="w-5 h-5 mr-2" />
              Faire un Retrait
            </Button>
          </Link>
          
          <Link href="/dashboard/transfer">
            <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white">
              <Send className="w-5 h-5 mr-2" />
              Virement
            </Button>
          </Link>
          
          <Link href="/dashboard/credit-request">
            <Button className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white">
              <Plus className="w-5 h-5 mr-2" />
              Demande de Crédit
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions">Transactions Récentes</TabsTrigger>
            <TabsTrigger value="credits">Mes Crédits</TabsTrigger>
          </TabsList>
          
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dernières Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune transaction récente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                            transaction.type === 'DEPOSIT' ? 'bg-green-100' : 
                            transaction.type === 'WITHDRAWAL' ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            {transaction.type === 'DEPOSIT' ? 
                              <ArrowDownRight className="w-5 h-5 text-green-600" /> :
                              transaction.type === 'WITHDRAWAL' ?
                              <ArrowUpRight className="w-5 h-5 text-red-600" /> :
                              <Send className="w-5 h-5 text-blue-600" />
                            }
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.createdAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                        <div className={`font-semibold ${
                          transaction.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="credits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mes Demandes de Crédit</CardTitle>
              </CardHeader>
              <CardContent>
                {creditRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune demande de crédit</p>
                    <Link href="/dashboard/credit-request">
                      <Button className="mt-4">Faire une demande</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {creditRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              Demande de {formatCurrency(request.amount)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(request.createdAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status === 'PENDING' ? 'En attente' :
                             request.status === 'APPROVED' ? 'Approuvée' :
                             request.status === 'REJECTED' ? 'Rejetée' : request.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}