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
          description: description || 'Retrait par caissier',
          reference: `WIT${Date.now()}${Math.floor(Math.random() * 1000)}`,
          userId: account.userId,
          accountId: account.id,
          processedBy: session.user.id,
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
      accountHolder: account.user.name,
    });
  } catch (error) {
    console.error("Error processing cashier withdrawal:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}