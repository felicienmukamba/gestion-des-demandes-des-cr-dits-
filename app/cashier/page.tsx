"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  CreditCard, 
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Printer,
  Search
} from "lucide-react";

export default function CashierDashboard() {
  const { data: session } = useSession();
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const handleTransaction = async (type: 'deposit' | 'withdrawal' | 'repayment') => {
    setIsLoading(true);
    setMessage("");
    setMessageType("");

    if (!accountNumber || !amount || parseFloat(amount) <= 0) {
      setMessage("Veuillez remplir tous les champs avec des valeurs valides");
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/cashier/transactions/${type}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountNumber,
          amount: parseFloat(amount),
          description: description || `${type} par caissier`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Erreur lors de la transaction");
        setMessageType("error");
      } else {
        setMessage(`Transaction effectuée avec succès ! Référence: ${data.reference}`);
        setMessageType("success");
        // Reset form
        setAccountNumber("");
        setAmount("");
        setDescription("");
      }
    } catch (error) {
      setMessage("Une erreur est survenue");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    // In a real application, this would generate and print a receipt
    window.print();
  };

  if (session?.user?.role !== "CASHIER") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès Refusé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Interface Caissier
          </h1>
          <p className="text-gray-600 mt-1">Enregistrez les transactions clients</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                <ArrowDownRight className="w-4 h-4 mr-2" />
                Dépôts du Jour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€12,450</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Retraits du Jour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€8,200</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                <RefreshCw className="w-4 h-4 mr-2" />
                Remboursements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€3,750</div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Forms */}
        <Tabs defaultValue="deposit" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deposit">Dépôt</TabsTrigger>
            <TabsTrigger value="withdrawal">Retrait</TabsTrigger>
            <TabsTrigger value="repayment">Remboursement</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deposit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wallet className="w-5 h-5 mr-2 text-green-600" />
                  Enregistrer un Dépôt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleTransaction('deposit'); }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Numéro de compte</Label>
                      <div className="relative">
                        <Input
                          id="accountNumber"
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="SAV123456789"
                          className="pr-10"
                          required
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Montant (€)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optionnel)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Motif du dépôt..."
                      rows={2}
                    />
                  </div>

                  {message && (
                    <div className={`px-4 py-3 rounded-md ${
                      messageType === "success" 
                        ? "bg-green-50 border border-green-200 text-green-700"
                        : "bg-red-50 border border-red-200 text-red-700"
                    }`}>
                      {message}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={isLoading}
                    >
                      {isLoading ? "Traitement..." : "Enregistrer le Dépôt"}
                    </Button>
                    {messageType === "success" && (
                      <Button
                        type="button"
                        onClick={handlePrintReceipt}
                        variant="outline"
                        className="flex items-center"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimer
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="withdrawal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-red-600" />
                  Enregistrer un Retrait
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleTransaction('withdrawal'); }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Numéro de compte</Label>
                      <div className="relative">
                        <Input
                          id="accountNumber"
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="SAV123456789"
                          className="pr-10"
                          required
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Montant (€)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optionnel)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Motif du retrait..."
                      rows={2}
                    />
                  </div>

                  {message && (
                    <div className={`px-4 py-3 rounded-md ${
                      messageType === "success" 
                        ? "bg-green-50 border border-green-200 text-green-700"
                        : "bg-red-50 border border-red-200 text-red-700"
                    }`}>
                      {message}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      disabled={isLoading}
                    >
                      {isLoading ? "Traitement..." : "Enregistrer le Retrait"}
                    </Button>
                    {messageType === "success" && (
                      <Button
                        type="button"
                        onClick={handlePrintReceipt}
                        variant="outline"
                        className="flex items-center"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimer
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="repayment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCw className="w-5 h-5 mr-2 text-blue-600" />
                  Enregistrer un Remboursement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleTransaction('repayment'); }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Numéro de compte</Label>
                      <div className="relative">
                        <Input
                          id="accountNumber"
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="SAV123456789"
                          className="pr-10"
                          required
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Montant (€)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optionnel)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Remboursement de crédit..."
                      rows={2}
                    />
                  </div>

                  {message && (
                    <div className={`px-4 py-3 rounded-md ${
                      messageType === "success" 
                        ? "bg-green-50 border border-green-200 text-green-700"
                        : "bg-red-50 border border-red-200 text-red-700"
                    }`}>
                      {message}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={isLoading}
                    >
                      {isLoading ? "Traitement..." : "Enregistrer le Remboursement"}
                    </Button>
                    {messageType === "success" && (
                      <Button
                        type="button"
                        onClick={handlePrintReceipt}
                        variant="outline"
                        className="flex items-center"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimer
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}