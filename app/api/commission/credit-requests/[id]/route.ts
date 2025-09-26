import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "CREDIT_COMMISSION") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { decision, commissionNote } = await request.json();
    const { id } = params;

    if (!decision || !['approve', 'reject'].includes(decision)) {
      return NextResponse.json(
        { error: "Décision invalide" },
        { status: 400 }
      );
    }

    // Get the credit request
    const creditRequest = await prisma.creditRequest.findUnique({
      where: { id }
    });

    if (!creditRequest) {
      return NextResponse.json(
        { error: "Demande de crédit introuvable" },
        { status: 404 }
      );
    }

    if (!['PENDING', 'UNDER_ANALYSIS'].includes(creditRequest.status)) {
      return NextResponse.json(
        { error: "Cette demande ne peut pas être traitée" },
        { status: 400 }
      );
    }

    const newStatus = decision === 'approve' ? 'COMMISSION_APPROVED' : 'COMMISSION_REJECTED';

    const updatedRequest = await prisma.creditRequest.update({
      where: { id },
      data: {
        status: newStatus,
        commissionNote: commissionNote || null,
        ...(decision === 'reject' && { 
          rejectionReason: 'Rejeté par la commission de crédit' 
        }),
      },
    });

    return NextResponse.json({
      ...updatedRequest,
      amount: parseFloat(updatedRequest.amount.toString()),
      interestRate: updatedRequest.interestRate ? parseFloat(updatedRequest.interestRate.toString()) : null,
      monthlyPayment: updatedRequest.monthlyPayment ? parseFloat(updatedRequest.monthlyPayment.toString()) : null,
    });
  } catch (error) {
    console.error("Error updating credit request:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}