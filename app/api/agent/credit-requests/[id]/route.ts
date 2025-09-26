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
    
    if (!session?.user?.id || session.user.role !== "CREDIT_AGENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { action } = await request.json();
    const { id } = params;

    if (!action || !['validate', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: "Action invalide" },
        { status: 400 }
      );
    }

    // Get the credit request
    const creditRequest = await prisma.creditRequest.findUnique({
      where: { id },
      include: { account: true }
    });

    if (!creditRequest) {
      return NextResponse.json(
        { error: "Demande de crédit introuvable" },
        { status: 404 }
      );
    }

    if (creditRequest.status !== 'COMMISSION_APPROVED') {
      return NextResponse.json(
        { error: "Cette demande ne peut pas être traitée" },
        { status: 400 }
      );
    }

    let updatedRequest;

    if (action === 'validate') {
      // Calculate interest rate and monthly payment (simplified calculation)
      const interestRate = 0.05; // 5% annual rate
      const monthlyRate = interestRate / 12;
      const duration = creditRequest.duration || 12;
      const amount = parseFloat(creditRequest.amount.toString());
      
      const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, duration)) / 
                            (Math.pow(1 + monthlyRate, duration) - 1);

      updatedRequest = await prisma.$transaction(async (tx) => {
        // Update credit request
        const updated = await tx.creditRequest.update({
          where: { id },
          data: {
            status: 'AGENT_VALIDATED',
            interestRate: interestRate,
            monthlyPayment: monthlyPayment,
            approvedAt: new Date(),
          },
        });

        // Create credit record
        await tx.credit.create({
          data: {
            creditRequestId: id,
            principalAmount: amount,
            remainingAmount: amount,
            interestRate: interestRate,
            duration: duration,
            monthlyPayment: monthlyPayment,
            nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          },
        });

        // Add credit amount to user's account
        await tx.account.update({
          where: { id: creditRequest.accountId },
          data: {
            balance: {
              increment: amount
            }
          }
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            type: 'DEPOSIT',
            amount: amount,
            description: `Crédit accordé - ${creditRequest.purpose}`,
            reference: `CRD${Date.now()}${Math.floor(Math.random() * 1000)}`,
            userId: creditRequest.userId,
            accountId: creditRequest.accountId,
          },
        });

        return updated;
      });
    } else {
      updatedRequest = await prisma.creditRequest.update({
        where: { id },
        data: {
          status: 'AGENT_REJECTED',
          rejectionReason: 'Rejeté par l\'agent de crédit',
        },
      });
    }

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