import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, UserPlus, MessageCircle } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale/es";

export type NotificationType = "like" | "follow" | "reply";

export interface NotificationData {
  id: string;
  type: NotificationType;
  user: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  post?: {
    id: string;
    content: string;
  } | null;
  created_at: string;
  read: boolean;
}

interface NotificationItemProps {
  notification: NotificationData;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { type, user, post, created_at, read } = notification;

  // Formatear fecha relativa
  const timeAgo = formatDistanceToNow(new Date(created_at), {
    addSuffix: true,
    locale: es,
  });

  // Renderizar icono según el tipo
  const renderIcon = () => {
    switch (type) {
      case "like":
        return (
          <div className="p-2 rounded-full bg-[#f91880]/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-[#f91880] fill-[#f91880]" />
          </div>
        );
      case "follow":
        return (
          <div className="p-2 rounded-full bg-white/10 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
        );
      case "reply":
        return (
          <div className="p-2 rounded-full bg-white/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
        );
      default:
        return null;
    }
  };

  // Renderizar texto según el tipo
  const renderText = () => {
    switch (type) {
      case "like":
        return (
          <div className="flex-1">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[#71767b]">A</span>
              <Link
                href={`/profile/${user.username}`}
                className="font-semibold hover:underline text-white"
              >
                {user.full_name}
              </Link>
              <span className="text-[#71767b]">le gustó tu post</span>
            </div>
            {post && (
              <p className="text-[#71767b] text-sm mt-1 line-clamp-2">
                {post.content}
              </p>
            )}
            <span className="text-[#71767b] text-xs mt-1 block">{timeAgo}</span>
          </div>
        );
      case "follow":
        return (
          <div className="flex-1">
            <div className="flex items-center gap-1 flex-wrap">
              <Link
                href={`/profile/${user.username}`}
                className="font-semibold hover:underline text-white"
              >
                {user.full_name}
              </Link>
              <span className="text-[#71767b]">te siguió</span>
            </div>
            <span className="text-[#71767b] text-xs mt-1 block">{timeAgo}</span>
          </div>
        );
      case "reply":
        return (
          <div className="flex-1">
            <div className="flex items-center gap-1 flex-wrap">
              <Link
                href={`/profile/${user.username}`}
                className="font-semibold hover:underline text-white"
              >
                {user.full_name}
              </Link>
              <span className="text-[#71767b]">respondió:</span>
            </div>
            {post && (
              <p className="text-[#71767b] text-sm mt-1 line-clamp-2">
                {post.content.length > 100 
                  ? `${post.content.substring(0, 100)}...` 
                  : post.content}
              </p>
            )}
            <span className="text-[#71767b] text-xs mt-1 block">{timeAgo}</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Link
      href={post ? `/post/${post.id}` : `/profile/${user.username}`}
      className={`relative flex gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${
        !read ? "bg-white/[0.08]" : ""
      }`}
    >
      {/* Indicador de no leída - punto azul sutil */}
      {!read && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white" />
      )}
      
      {/* Icono del tipo de notificación */}
      <div className="flex-shrink-0">{renderIcon()}</div>

      {/* Avatar del usuario */}
      <div className="flex-shrink-0">
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
          <AvatarFallback className="bg-neutral-800">
            {user.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Contenido */}
      {renderText()}
    </Link>
  );
}

