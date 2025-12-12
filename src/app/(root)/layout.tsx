import { LeftSidebar } from "@/components/shared/LeftSidebar";
import { RightSidebar } from "@/components/shared/RightSidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center min-h-screen bg-black max-w-[1300px] mx-auto">
      {/* Columna Izquierda (Nav) */}
      <aside className="hidden md:block w-[275px] sticky top-0 h-screen">
        <LeftSidebar />
      </aside>

      {/* Columna Central (Feed) */}
      <main className="w-[600px] border-x border-[#2f3336] min-h-screen">
        {children}
      </main>

      {/* Columna Derecha (Widgets) */}
      <aside className="hidden lg:block w-[350px] ml-8">
        <RightSidebar />
      </aside>
    </div>
  );
}
