import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Add middleware logic if needed
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/agent/:path*", "/cashier/:path*", "/commission/:path*"],
};