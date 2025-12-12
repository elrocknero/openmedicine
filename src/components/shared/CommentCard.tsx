"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Repeat2, Heart, Share } from "lucide-react";
import { toggleCommentLike } from "@/lib/actions/comment.actions";
import { repost } from "@/lib/actions/post.actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  media_url?: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  likes?: Array<{ user_id: string }>;
}

interface CommentCardProps {
  comment: Comment;
  isLikedByCurrentUser?: boolean;
  likesCount?: number;
  postId: string;
  isRepostedByCurrentUser?: boolean;
  repostsCount?: number;
}

export function CommentCard({
  comment,
  isLikedByCurrentUser = false,
  likesCount = 0,
  postId,
  isRepostedByCurrentUser = false,
  repostsCount = 0,
}: CommentCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(isLikedByCurrentUser);
  const [likes, setLikes] = useState(likesCount);
  const [isReposted, setIsReposted] = useState(isRepostedByCurrentUser);
  const [reposts, setReposts] = useState(repostsCount);

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

    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  const handleLike = async () => {
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikes((prev) => (newIsLiked ? prev + 1 : prev - 1));

    try {
      await toggleCommentLike(comment.id, `/post/${postId}`);
      router.refresh();
    } catch (error) {
      setIsLiked(!newIsLiked);
      setLikes((prev) => (!newIsLiked ? prev + 1 : prev - 1));
      console.error("Error al dar like:", error);
    }
  };

  const handleRepost = async () => {
    const newIsReposted = !isReposted;
    setIsReposted(newIsReposted);
    setReposts((prev) => (newIsReposted ? prev + 1 : prev - 1));

    try {
      await repost(postId, `/post/${postId}`);
      router.refresh();
    } catch (error) {
      setIsReposted(!newIsReposted);
      setReposts((prev) => (!newIsReposted ? prev + 1 : prev - 1));
      console.error("Error al repostear:", error);
    }
  };

  const profile = comment.profiles || {
    full_name: "Usuario",
    username: "usuario",
    avatar_url: null,
  };

  const fullName = profile.full_name || "Usuario";
  const username = profile.username || "usuario";
  const avatarUrl = profile.avatar_url;

  return (
    <article className="px-4 py-3 hover:bg-neutral-900/30 transition-colors">
      <div className="flex gap-3">
        {/* Línea de Hilo (Vertical) */}
        <div className="flex flex-col items-center relative">
          <Avatar className="w-10 h-10 relative z-10">
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
          <div className="absolute top-[40px] left-1/2 -translate-x-1/2 w-[2px] h-full bg-[#333639] min-h-[40px]" />
        </div>

        {/* Content */}
        <div className="flex flex-col w-full">
          {/* Header */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="font-semibold hover:underline text-white text-[15px]">
              {fullName}
            </span>
            <span className="text-[#71767b] text-[15px]">@{username}</span>
            <span className="text-[#71767b]">·</span>
            <span className="text-[#71767b] hover:underline text-[15px]">
              {formatTimeAgo(comment.created_at)}
            </span>
          </div>

          {/* Text Body */}
          <div className="leading-normal whitespace-pre-wrap font-normal text-white text-[15px] mb-3">
            {comment.content}
          </div>

          {/* Media */}
          {comment.media_url && (
            <div className="mb-3 rounded-2xl overflow-hidden border border-[#2f3336]">
              <img
                src={comment.media_url}
                alt="Media"
                className="w-full max-h-[400px] object-cover"
              />
            </div>
          )}

          {/* Acciones (Footer) */}
          <div className="flex items-center justify-between max-w-[425px] text-[#71767b]">
            {/* Responder */}
            <button className="flex items-center gap-2 group transition-colors hover:text-[#1d9bf0]">
              <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
                <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </div>
            </button>

            {/* Repost */}
            <button
              onClick={handleRepost}
              className={cn(
                "flex items-center gap-2 group transition-colors hover:text-green-500",
                isReposted && "text-green-500"
              )}
            >
              <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                <Repeat2 className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </div>
              {reposts > 0 && (
                <span
                  className={cn(
                    "text-[15px] tabular-nums",
                    isReposted && "text-green-500"
                  )}
                >
                  {reposts}
                </span>
              )}
            </button>

            {/* Like */}
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-2 group transition-colors hover:text-[#f91880]",
                isLiked && "text-[#f91880]"
              )}
            >
              <div className="p-2 rounded-full group-hover:bg-[#f91880]/10 transition-colors">
                <Heart
                  className={cn(
                    "w-[18px] h-[18px] transition-all",
                    isLiked && "fill-current"
                  )}
                  strokeWidth={1.5}
                />
              </div>
              {likes > 0 && (
                <span
                  className={cn(
                    "text-[15px] tabular-nums",
                    isLiked && "text-[#f91880]"
                  )}
                >
                  {likes}
                </span>
              )}
            </button>

            {/* Share */}
            <button className="flex items-center gap-2 group transition-colors hover:text-[#1d9bf0]">
              <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
                <Share className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

