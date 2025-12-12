import { PostCard, type PostData } from "@/components/shared/PostCard";
import { createClient } from "@/utils/supabase/server";

interface SupabaseLike {
  user_id: string;
}

interface SupabaseRepost {
  user_id: string;
}

interface SupabaseComment {
  id: string;
}

interface SupabaseProfile {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface SupabasePost {
  id: string;
  content: string;
  created_at: string;
  type: string;
  media_urls: string[] | null;
  location: string | null;
  profiles: SupabaseProfile | null;
  likes: SupabaseLike[] | null;
  comments: SupabaseComment[] | null;
  reposts: SupabaseRepost[] | null;
}

interface SupabasePoll {
  id: string;
  post_id: string;
  options: string[];
  votes: number[];
}

export default async function Home() {
  const supabase = await createClient();

  // Obtener sesión actual para determinar si el usuario le dio like a los posts
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: posts, error } = await supabase
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
      comments (id),
      reposts (user_id)
    `
    )
    .order("created_at", { ascending: false });

  // Obtener encuestas para los posts que las tengan
  const pollPostIds = posts?.filter((p: SupabasePost) => p.type === "poll").map((p: SupabasePost) => p.id) || [];
  const pollsData: Record<string, SupabasePoll> = {};
  
  if (pollPostIds.length > 0) {
    const { data: polls } = await supabase
      .from("polls")
      .select("*")
      .in("post_id", pollPostIds);
    
    if (polls) {
      polls.forEach((poll: SupabasePoll) => {
        pollsData[poll.post_id] = poll;
      });
    }
  }

  // Manejo de errores
  if (error) {
    console.error("Error al cargar posts:", error);
  }

  return (
    <>
      {/* Header Sticky */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-black/80 border-b border-[#2f3336]">
        <div className="px-4 py-3">
          <h1 className="font-semibold text-white">Inicio</h1>
        </div>
      </div>

      {/* Feed de Posts */}
      {!posts || posts.length === 0 ? (
        <div className="flex items-center justify-center py-16 px-4">
          <p className="text-x-gray text-center">
            Aún no hay publicaciones. Sé el primero en postear.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#2f3336]">
          {posts.map((post: SupabasePost) => {
            // Calcular stats reales
            const likesCount = post.likes?.length || 0;
            const repostsCount = post.reposts?.length || 0;
            const isLikedByCurrentUser =
              user && post.likes?.some((like: SupabaseLike) => like.user_id === user.id);
            const isRepostedByCurrentUser =
              user && post.reposts?.some((repost: SupabaseRepost) => repost.user_id === user.id);

            const commentsCount = post.comments?.length || 0;

            const stats = {
              likes: likesCount,
              comments: commentsCount,
              reposts: repostsCount,
            };

            const postWithExtras = {
              ...post,
              media_urls: post.media_urls || [],
              location: post.location || null,
            };

            return (
              <PostCard
                key={post.id}
                post={postWithExtras as PostData}
                stats={stats}
                isLikedByCurrentUser={isLikedByCurrentUser || false}
                isRepostedByCurrentUser={isRepostedByCurrentUser || false}
                pollData={post.type === "poll" ? pollsData[post.id] : undefined}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
