import { ChatFloatingButton } from "@/components/ui/chat-floating-button";
import { Footer } from "@/components/ui/footer";
import { Navbar } from "@/components/ui/navbar";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatFloatingButton />
    </div>
  );
}
