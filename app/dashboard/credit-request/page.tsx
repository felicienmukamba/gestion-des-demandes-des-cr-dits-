"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, Upload } from "lucide-react";
import Link from "next/link";

export default function CreditRequestPage() {
  const [formData, setFormData] = useState({
    amount: "",
    purpose: "",
    duration: "",
  });
  const [documents, setDocuments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Veuillez saisir un montant valide");
      setIsLoading(false);
      return;
    }

    if (!formData.purpose) {
      setError("Veuillez préciser l'objet du crédit");
      setIsLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("amount", formData.amount);
      formDataToSend.append("purpose", formData.purpose);
      formDataToSend.append("duration", formData.duration);
      
      documents.forEach((doc, index) => {
        formDataToSend.append(`document_${index}`, doc);
      });

      const response = await fetch("/api/credit-requests", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors de la demande");
      } else {
        setSuccess("Demande de crédit soumise avec succès !");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (error) {
      setError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-6">
          <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Demande de Crédit</h1>
          <p className="text-gray-600 mt-2">Soumettez votre demande de crédit avec les pièces justificatives</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-orange-600" />
              Nouvelle Demande de Crédit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant demandé (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="100"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  placeholder="5000.00"
                  className="text-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Objet du crédit</Label>
                <Select onValueChange={(value) => handleInputChange("purpose", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez l'objet du crédit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Crédit personnel</SelectItem>
                    <SelectItem value="auto">Crédit automobile</SelectItem>
                    <SelectItem value="home">Crédit immobilier</SelectItem>
                    <SelectItem value="education">Crédit étudiant</SelectItem>
                    <SelectItem value="business">Crédit professionnel</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Durée souhaitée (mois)</Label>
                <Select onValueChange={(value) => handleInputChange("duration", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez la durée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 mois</SelectItem>
                    <SelectItem value="24">24 mois</SelectItem>
                    <SelectItem value="36">36 mois</SelectItem>
                    <SelectItem value="48">48 mois</SelectItem>
                    <SelectItem value="60">60 mois</SelectItem>
                    <SelectItem value="72">72 mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documents">Pièces justificatives</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">
                    Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
                  </p>
                  <Input
                    id="documents"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("documents")?.click()}
                  >
                    Sélectionner les fichiers
                  </Button>
                </div>
                {documents.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Fichiers sélectionnés :</p>
                    <ul className="text-sm text-gray-600">
                      {documents.map((doc, index) => (
                        <li key={index}>• {doc.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Formats acceptés : PDF, JPG, PNG, DOC, DOCX (max 5MB par fichier)
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  {success}
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Soumission..." : "Soumettre la Demande"}
                </Button>
                <Link href="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Annuler
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}