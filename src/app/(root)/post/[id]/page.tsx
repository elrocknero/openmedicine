import { createClient } from "@/utils/supabase/server";
import { PostCard, type PostData } from "@/components/shared/PostCard";
import { CommentCard } from "@/components/shared/CommentCard";
import { CommentForm } from "@/components/shared/CommentForm";
import { notFound } from "next/navigation";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

interface SupabaseLike {
  user_id: string;
}

interface SupabaseRepost {
  user_id: string;
}

interface SupabaseCommentLike {
  user_id: string;
}

interface SupabaseComment {
  id: string;
  content: string;
  media_url: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  comment_likes: SupabaseCommentLike[] | null;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Obtener usuario actual con su perfil
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userAvatar: string | null = null;
  let userName: string | null = null;

  if (user) {
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("id", user.id)
      .single();

    userAvatar =
      userProfile?.avatar_url ||
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null;
    userName = userProfile?.full_name || user.user_metadata?.full_name || null;
  }

  // Obtener el post con sus relaciones
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select(
      `
      *,
      profiles!posts_user_id_fkey (
        full_name,
        username,
        avatar_url
      ),
      likes (user_id),
      reposts (user_id)
    `
    )
    .eq("id", id)
    .single();

  if (postError || !post) {
    notFound();
  }

  // Calcular stats del post
  const likesCount = post.likes?.length || 0;
  const repostsCount = post.reposts?.length || 0;
  const isLikedByCurrentUser =
    user && post.likes?.some((like: SupabaseLike) => like.user_id === user.id);
  const isRepostedByCurrentUser =
    user && post.reposts?.some((repost: SupabaseRepost) => repost.user_id === user.id);

  // Obtener comentarios del post con likes
  const { data: comments } = await supabase
    .from("comments")
    .select(
      `
      *,
      profiles!comments_user_id_fkey (
        full_name,
        username,
        avatar_url
      ),
      comment_likes (user_id)
    `
    )
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const commentsCount = comments?.length || 0;

  const stats = {
    likes: likesCount,
    comments: commentsCount,
    reposts: repostsCount,
  };

  // Transformar el post a PostData
  const postData: PostData = {
    id: post.id,
    content: post.content,
    created_at: post.created_at,
    type: post.type as "text" | "image" | "quiz" | "poll",
    profiles: post.profiles,
    media_urls: post.media_urls || [],
    location: post.location || null,
  };

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-black/80 border-b border-[#2f3336]">
        <div className="px-4 py-3">
          <h1 className="font-semibold text-white">Post</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Hero Post - Usando PostCard con isDetail */}
        <PostCard
          post={postData}
          stats={stats}
          isLikedByCurrentUser={isLikedByCurrentUser || false}
          isRepostedByCurrentUser={isRepostedByCurrentUser || false}
          isDetail={true}
        />

        {/* Separador antes del formulario */}
        <div className="border-b border-[#2f3336]" />

        {/* Input de Respuesta */}
        {user ? (
          <div className="p-4 border-b border-[#2f3336]">
            <CommentForm postId={id} userAvatar={userAvatar} userName={userName} />
          </div>
        ) : (
          <div className="p-4 border-b border-[#2f3336] text-center text-x-gray text-sm">
            <p>Inicia sesión para comentar</p>
          </div>
        )}

        {/* Lista de Comentarios */}
        <div className="divide-y divide-[#2f3336]">
          {comments && comments.length > 0 ? (
            comments.map((comment: SupabaseComment) => {
              const commentLikesCount = comment.comment_likes?.length || 0;
              const isLikedByCurrentUser =
                user &&
                comment.comment_likes?.some(
                  (like: SupabaseCommentLike) => like.user_id === user.id
                );
              
              // Los comentarios no tienen reposts propios
              // El botón de repost en un comentario repostea el post padre,
              // pero no deberíamos mostrar contadores de reposts del comentario
              const repostsCount = 0;
              const isRepostedByCurrentUser = false;

              return (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  isLikedByCurrentUser={isLikedByCurrentUser || false}
                  likesCount={commentLikesCount}
                  postId={id}
                  isRepostedByCurrentUser={isRepostedByCurrentUser}
                  repostsCount={repostsCount}
                />
              );
            })
          ) : (
            <div className="p-8 text-center text-[#71767b] text-[15px]">
              <p>No hay comentarios aún. Sé el primero en comentar.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

