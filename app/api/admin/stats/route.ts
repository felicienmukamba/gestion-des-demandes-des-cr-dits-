import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [
      totalUsers,
      totalAccounts,
      totalBalanceResult,
      totalCreditRequests,
      pendingRequests,
      approvedCredits
    ] = await Promise.all([
      prisma.user.count(),
      prisma.account.count(),
      prisma.account.aggregate({
        _sum: {
          balance: true,
        },
      }),
      prisma.creditRequest.count(),
      prisma.creditRequest.count({
        where: { status: 'PENDING' }
      }),
      prisma.creditRequest.count({
        where: { status: 'APPROVED' }
      })
    ]);

    return NextResponse.json({
      totalUsers,
      totalAccounts,
      totalBalance: parseFloat(totalBalanceResult._sum.balance?.toString() || "0"),
      totalCreditRequests,
      pendingRequests,
      approvedCredits,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}