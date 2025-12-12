'use client'; // 👈 ESTO ES OBLIGATORIO PARA USAR ONCLICK

import Image from "next/image";
import { Ellipsis } from "lucide-react";

interface SidebarAccountProps {
  user: {
    id: string;
    email?: string;
    user_metadata: {
      avatar_url?: string;
      full_name?: string;
      username?: string;
      name?: string;
      picture?: string; // Avatar de Google OAuth
    };
  } | null;
}

export const SidebarAccount = ({ user }: SidebarAccountProps) => {
  if (!user) return null;

  // Datos seguros para mostrar (Fallback si no hay avatar o nombre)
  // Priorizar avatar de Google si el de la BD es null
  const avatarUrl = user.user_metadata?.avatar_url || 
                    user.user_metadata?.picture || 
                    "/assets/user.svg";
  const displayName = user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      "Usuario";
  const username = user.user_metadata?.username || "usuario";

  return (
    <div 
      className="flex items-center justify-between gap-2 p-3 rounded-full hover:bg-[#181818] cursor-pointer transition-colors w-full mt-auto mb-2"
      onClick={() => {
        // AQUÍ SÍ PODEMOS USAR EVENTOS
        console.log("Abrir menú de cerrar sesión...");
        // Futuro: Aquí abrirás un Popover para Logout
      }}
    >
      <div className="flex items-center gap-3 truncate">
        <Image
          src={avatarUrl}
          alt="User"
          width={40}
          height={40}
          className="rounded-full object-cover"
        />
        <div className="hidden lg:flex flex-col truncate">
          <span className="font-bold text-[15px] leading-5 text-[#e7e9ea] truncate">
            {displayName}
          </span>
          <span className="text-[15px] text-[#71767b] truncate">
            @{username}
          </span>
        </div>
      </div>
      
      <div className="hidden lg:block text-[#e7e9ea]">
        <Ellipsis strokeWidth={2} />
      </div>
    </div>
  );
};