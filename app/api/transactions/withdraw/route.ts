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

    const { amount, description } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Montant invalide" },
        { status: 400 }
      );
    }

    // Get user's savings account
    const account = await prisma.account.findFirst({
      where: { 
        userId: session.user.id,
        type: 'SAVINGS'
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Aucun compte d'épargne trouvé" },
        { status: 400 }
      );
    }

    // Check if sufficient balance
    if (parseFloat(account.balance.toString()) < amount) {
      return NextResponse.json(
        { error: "Solde insuffisant" },
        { status: 400 }
      );
    }

    // Create transaction and update balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          type: 'WITHDRAWAL',
          amount: parseFloat(amount.toString()),
          description: description || 'Retrait',
          reference: `WIT${Date.now()}${Math.floor(Math.random() * 1000)}`,
          userId: session.user.id,
          accountId: account.id,
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: account.id },
        data: {
          balance: {
            decrement: parseFloat(amount.toString())
          }
        },
      });

      return transaction;
    });

    return NextResponse.json({
      ...result,
      amount: parseFloat(result.amount.toString()),
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}