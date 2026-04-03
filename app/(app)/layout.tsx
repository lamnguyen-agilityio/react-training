import { CartStoreProvider } from "@/lib/store/cart-store-provider";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/app/Header";
import { CartSheet } from "@/components/app/CartSheet";
import { AuthProviderGateClient } from "@/components/providers/AuthProviderGateClient";
import { getAuthProvider } from "@/lib/api/auth";

async function AppLayout({ children }: { children: React.ReactNode }) {
  const { active } = await getAuthProvider();

  return (
    <AuthProviderGateClient initialActive={active}>
      <CartStoreProvider>
        <Header />
        <main>{children}</main>
        <CartSheet />
        <Toaster position="bottom-center" />
      </CartStoreProvider>
    </AuthProviderGateClient>
  );
}

export default AppLayout;
