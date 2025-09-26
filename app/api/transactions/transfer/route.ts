import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { amount, toAccountNumber, description } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Montant invalide" },
        { status: 400 }
      );
    }

    if (!toAccountNumber) {
      return NextResponse.json(
        { error: "Numéro de compte destinataire requis" },
        { status: 400 }
      );
    }

    // Get sender's savings account
    const fromAccount = await prisma.account.findFirst({
      where: { 
        userId: session.user.id,
        type: 'SAVINGS'
      },
    });

    if (!fromAccount) {
      return NextResponse.json(
        { error: "Aucun compte d'épargne trouvé" },
        { status: 400 }
      );
    }

    // Get recipient's account
    const toAccount = await prisma.account.findUnique({
      where: { accountNumber: toAccountNumber },
      include: { user: true }
    });

    if (!toAccount) {
      return NextResponse.json(
        { error: "Compte destinataire introuvable" },
        { status: 400 }
      );
    }

    if (fromAccount.id === toAccount.id) {
      return NextResponse.json(
        { error: "Impossible de faire un virement vers le même compte" },
        { status: 400 }
      );
    }

    // Check if sufficient balance
    if (parseFloat(fromAccount.balance.toString()) < amount) {
      return NextResponse.json(
        { error: "Solde insuffisant" },
        { status: 400 }
      );
    }

    // Create transfer transactions
    const reference = `TRF${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const result = await prisma.$transaction(async (tx) => {
      // Create outgoing transaction
      const outTransaction = await tx.transaction.create({
        data: {
          type: 'TRANSFER_OUT',
          amount: parseFloat(amount.toString()),
          description: description || `Virement vers ${toAccount.accountNumber}`,
          reference,
          userId: session.user.id,
          accountId: fromAccount.id,
          toAccountId: toAccount.id,
        },
      });

      // Create incoming transaction
      await tx.transaction.create({
        data: {
          type: 'TRANSFER_IN',
          amount: parseFloat(amount.toString()),
          description: description || `Virement de ${fromAccount.accountNumber}`,
          reference,
          userId: toAccount.userId,
          accountId: toAccount.id,
          fromAccountId: fromAccount.id,
        },
      });

      // Update sender's balance
      await tx.account.update({
        where: { id: fromAccount.id },
        data: {
          balance: {
            decrement: parseFloat(amount.toString())
          }
        },
      });

      // Update recipient's balance
      await tx.account.update({
        where: { id: toAccount.id },
        data: {
          balance: {
            increment: parseFloat(amount.toString())
          }
        },
      });

      return outTransaction;
    });

    return NextResponse.json({
      ...result,
      amount: parseFloat(result.amount.toString()),
      recipientName: toAccount.user.name,
    });
  } catch (error) {
    console.error("Error processing transfer:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}