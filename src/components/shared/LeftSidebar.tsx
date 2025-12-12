import { sidebarLinks } from "@/constants";
import Image from "next/image";
import Link from "next/link";
import { CreatePostDialog } from "@/components/shared/CreatePostDialog";
import { SidebarAccount } from "@/components/shared/SidebarAccount";
import { createClient } from "@/utils/supabase/server";
import { PostButtonTrigger } from "./PostButtonTrigger";
import { Home, Search, Bell, BrainCircuit, Bookmark, User } from "lucide-react";

export async function LeftSidebar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let userProfile = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    // Priorizar avatar de Google si el de la BD es null
    const avatarUrl = profile?.avatar_url || 
                      user.user_metadata?.avatar_url || 
                      user.user_metadata?.picture || 
                      null;
      
    userProfile = {
      ...user,
      user_metadata: {
        ...user.user_metadata,
        username: profile?.username,
        full_name: profile?.full_name,
        avatar_url: avatarUrl
      }
    };
  }

  return (
    <section className="sticky left-0 top-0 flex h-screen flex-col justify-between border-r border-[#2f3336] bg-black px-4 pb-6 pt-2 max-sm:hidden lg:w-[275px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex flex-col gap-2">
        {/* LOGO */}
        <Link href="/" className="flex items-center justify-center lg:justify-start p-3 rounded-full hover:bg-[#181818] w-fit transition-colors mb-2">
          <Image src="/assets/logo.svg" alt="logo" width={30} height={30} />
        </Link>

        {/* LINKS */}
        {sidebarLinks.map((link) => {
          // Mapeo de labels a iconos de Lucide React
          const getIcon = () => {
            switch (link.label) {
              case "Inicio":
                return <Home className="w-7 h-7 text-white" strokeWidth={2.5} />;
              case "Explorar":
                return <Search className="w-7 h-7 text-white" strokeWidth={2.5} />;
              case "Notificaciones":
                return <Bell className="w-7 h-7 text-white" strokeWidth={2.5} />;
              case "Quizes":
                return <BrainCircuit className="w-7 h-7 text-white" strokeWidth={2.5} />;
              case "Guardados":
                return <Bookmark className="w-7 h-7 text-white" strokeWidth={2.5} />;
              case "Perfil":
                return <User className="w-7 h-7 text-white" strokeWidth={2.5} />;
              default:
                return <Home className="w-7 h-7 text-white" strokeWidth={2.5} />;
            }
          };

          return (
            <Link
              href={link.route}
              key={link.label}
              className="flex items-center gap-4 p-3 rounded-full hover:bg-[#181818] transition-colors w-fit lg:w-full"
            >
              {getIcon()}
              <p className="text-[20px] font-bold tracking-normal text-[#e7e9ea] max-lg:hidden">
                {link.label}
              </p>
            </Link>
          );
        })}

        {/* BOTÓN POSTEAR */}
        <div className="mt-4 w-full flex justify-center lg:justify-start">
          <CreatePostDialog>
             <div className="bg-white text-black font-bold text-[17px] rounded-full h-[52px] w-[52px] lg:w-[90%] shadow-none hover:bg-[#eff3f4] transition-colors flex items-center justify-center cursor-pointer">
                <span className="max-lg:hidden">Postear</span>
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 lg:hidden fill-current"><g><path d="M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.94-7.054C22.79 10.147 23.17 6.359 23 3zm-7 8h-1.5v2H16c.63-.016 1.2-.08 1.72-.188C16.95 15.24 14.68 17 12 17H8.55c.57-2.512 1.57-4.851 3-6.78 2.16-2.912 5.29-4.911 9.45-5.187C20.95 8.079 19.9 11 16 11zM4 9V6H1V4h3V1h2v3h3v2H6v3H4z"></path></g></svg>
             </div>
          </CreatePostDialog>
        </div>
      </div>

      {/* PERFIL (Pegado al fondo gracias a justify-between) */}
      <div className="mt-auto">
        <SidebarAccount user={userProfile} />
      </div>
    </section>
  );
}