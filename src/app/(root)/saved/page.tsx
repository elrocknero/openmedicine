import { PostCard, type PostData } from "@/components/shared/PostCard";
import { createClient } from "@/utils/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function SavedPage() {
  const supabase = await createClient();

  // Obtener usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-black">
        <div className="sticky top-0 z-10 backdrop-blur-md bg-black/80 border-b border-[#2f3336]">
          <div className="px-4 py-3">
            <h1 className="font-semibold text-white">Guardados</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-16 px-4">
          <p className="text-x-gray text-center">
            Debes iniciar sesión para ver tus posts guardados.
          </p>
        </div>
      </main>
    );
  }

  // Obtener perfil del usuario para mostrar el username
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const username = profile?.username || "usuario";

  // Obtener los bookmarks del usuario con join directo a posts
  const { data: bookmarks, error: bookmarksError } = await supabase
    .from("bookmarks")
    .select(`
      *,
      post:posts!bookmarks_post_id_fkey (
        *,
        profiles!posts_user_id_fkey (
          full_name,
          username,
          avatar_url
        ),
        likes (user_id),
        comments (id),
        reposts (user_id)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (bookmarksError) {
    console.error("Error al cargar bookmarks:", bookmarksError);
  }

  // Si no hay bookmarks, mostrar mensaje vacío
  if (!bookmarks || bookmarks.length === 0) {
    return (
      <main className="min-h-screen bg-black">
        {/* Header */}
        <div className="sticky top-0 z-10 backdrop-blur-md bg-black/80 border-b border-[#2f3336]">
          <div className="px-4 py-3 flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="font-semibold text-white">Guardados</h1>
              <p className="text-sm text-[#71767b]">@{username}</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 rounded-full bg-[#16181c] flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-[#71767b]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Aún no has guardado nada
          </h2>
          <p className="text-[#71767b] text-center max-w-sm">
            Guarda posts para verlos aquí luego.
          </p>
        </div>
      </main>
    );
  }

  // Extraer los posts de los bookmarks (ya vienen con el join)
  // Si el join falla, hacer una consulta separada como fallback
  let posts: any[] = [];
  
  if (bookmarks && bookmarks.length > 0) {
    // Intentar extraer posts del join
    const postsFromJoin = bookmarks
      .map((bookmark: any) => bookmark.post)
      .filter((post: any) => post !== null && post !== undefined);
    
    if (postsFromJoin.length > 0) {
      posts = postsFromJoin;
    } else {
      // Fallback: consulta separada si el join no funcionó
      const postIds = bookmarks.map((b: any) => b.post_id);
      const { data: postsData } = await supabase
        .from("posts")
        .select(`
          *,
          profiles!posts_user_id_fkey (
            full_name,
            username,
            avatar_url
          ),
          likes (user_id),
          comments (id),
          reposts (user_id)
        `)
        .in("id", postIds)
        .order("created_at", { ascending: false });
      
      posts = postsData || [];
    }
  }

  // Obtener encuestas para los posts que las tengan
  const pollPostIds =
    posts?.filter((p: any) => p.type === "poll").map((p: any) => p.id) || [];
  let pollsData: Record<string, any> = {};

  if (pollPostIds.length > 0) {
    const { data: polls } = await supabase
      .from("polls")
      .select("*")
      .in("post_id", pollPostIds);

    if (polls) {
      polls.forEach((poll: any) => {
        pollsData[poll.post_id] = poll;
      });
    }
  }

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-black/80 border-b border-[#2f3336]">
        <div className="px-4 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="font-semibold text-white">Guardados</h1>
            <p className="text-sm text-[#71767b]">@{username}</p>
          </div>
        </div>
      </div>

      {/* Lista de Posts Guardados */}
      {!posts || posts.length === 0 ? (
        <div className="flex items-center justify-center py-16 px-4">
          <p className="text-x-gray text-center">
            No se pudieron cargar los posts guardados.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#2f3336]">
          {posts.map((post: any) => {
            // Calcular stats reales
            const likesCount = post.likes?.length || 0;
            const repostsCount = post.reposts?.length || 0;
            const isLikedByCurrentUser =
              user && post.likes?.some((like: any) => like.user_id === user.id);
            const isRepostedByCurrentUser =
              user && post.reposts?.some((repost: any) => repost.user_id === user.id);

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
    </main>
  );
}

