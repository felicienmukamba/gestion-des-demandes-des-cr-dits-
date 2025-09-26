import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "CASHIER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { accountNumber, amount, description } = await request.json();

    if (!accountNumber || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Numéro de compte et montant requis" },
        { status: 400 }
      );
    }

    // Find the account
    const account = await prisma.account.findUnique({
      where: { accountNumber },
      include: { user: true }
    });

    if (!account) {
      return NextResponse.json(
        { error: "Compte introuvable" },
        { status: 404 }
      );
    }

    // Find active credit for this user
    const activeCredit = await prisma.credit.findFirst({
      where: {
        creditRequest: {
          userId: account.userId
        },
        isCompleted: false
      },
      include: {
        creditRequest: true
      }
    });

    if (!activeCredit) {
      return NextResponse.json(
        { error: "Aucun crédit actif trouvé pour ce compte" },
        { status: 404 }
      );
    }

    // Create repayment transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          type: 'REPAYMENT',
          amount: parseFloat(amount.toString()),
          description: description || 'Remboursement de crédit par caissier',
          reference: `REP${Date.now()}${Math.floor(Math.random() * 1000)}`,
          userId: account.userId,
          accountId: account.id,
          processedBy: session.user.id,
        },
      });

      // Create repayment record
      const repayment = await tx.repayment.create({
        data: {
          creditId: activeCredit.id,
          amount: parseFloat(amount.toString()),
          principalPaid: parseFloat(amount.toString()), // Simplified - in reality, split between principal and interest
          interestPaid: 0,
          dueDate: activeCredit.nextPaymentDate,
        },
      });

      // Update credit remaining amount
      const newRemainingAmount = parseFloat(activeCredit.remainingAmount.toString()) - parseFloat(amount.toString());
      
      await tx.credit.update({
        where: { id: activeCredit.id },
        data: {
          remainingAmount: Math.max(0, newRemainingAmount),
          isCompleted: newRemainingAmount <= 0,
          nextPaymentDate: newRemainingAmount > 0 ? 
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : // Next month
            activeCredit.nextPaymentDate
        },
      });

      return { transaction, repayment };
    });

    return NextResponse.json({
      ...result.transaction,
      amount: parseFloat(result.transaction.amount.toString()),
      accountHolder: account.user.name,
      remainingCredit: Math.max(0, parseFloat(activeCredit.remainingAmount.toString()) - amount),
    });
  } catch (error) {
    console.error("Error processing cashier repayment:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}