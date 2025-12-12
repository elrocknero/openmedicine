import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserResultCardProps {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio?: string | null;
}

export function UserResultCard({
  id,
  full_name,
  username,
  avatar_url,
  bio,
}: UserResultCardProps) {
  return (
    <div className="border border-[#2f3336] rounded-2xl p-4 bg-black hover:bg-[#16181c] transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Avatar className="w-12 h-12 flex-shrink-0">
            <AvatarImage 
              src={avatar_url || "/assets/user.svg"} 
              alt={full_name} 
            />
            <AvatarFallback className="bg-neutral-800">
              {full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white hover:underline truncate">
                {full_name}
              </h3>
            </div>
            <p className="text-x-gray text-sm mb-2 truncate">{username}</p>
            {bio && (
              <p className="text-white text-sm line-clamp-2">{bio}</p>
            )}
          </div>
        </div>

        <button className="bg-white text-black rounded-full px-4 py-2 text-sm font-bold hover:bg-[#eff3f4] transition-colors flex-shrink-0">
          Seguir
        </button>
      </div>
    </div>
  );
}

