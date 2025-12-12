"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, BrainCircuit, MapPin } from "lucide-react";
import { PostActions } from "./PostActions";
import { PollDisplay } from "./PollDisplay";
import Link from "next/link";

export interface PostData {
  id: string;
  content: string;
  created_at: string;
  type: "text" | "image" | "quiz" | "poll";
  media_urls?: string[] | null;
  location?: string | null;
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface PostCardProps {
  post: PostData;
  stats?: {
    likes: number;
    comments: number;
    reposts: number;
  };
  isLikedByCurrentUser?: boolean;
  isRepostedByCurrentUser?: boolean;
  isDetail?: boolean; // Para mostrar versión detallada (texto más grande, fecha completa)
  pollData?: {
    id: string;
    options: string[];
    votes: number[];
  };
}

export function PostCard({
  post,
  stats = { likes: 0, comments: 0, reposts: 0 },
  isLikedByCurrentUser = false,
  isRepostedByCurrentUser = false,
  isDetail = false,
  pollData,
}: PostCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/post/${post.id}`);
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "ahora";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `hace ${diffInMinutes}m`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `hace ${diffInHours}h`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `hace ${diffInDays}d`;
    }

    // Si es más de una semana, mostrar fecha corta
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  // Manejo de errores: si profiles es null, usar valores por defecto
  const profile = post.profiles || {
    full_name: "Usuario",
    username: "usuario",
    avatar_url: null,
  };

  const fullName = profile.full_name || "Usuario";
  const username = profile.username || "usuario";
  const avatarUrl = profile.avatar_url;

  return (
    <article
      onClick={isDetail ? undefined : handleCardClick}
      className={`border-b border-[#2f3336] p-4 transition-colors ${isDetail ? "" : "hover:bg-neutral-900/30 cursor-pointer"}`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Link
            href={`/profile/${username}`}
            onClick={(e) => e.stopPropagation()}
            className="block"
          >
            <Avatar className="w-11 h-11">
              <AvatarImage src={avatarUrl || undefined} alt={fullName} />
              <AvatarFallback className="bg-neutral-800">
                {fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>

        {/* Content */}
        <div className="flex flex-col w-full">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/profile/${username}`}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold hover:underline decoration-1 text-white"
              >
                {fullName}
              </Link>
              <Link
                href={`/profile/${username}`}
                onClick={(e) => e.stopPropagation()}
                className="text-x-gray hover:underline"
              >
                @{username}
              </Link>
              {!isDetail && (
                <>
                  <span className="text-x-gray">·</span>
                  <span className="text-x-gray">{formatTimeAgo(post.created_at)}</span>
                </>
              )}
            </div>
            <button
              onClick={(e) => e.stopPropagation()}
              className="text-x-gray hover:bg-x-blue/10 hover:text-x-blue rounded-full p-1.5 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Text Body - Contenido Principal */}
          <div className={`mt-1 leading-normal whitespace-pre-wrap font-normal text-white ${isDetail ? "text-[23px] leading-8" : "text-[17px]"}`}>
            {post.content}
          </div>

          {/* Ubicación - Footer del texto (pequeña y discreta) */}
          {!isDetail && post.location && (
            <div className="mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-neutral-500" />
              <span className="text-xs text-neutral-500">{post.location}</span>
            </div>
          )}

          {/* Metadatos debajo del texto (solo en isDetail) */}
          {isDetail && (
            <div className="mt-4 mb-2">
              <div className="text-[#71767b] text-[15px]">
                {new Date(post.created_at).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }).replace(/AM/i, "a. m.").replace(/PM/i, "p. m.")}{" "}
                ·{" "}
                {new Date(post.created_at).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              {/* Separador debajo de fecha */}
              <div className="border-b border-[#2f3336] mt-2 mb-0" />
            </div>
          )}

          {/* Media Area - Imagen con límite de altura corregido */}
          {post.type === "image" && post.media_urls && post.media_urls.length > 0 && (
            <div className={`rounded-2xl border border-[#2f3336] overflow-hidden bg-neutral-900/50 flex items-center justify-center ${isDetail ? "mt-2" : "mt-3"}`} style={{ maxHeight: isDetail ? "600px" : "400px" }}>
              <img
                src={post.media_urls[0]}
                alt="Post image"
                className="w-full h-auto object-contain rounded-2xl mx-auto"
                style={{ maxHeight: isDetail ? "600px" : "400px" }}
              />
            </div>
          )}

          {/* Ubicación en detalle */}
          {isDetail && post.location && (
            <div className="mt-2 text-neutral-500 text-xs flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{post.location}</span>
            </div>
          )}

          {/* Encuesta (Poll) */}
          {post.type === "poll" && pollData && (
            <div className="mt-3">
              <PollDisplay pollData={pollData} postId={post.id} />
            </div>
          )}

          {/* Quiz - Tarjeta de Invitación */}
          {post.type === "quiz" && (
            <Link
              href={`/quiz/${post.id}`}
              onClick={(e) => e.stopPropagation()}
              className="block mt-3"
            >
              <div className="rounded-2xl border border-[#2f3336] p-8 bg-[#16181c] hover:bg-[#1a1c20] transition-colors cursor-pointer">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  {/* Icono Grande */}
                  <div className="p-4 rounded-full bg-white/5">
                    <BrainCircuit className="w-12 h-12 text-white" />
                  </div>

                  {/* Texto */}
                  <div className="space-y-2">
                    <p className="text-x-gray text-sm">Quiz Generado por IA</p>
                    <p className="text-white text-lg font-semibold">
                      Comenzar Quiz
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Action Bar */}
          <div onClick={(e) => e.stopPropagation()}>
          <PostActions
            postId={post.id}
            initialLikes={stats.likes}
            isLikedByCurrentUser={isLikedByCurrentUser}
            commentsCount={stats.comments}
            initialReposts={stats.reposts}
            isRepostedByCurrentUser={isRepostedByCurrentUser}
          />
          </div>
        </div>
      </div>
    </article>
  );
}
