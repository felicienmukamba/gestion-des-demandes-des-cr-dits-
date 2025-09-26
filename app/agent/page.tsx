"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  CreditCard,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

interface CreditRequest {
  id: string;
  amount: number;
  purpose: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  documents: Array<{
    id: string;
    filename: string;
    documentType: string;
  }>;
}

export default function AgentDashboard() {
  const { data: session } = useSession();
  const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCreditRequests = async () => {
      try {
        const response = await fetch("/api/agent/credit-requests");
        const data = await response.json();
        setCreditRequests(data);
      } catch (error) {
        console.error("Error fetching credit requests:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.role === "CREDIT_AGENT") {
      fetchCreditRequests();
    }
  }, [session]);

  const handleValidateCredit = async (requestId: string, action: 'validate' | 'reject') => {
    try {
      const response = await fetch(`/api/agent/credit-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        // Refresh the list
        const updatedResponse = await fetch("/api/agent/credit-requests");
        const updatedData = await updatedResponse.json();
        setCreditRequests(updatedData);
      }
    } catch (error) {
      console.error("Error updating credit request:", error);
    }
  };

  if (session?.user?.role !== "CREDIT_AGENT") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès Refusé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "COMMISSION_APPROVED": return "bg-blue-100 text-blue-800";
      case "AGENT_VALIDATED": return "bg-green-100 text-green-800";
      case "AGENT_REJECTED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING": return "En attente";
      case "COMMISSION_APPROVED": return "Approuvé par la commission";
      case "AGENT_VALIDATED": return "Validé";
      case "AGENT_REJECTED": return "Rejeté";
      default: return status;
    }
  };

  const pendingRequests = creditRequests.filter(req => req.status === "COMMISSION_APPROVED");
  const processedRequests = creditRequests.filter(req => 
    req.status === "AGENT_VALIDATED" || req.status === "AGENT_REJECTED"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de Bord Agent de Crédit
          </h1>
          <p className="text-gray-600 mt-1">Validez et gérez les demandes de crédit</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                En Attente de Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pendingRequests.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Validées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {processedRequests.filter(req => req.status === "AGENT_VALIDATED").length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center">
                <XCircle className="w-4 h-4 mr-2" />
                Rejetées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {processedRequests.filter(req => req.status === "AGENT_REJECTED").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Demandes à Valider</TabsTrigger>
            <TabsTrigger value="processed">Demandes Traitées</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                  Demandes en Attente de Validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune demande en attente de validation</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-6 bg-white">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">
                              Demande de {formatCurrency(request.amount)}
                            </h3>
                            <p className="text-gray-600">
                              Client: {request.user.name} ({request.user.email})
                            </p>
                            <p className="text-sm text-gray-500">
                              Objet: {request.purpose}
                            </p>
                            <p className="text-sm text-gray-500">
                              Date: {new Date(request.createdAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusText(request.status)}
                          </Badge>
                        </div>

                        {request.documents.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Pièces justificatives:</h4>
                            <div className="flex flex-wrap gap-2">
                              {request.documents.map((doc) => (
                                <Badge key={doc.id} variant="outline" className="text-xs">
                                  {doc.filename}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleValidateCredit(request.id, 'validate')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Valider
                          </Button>
                          <Button
                            onClick={() => handleValidateCredit(request.id, 'reject')}
                            variant="destructive"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rejeter
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="processed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Demandes Traitées</CardTitle>
              </CardHeader>
              <CardContent>
                {processedRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune demande traitée</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {processedRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {formatCurrency(request.amount)} - {request.user.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(request.createdAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusText(request.status)}
                          </Badge>
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