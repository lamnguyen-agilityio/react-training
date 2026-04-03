import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const PROVIDER_COOKIE = "x-auth-provider";

const isProtectedRoute = createRouteMatcher([
  "/checkout",
  "/checkout/success",
  "/orders",
  "/orders/(.*)",
]);

function getProvider(req: NextRequest): "clerk" | "auth0" {
  const cookie = req.cookies.get(PROVIDER_COOKIE)?.value;
  return cookie === "auth0" ? "auth0" : "clerk";
}

function isAuth0LoggedIn(req: NextRequest): boolean {
  return req.cookies.has("x-auth0-session");
}

export default clerkMiddleware(async (auth, req) => {
  const provider = getProvider(req);

  if (provider === "auth0") {
    if (isProtectedRoute(req) && !isAuth0LoggedIn(req)) {
      const url = req.nextUrl.clone();
      url.href = process.env.NEXT_PUBLIC_AUTH0_GOOGLE_LOGIN_URL!;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Clerk
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
