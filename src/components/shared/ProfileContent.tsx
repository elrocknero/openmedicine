"use client";

import { PostCard, type PostData } from "@/components/shared/PostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Link as LinkIcon, Calendar } from "lucide-react";
import { EditProfileModal } from "@/components/shared/EditProfileModal";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  created_at: string;
}

interface PostWithStats extends PostData {
  stats?: {
    likes: number;
    comments: number;
    reposts: number;
    isLiked: boolean;
    isReposted: boolean;
  };
}

interface ProfileContentProps {
  profile: Profile;
  isOwner: boolean;
  textPosts: PostWithStats[];
  quizPosts: PostWithStats[];
  followersCount: number;
  followingCount: number;
  joinedDate: string;
}

export function ProfileContent({
  profile,
  isOwner,
  textPosts,
  quizPosts,
  followersCount,
  followingCount,
  joinedDate,
}: ProfileContentProps) {
  return (
    <main className="min-h-screen bg-black">
      {/* Banner */}
      <div
        className="h-[200px] bg-[#333639] relative"
        style={
          profile.banner_url
            ? {
                backgroundImage: `url(${profile.banner_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {}
        }
      />

      {/* Contenido Principal */}
      <div className="max-w-2xl mx-auto px-4">
        {/* Avatar y Botón de Acción */}
        <div className="relative -mt-16 mb-4 flex items-end justify-between">
          {/* Avatar */}
          <div className="relative">
            <div className="w-[134px] h-[134px] rounded-full border-4 border-black overflow-hidden bg-black">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#333639] flex items-center justify-center text-white text-3xl font-bold">
                  {(profile.full_name || profile.username)
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
              )}
            </div>
          </div>

          {/* Botón de Acción */}
          <div className="pb-4">
            {isOwner ? (
              <EditProfileModal profile={profile} />
            ) : (
              <button className="px-4 py-2 bg-white text-black rounded-full font-bold text-sm hover:bg-[#eff3f4] transition-colors">
                Seguir
              </button>
            )}
          </div>
        </div>

        {/* Información del Usuario */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white mb-1">
            {profile.full_name || profile.username}
          </h1>
          <p className="text-[#71767b] text-sm mb-4">@{profile.username}</p>

          {profile.bio && (
            <p className="text-white mb-4 whitespace-pre-wrap">{profile.bio}</p>
          )}

          {/* Metadatos */}
          <div className="flex flex-wrap gap-4 text-[#71767b] text-sm mb-4">
            {profile.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#1d9bf0] hover:underline"
              >
                <LinkIcon className="w-4 h-4" />
                <span>{profile.website.replace(/^https?:\/\//, "")}</span>
              </a>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Se unió en {joinedDate}</span>
            </div>
          </div>

          {/* Contadores */}
          <div className="flex gap-4 text-sm">
            <button className="hover:underline cursor-pointer">
              <span className="text-white font-semibold">{followingCount}</span>
              <span className="text-[#71767b] ml-1">Siguiendo</span>
            </button>
            <button className="hover:underline cursor-pointer">
              <span className="text-white font-semibold">{followersCount}</span>
              <span className="text-[#71767b] ml-1">Seguidores</span>
            </button>
          </div>
        </div>

        {/* Pestañas de Contenido */}
        <Tabs defaultValue="posts" className="w-full">
          <div className="sticky top-0 z-20 bg-black/60 backdrop-blur-md">
            <TabsList className="flex w-full h-[53px] border-b border-[#2f3336] rounded-none bg-transparent p-0">
              <TabsTrigger
                value="posts"
                className="flex-1 h-full relative flex items-center justify-center text-[15px] font-medium text-[#71767b] transition-colors hover:bg-white/10 cursor-pointer rounded-none border-none outline-none data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:w-[56px] data-[state=active]:after:h-[4px] data-[state=active]:after:bg-[#1d9bf0] data-[state=active]:after:rounded-full"
              >
                Posts ({textPosts.length})
              </TabsTrigger>
              <TabsTrigger
                value="quizzes"
                className="flex-1 h-full relative flex items-center justify-center text-[15px] font-medium text-[#71767b] transition-colors hover:bg-white/10 cursor-pointer rounded-none border-none outline-none data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:w-[56px] data-[state=active]:after:h-[4px] data-[state=active]:after:bg-[#1d9bf0] data-[state=active]:after:rounded-full"
              >
                Quizzes ({quizPosts.length})
              </TabsTrigger>
              <TabsTrigger
                value="likes"
                className="flex-1 h-full relative flex items-center justify-center text-[15px] font-medium text-[#71767b] transition-colors hover:bg-white/10 cursor-pointer rounded-none border-none outline-none data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:w-[56px] data-[state=active]:after:h-[4px] data-[state=active]:after:bg-[#1d9bf0] data-[state=active]:after:rounded-full"
              >
                Me gusta
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab: Posts */}
          <TabsContent value="posts" className="mt-0 pt-6">
            {textPosts.length === 0 ? (
              <div className="text-center py-16 border border-[#2f3336] rounded-2xl bg-[#16181c]">
                <p className="text-x-gray">
                  {isOwner
                    ? "No has publicado nada aún."
                    : "Este usuario aún no ha publicado nada."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#2f3336]">
                {textPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    stats={post.stats || { likes: 0, comments: 0, reposts: 0 }}
                    isLikedByCurrentUser={post.stats?.isLiked || false}
                    isRepostedByCurrentUser={post.stats?.isReposted || false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Quizzes */}
          <TabsContent value="quizzes" className="mt-0 pt-6">
            {quizPosts.length === 0 ? (
              <div className="text-center py-16 border border-[#2f3336] rounded-2xl bg-[#16181c]">
                <p className="text-x-gray">
                  {isOwner
                    ? "No has creado ningún quiz aún."
                    : "Este usuario aún no ha creado ningún quiz."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#2f3336]">
                {quizPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    stats={post.stats || { likes: 0, comments: 0, reposts: 0 }}
                    isLikedByCurrentUser={post.stats?.isLiked || false}
                    isRepostedByCurrentUser={post.stats?.isReposted || false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Me gusta (Placeholder) */}
          <TabsContent value="likes" className="mt-0 pt-6">
            <div className="text-center py-16 border border-[#2f3336] rounded-2xl bg-[#16181c]">
              <p className="text-x-gray">Próximamente</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

