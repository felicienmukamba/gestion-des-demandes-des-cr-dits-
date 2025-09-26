import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "CREDIT_AGENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const creditRequests = await prisma.creditRequest.findMany({
      where: {
        OR: [
          { status: 'COMMISSION_APPROVED' },
          { status: 'AGENT_VALIDATED' },
          { status: 'AGENT_REJECTED' }
        ]
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        documents: {
          select: {
            id: true,
            filename: true,
            documentType: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Convert Decimal to number for JSON serialization
    const formattedRequests = creditRequests.map(request => ({
      ...request,
      amount: parseFloat(request.amount.toString()),
      interestRate: request.interestRate ? parseFloat(request.interestRate.toString()) : null,
      monthlyPayment: request.monthlyPayment ? parseFloat(request.monthlyPayment.toString()) : null,
    }));

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error("Error fetching credit requests:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}