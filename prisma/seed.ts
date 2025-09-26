import { PrismaClient, Role, AccountType, TransactionType, CreditStatus } from '@prisma/client'
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️ Resetting database...')

  // ⚠️ Vider toutes les tables (ordre important à cause des relations)
  await prisma.auditLog.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.document.deleteMany()
  await prisma.repayment.deleteMany()
  await prisma.credit.deleteMany()
  await prisma.creditRequest.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  console.log('🌱 Seeding database...')

  // 1. Users (1 par rôle + compléter pour avoir 5)
const password = await bcrypt.hash("password", 10)

const users = await Promise.all([
  prisma.user.create({ data: { email: 'client1@kabarecooperative.cd', password, role: Role.CLIENT, name: 'Client One', phone: '1111111111' } }),
  prisma.user.create({ data: { email: 'agent1@kabarecooperative.cd', password, role: Role.CREDIT_AGENT, name: 'Agent One', phone: '2222222222' } }),
  prisma.user.create({ data: { email: 'commission1@kabarecooperative.cd', password, role: Role.CREDIT_COMMISSION, name: 'Commission One', phone: '3333333333' } }),
  prisma.user.create({ data: { email: 'cashier1@kabarecooperative.cd', password, role: Role.CASHIER, name: 'Cashier One', phone: '4444444444' } }),
  prisma.user.create({ data: { email: 'admin1@kabarecooperative.cd', password, role: Role.ADMIN, name: 'Admin One', phone: '5555555555' } }),
])

  // 2. Accounts (5 comptes liés aux users[0..4])
  const accounts = await Promise.all([
    prisma.account.create({ data: { accountNumber: 'ACC1001', type: AccountType.SAVINGS, balance: 1000, userId: users[0].id } }),
    prisma.account.create({ data: { accountNumber: 'ACC1002', type: AccountType.SAVINGS, balance: 2000, userId: users[1].id } }),
    prisma.account.create({ data: { accountNumber: 'ACC1003', type: AccountType.CREDIT, balance: 3000, userId: users[2].id } }),
    prisma.account.create({ data: { accountNumber: 'ACC1004', type: AccountType.SAVINGS, balance: 4000, userId: users[3].id } }),
    prisma.account.create({ data: { accountNumber: 'ACC1005', type: AccountType.CREDIT, balance: 5000, userId: users[4].id } }),
  ])

  // 3. Credit Requests
  const creditRequests = await Promise.all([
    prisma.creditRequest.create({ data: { amount: 1000, purpose: 'Business expansion', userId: users[0].id, accountId: accounts[0].id, status: CreditStatus.PENDING } }),
    prisma.creditRequest.create({ data: { amount: 2000, purpose: 'Buy equipment', userId: users[1].id, accountId: accounts[1].id, status: CreditStatus.UNDER_ANALYSIS } }),
    prisma.creditRequest.create({ data: { amount: 1500, purpose: 'Education loan', userId: users[2].id, accountId: accounts[2].id, status: CreditStatus.APPROVED } }),
    prisma.creditRequest.create({ data: { amount: 2500, purpose: 'House renovation', userId: users[3].id, accountId: accounts[3].id, status: CreditStatus.REJECTED } }),
    prisma.creditRequest.create({ data: { amount: 3000, purpose: 'Car purchase', userId: users[4].id, accountId: accounts[4].id, status: CreditStatus.ACTIVE } }),
  ])

  // 4. Credits (1 par creditRequest)
  const credits = await Promise.all([
    prisma.credit.create({ data: { creditRequestId: creditRequests[2].id, principalAmount: 1500, remainingAmount: 1200, interestRate: 0.05, duration: 12, monthlyPayment: 125, nextPaymentDate: new Date(), } }),
    prisma.credit.create({ data: { creditRequestId: creditRequests[4].id, principalAmount: 3000, remainingAmount: 2800, interestRate: 0.06, duration: 24, monthlyPayment: 150, nextPaymentDate: new Date(), } }),
    prisma.credit.create({ data: { creditRequestId: creditRequests[1].id, principalAmount: 2000, remainingAmount: 2000, interestRate: 0.04, duration: 10, monthlyPayment: 200, nextPaymentDate: new Date(), } }),
    prisma.credit.create({ data: { creditRequestId: creditRequests[0].id, principalAmount: 1000, remainingAmount: 900, interestRate: 0.05, duration: 6, monthlyPayment: 170, nextPaymentDate: new Date(), } }),
    prisma.credit.create({ data: { creditRequestId: creditRequests[3].id, principalAmount: 2500, remainingAmount: 0, interestRate: 0.07, duration: 12, monthlyPayment: 220, nextPaymentDate: new Date(), isCompleted: true } }),
  ])

  // 5. Repayments
  await Promise.all([
    prisma.repayment.create({ data: { creditId: credits[0].id, amount: 125, principalPaid: 100, interestPaid: 25, dueDate: new Date(), isLate: false } }),
    prisma.repayment.create({ data: { creditId: credits[1].id, amount: 150, principalPaid: 120, interestPaid: 30, dueDate: new Date(), isLate: true } }),
    prisma.repayment.create({ data: { creditId: credits[2].id, amount: 200, principalPaid: 160, interestPaid: 40, dueDate: new Date(), isLate: false } }),
    prisma.repayment.create({ data: { creditId: credits[3].id, amount: 170, principalPaid: 140, interestPaid: 30, dueDate: new Date(), isLate: false } }),
    prisma.repayment.create({ data: { creditId: credits[4].id, amount: 220, principalPaid: 200, interestPaid: 20, dueDate: new Date(), isLate: false } }),
  ])

  // 6. Documents
  await Promise.all([
    prisma.document.create({ data: { filename: 'id_card.pdf', filepath: '/docs/id1.pdf', documentType: 'ID', creditRequestId: creditRequests[0].id } }),
    prisma.document.create({ data: { filename: 'salary_slip.pdf', filepath: '/docs/salary1.pdf', documentType: 'SALARY', creditRequestId: creditRequests[1].id } }),
    prisma.document.create({ data: { filename: 'guarantee.pdf', filepath: '/docs/guarantee1.pdf', documentType: 'GUARANTEE', creditRequestId: creditRequests[2].id } }),
    prisma.document.create({ data: { filename: 'house_docs.pdf', filepath: '/docs/house1.pdf', documentType: 'HOUSE', creditRequestId: creditRequests[3].id } }),
    prisma.document.create({ data: { filename: 'car_invoice.pdf', filepath: '/docs/car1.pdf', documentType: 'CAR', creditRequestId: creditRequests[4].id } }),
  ])

  // 7. Transactions
  await Promise.all([
    prisma.transaction.create({ data: { type: TransactionType.DEPOSIT, amount: 500, userId: users[0].id, accountId: accounts[0].id, description: 'Initial deposit' } }),
    prisma.transaction.create({ data: { type: TransactionType.WITHDRAWAL, amount: 200, userId: users[1].id, accountId: accounts[1].id, description: 'ATM withdrawal' } }),
    prisma.transaction.create({ data: { type: TransactionType.REPAYMENT, amount: 150, userId: users[2].id, accountId: accounts[2].id, description: 'Loan repayment' } }),
    prisma.transaction.create({ data: { type: TransactionType.TRANSFER_OUT, amount: 300, userId: users[3].id, accountId: accounts[3].id, toAccountId: accounts[4].id, description: 'Money transfer' } }),
    prisma.transaction.create({ data: { type: TransactionType.TRANSFER_IN, amount: 300, userId: users[4].id, accountId: accounts[4].id, fromAccountId: accounts[3].id, description: 'Received transfer' } }),
  ])

  // 8. Audit Logs
  await Promise.all([
    prisma.auditLog.create({ data: { userId: users[0].id, action: 'LOGIN', entityType: 'User', entityId: users[0].id } }),
    prisma.auditLog.create({ data: { userId: users[1].id, action: 'CREATE_ACCOUNT', entityType: 'Account', entityId: accounts[1].id } }),
    prisma.auditLog.create({ data: { userId: users[2].id, action: 'REQUEST_CREDIT', entityType: 'CreditRequest', entityId: creditRequests[2].id } }),
    prisma.auditLog.create({ data: { userId: users[3].id, action: 'TRANSFER_MONEY', entityType: 'Transaction', entityId: accounts[3].id } }),
    prisma.auditLog.create({ data: { userId: users[4].id, action: 'APPROVE_CREDIT', entityType: 'Credit', entityId: credits[4].id } }),
  ])

  console.log('✅ Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
