/**
 * components/providers/AuthProviderGate.server.tsx
 * ──────────────────────────────────────────────────
 * Server Component alternative — fetches the provider during SSR
 * so there is zero loading flash on first paint.
 *
 * Usage in app/layout.tsx (Server Component):
 *
 *   import { AuthProviderGateServer } from "@/components/providers/AuthProviderGate.server";
 *
 *   export default async function RootLayout({ children }) {
 *     return (
 *       <html>
 *         <body>
 *           <AuthProviderGateServer>{children}</AuthProviderGateServer>
 *         </body>
 *       </html>
 *     );
 *   }
 *
 * The server component passes the resolved `active` value down to the
 * client component which seeds the Zustand store — no extra API call
 * from the browser.
 */

import { getAuthProvider } from "@/lib/api/auth";
import { AuthProviderGateClient } from "./AuthProviderGateClient";

interface Props {
  children: React.ReactNode;
}

export async function AuthProviderGateServer({ children }: Props) {
  // Fetched on the server — uses Next.js ISR cache (revalidate: 300)
  let active: "clerk" | "auth0" = "clerk"; // safe default

  try {
    const data = await getAuthProvider();
    active = data.active;
  } catch (err) {
    console.error("[AuthProviderGateServer] Failed to fetch provider:", err);
    // Fall through with default — auth will still work, just uses the default
  }

  return (
    <AuthProviderGateClient initialActive={active}>
      {children}
    </AuthProviderGateClient>
  );
}
