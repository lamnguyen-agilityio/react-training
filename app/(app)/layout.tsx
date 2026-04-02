import { CartStoreProvider } from "@/lib/store/cart-store-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/app/Header";
import { CartSheet } from "@/components/app/CartSheet";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <CartStoreProvider>
        <Header />
        <main>{children}</main>
        <CartSheet />
        <Toaster position="bottom-center" />
      </CartStoreProvider>
    </ClerkProvider>
  );
}

export default AppLayout;
