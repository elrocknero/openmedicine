"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Repeat2, Share } from "lucide-react";
import { toggleLike, repost } from "@/lib/actions/post.actions";
import { cn } from "@/lib/utils";

interface PostActionsProps {
  postId: string;
  initialLikes: number;
  isLikedByCurrentUser: boolean;
  commentsCount?: number;
  initialReposts?: number;
  isRepostedByCurrentUser?: boolean;
}

export const PostActions = ({
  postId,
  initialLikes,
  isLikedByCurrentUser,
  commentsCount = 0,
  initialReposts = 0,
  isRepostedByCurrentUser = false,
}: PostActionsProps) => {
  const router = useRouter();
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(isLikedByCurrentUser);
  const [reposts, setReposts] = useState(initialReposts);
  const [isReposted, setIsReposted] = useState(isRepostedByCurrentUser);
  const [isSharing, setIsSharing] = useState(false);

  const handleComment = () => {
    router.push(`/post/${postId}`);
  };

  const handleLike = async () => {
    // 1. Optimistic UI: Cambiar visualmente antes de esperar al servidor
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikes((prev) => (newIsLiked ? prev + 1 : prev - 1));

    // 2. Llamada al servidor (Server Action)
    try {
      await toggleLike(postId);
    } catch (error) {
      // Si falla, revertimos
      setIsLiked(!newIsLiked);
      setLikes((prev) => (!newIsLiked ? prev + 1 : prev - 1));
      console.error("Error al dar like:", error);
    }
  };

  const handleRepost = async () => {
    // 1. Optimistic UI: Cambiar visualmente antes de esperar al servidor
    const newIsReposted = !isReposted;
    setIsReposted(newIsReposted);
    setReposts((prev) => (newIsReposted ? prev + 1 : prev - 1));

    // 2. Llamada al servidor (Server Action)
    try {
      await repost(postId);
      router.refresh(); // Refrescar para obtener datos actualizados
    } catch (error) {
      // Si falla, revertimos
      setIsReposted(!newIsReposted);
      setReposts((prev) => (!newIsReposted ? prev + 1 : prev - 1));
      console.error("Error al repostear:", error);
    }
  };

  const handleShare = () => {
    // Copiar al portapapeles
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    setIsSharing(true);
    setTimeout(() => setIsSharing(false), 2000); // Feedback temporal
  };

  return (
    <div className="flex justify-between mt-3 text-neutral-500 max-w-[425px]">
      {/* Comentarios */}
      <button
        onClick={handleComment}
        className="flex items-center gap-1.5 group transition-colors hover:text-white"
      >
        <div className="p-2 rounded-full group-hover:bg-white/10 transition-colors">
          <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <span className="text-sm tabular-nums group-hover:text-white transition-colors">
          {commentsCount > 0 && commentsCount}
        </span>
      </button>

      {/* Repost */}
      <button
        onClick={handleRepost}
        className={cn(
          "flex items-center gap-1.5 group transition-colors hover:text-white",
          isReposted && "text-green-500"
        )}
      >
        <div className={cn(
          "p-2 rounded-full transition-colors",
          isReposted ? "bg-green-500/10" : "group-hover:bg-white/10"
        )}>
          <Repeat2 className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <span className={cn(
          "text-sm tabular-nums transition-colors",
          isReposted ? "text-green-500" : "group-hover:text-white"
        )}>
          {reposts > 0 && reposts}
        </span>
      </button>

      {/* Like (Rosa cuando está activo, gris/blanco cuando no) */}
      <button
        onClick={handleLike}
        className={cn(
          "flex items-center gap-1.5 group transition-colors",
          isLiked ? "text-[#f91880]" : "hover:text-white"
        )}
      >
        <div className={cn(
          "p-2 rounded-full transition-colors relative",
          isLiked ? "bg-[#f91880]/10" : "group-hover:bg-white/10"
        )}>
          <Heart
            className={cn(
              "w-5 h-5 transition-all",
              isLiked && "fill-current scale-110"
            )}
            strokeWidth={1.5}
          />
        </div>
        <span
          className={cn(
            "text-sm tabular-nums transition-colors",
            isLiked ? "text-[#f91880]" : "group-hover:text-white"
          )}
        >
          {likes > 0 && likes}
        </span>
      </button>

      {/* Share */}
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 group transition-colors hover:text-white relative"
      >
        <div className="p-2 rounded-full group-hover:bg-white/10 transition-colors">
          <Share className="w-5 h-5" strokeWidth={1.5} />
        </div>
        {isSharing && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-xs px-2 py-1 rounded-md whitespace-nowrap">
            Copiado!
          </span>
        )}
      </button>
    </div>
  );
};

