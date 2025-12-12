import { createClient } from "@/utils/supabase/server";
import { ProfileContent } from "@/components/shared/ProfileContent";
import type { PostData } from "@/components/shared/PostCard";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Obtener usuario actual
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // Buscar perfil por username
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (profileError || !profile) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold text-white mb-2">Perfil no encontrado</p>
          <p className="text-x-gray text-sm">
            No existe un usuario con el username "{username}".
          </p>
        </div>
      </main>
    );
  }

  // Verificar si es el dueño del perfil
  const isOwner = currentUser?.id === profile.id;

  // Obtener conteo de follows (seguidores y seguidos)
  // Si la tabla follows no existe, usamos valores por defecto
  let followersCount = 0;
  let followingCount = 0;

  try {
    const { count: followers } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id);
    followersCount = followers || 0;

    const { count: following } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.id);
    followingCount = following || 0;
  } catch (error) {
    // Si la tabla follows no existe, simplemente dejamos los contadores en 0
    console.log("Tabla follows no disponible:", error);
  }

  // Obtener posts del usuario
  const { data: userPosts, error: postsError } = await supabase
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
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  // Obtener todos los likes y reposts para calcular stats
  const postIds = userPosts?.map((p) => p.id) || [];
  let allLikes: Array<{ post_id: string; user_id: string }> | null = null;
  let allReposts: Array<{ post_id: string; user_id: string }> | null = null;

  if (postIds.length > 0 && currentUser) {
    const { data: likesData } = await supabase
      .from("likes")
      .select("post_id, user_id")
      .in("post_id", postIds);
    allLikes = likesData;

    const { data: repostsData } = await supabase
      .from("reposts")
      .select("post_id, user_id")
      .in("post_id", postIds);
    allReposts = repostsData;
  }

  const getPostStats = (post: any) => {
    const postLikes = allLikes?.filter((like) => like.post_id === post.id) || [];
    const postReposts = allReposts?.filter((repost) => repost.post_id === post.id) || [];
    const likesCount = postLikes.length;
    const repostsCount = postReposts.length;
    const isLikedByCurrentUser =
      currentUser && postLikes.some((like) => like.user_id === currentUser.id);
    const isRepostedByCurrentUser =
      currentUser && postReposts.some((repost) => repost.user_id === currentUser.id);
    const commentsCount = post.comments?.length || 0;

    return {
      likes: likesCount,
      comments: commentsCount,
      reposts: repostsCount,
      isLiked: isLikedByCurrentUser || false,
      isReposted: isRepostedByCurrentUser || false,
    };
  };

  // Filtrar posts por tipo y preparar con stats
  const textPosts = (userPosts?.filter((p) => p.type === "text" || p.type === "image") || []).map((post: any) => ({
    ...(post as PostData),
    stats: getPostStats(post),
  }));

  const quizPosts = (userPosts?.filter((p) => p.type === "quiz") || []).map((post: any) => ({
    ...(post as PostData),
    stats: getPostStats(post),
  }));

  // Formatear fecha de unión
  const joinedDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <ProfileContent
      profile={profile}
      isOwner={isOwner}
      textPosts={textPosts}
      quizPosts={quizPosts}
      followersCount={followersCount}
      followingCount={followingCount}
      joinedDate={joinedDate}
    />
  );
}

