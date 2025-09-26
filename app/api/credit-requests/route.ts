import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const creditRequests = await prisma.creditRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        purpose: true,
        status: true,
        createdAt: true,
        interestRate: true,
        duration: true,
        monthlyPayment: true,
      },
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await request.formData();
    const amount = formData.get("amount") as string;
    const purpose = formData.get("purpose") as string;
    const duration = formData.get("duration") as string;

    if (!amount || !purpose) {
      return NextResponse.json(
        { error: "Montant et objet requis" },
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

    const creditRequest = await prisma.$transaction(async (tx) => {
      // Create credit request
      const request = await tx.creditRequest.create({
        data: {
          amount: parseFloat(amount),
          purpose,
          duration: duration ? parseInt(duration) : null,
          userId: session.user.id,
          accountId: account.id,
          status: 'PENDING',
        },
      });

      // Handle document uploads (simplified - in production, use proper file storage)
      const documents = [];
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('document_') && value instanceof File) {
          // In a real app, you'd upload to cloud storage
          documents.push({
            filename: value.name,
            filepath: `/uploads/${request.id}/${value.name}`,
            documentType: value.type,
            creditRequestId: request.id,
          });
        }
      }

      // Save document records
      if (documents.length > 0) {
        await tx.document.createMany({
          data: documents,
        });
      }

      return request;
    });

    return NextResponse.json({
      ...creditRequest,
      amount: parseFloat(creditRequest.amount.toString()),
      duration: creditRequest.duration,
    });
  } catch (error) {
    console.error("Error creating credit request:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}