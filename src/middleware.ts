import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/v2/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
