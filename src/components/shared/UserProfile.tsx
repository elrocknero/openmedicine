"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface UserProfileProps {
  user: {
    user_metadata?: {
      avatar_url?: string;
      full_name?: string;
    };
    email?: string;
  };
}

export function UserProfile({ user }: UserProfileProps) {
  const router = useRouter();
  const avatarUrl = user.user_metadata?.avatar_url;
  const fullName = user.user_metadata?.full_name || "Usuario";
  const email = user.email || "";
  const handle = email.split("@")[0] || "usuario";

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-full hover:bg-[#181818] cursor-pointer transition-colors w-full mt-auto">
      <Avatar className="w-10 h-10">
        <AvatarImage src={avatarUrl} alt={fullName} />
        <AvatarFallback className="bg-neutral-800 text-xs font-bold">
          {fullName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-bold text-white truncate">{fullName}</span>
        <span className="text-[#71767b] truncate">@{handle}</span>
      </div>
      <button
        onClick={handleLogout}
        className="text-[#71767b] hover:text-white transition-colors flex-shrink-0"
        aria-label="Cerrar sesión"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>
    </div>
  );
}

