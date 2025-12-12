"use server";

import { createClient } from "@/utils/supabase/server";

export interface SearchResult {
  type: "post" | "quiz" | "user";
  id: string;
  // Para posts/quizzes (campos planos del RPC)
  content?: string;
  created_at?: string;
  post_type?: "text" | "image" | "quiz" | "poll";
  author_name?: string; // Nombre del autor del post
  username?: string; // Username del autor
  avatar_url?: string; // Avatar del autor
  location?: string; // Ubicación del post
  media_urls?: string[]; // URLs de medios del post
  // Para usuarios
  full_name?: string;
  bio?: string;
}

export interface SearchFilters {
  type?: "all" | "posts" | "quizzes" | "people";
  people?: "anyone" | "following";
  location?: "anywhere" | "nearby";
}

export async function searchGlobal(
  query: string,
  filters?: SearchFilters
): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    // Si el filtro es "people", buscar solo en profiles
    if (filters?.type === "people") {
      let profilesQuery = supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, bio")
        .or(`full_name.ilike.%${query.trim()}%,username.ilike.%${query.trim()}%`);

      const { data: profiles, error } = await profilesQuery;

      if (error) {
        console.error("Error buscando perfiles:", error);
        return [];
      }

      return (
        profiles?.map((profile) => ({
          type: "user" as const,
          id: profile.id,
          full_name: profile.full_name || undefined,
          username: profile.username || undefined,
          avatar_url: profile.avatar_url || undefined,
          bio: profile.bio || undefined,
        })) || []
      );
    }

    // Si el filtro es "quizzes", buscar solo posts tipo quiz
    if (filters?.type === "quizzes") {
      let postsQuery = supabase
        .from("posts")
        .select(`
          id,
          content,
          created_at,
          type,
          media_urls,
          location,
          user_id,
          profiles!posts_user_id_fkey (
            full_name,
            username,
            avatar_url
          )
        `)
        .eq("type", "quiz")
        .ilike("content", `%${query.trim()}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      // Filtro de personas: solo posts de personas que sigues
      if (filters.people === "following" && user) {
        const { data: follows } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);

        const followingIds = follows?.map((f) => f.following_id) || [];
        if (followingIds.length > 0) {
          postsQuery = postsQuery.in("user_id", followingIds);
        } else {
          // Si no sigue a nadie, no hay resultados
          return [];
        }
      }

      // Filtro de ubicación: cerca de ti
      if (filters.location === "nearby" && user) {
        // Obtener ubicación del usuario
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("location")
          .eq("id", user.id)
          .single();

        if (userProfile?.location) {
          postsQuery = postsQuery.ilike("location", `%${userProfile.location}%`);
        }
      }

      const { data: posts, error } = await postsQuery;

      if (error) {
        console.error("Error buscando quizzes:", error);
        return [];
      }

      return (
        posts?.map((post: any) => ({
          type: "quiz" as const,
          id: post.id,
          content: post.content || undefined,
          created_at: post.created_at || undefined,
          post_type: post.type as "quiz",
          author_name: post.profiles?.full_name || undefined,
          username: post.profiles?.username || undefined,
          avatar_url: post.profiles?.avatar_url || undefined,
          location: post.location || undefined,
          media_urls: post.media_urls || undefined,
        })) || []
      );
    }

    // Búsqueda de posts (default o type === "posts")
    let postsQuery = supabase
      .from("posts")
      .select(`
        id,
        content,
        created_at,
        type,
        media_urls,
        location,
        user_id,
        profiles!posts_user_id_fkey (
          full_name,
          username,
          avatar_url
        )
      `)
      .ilike("content", `%${query.trim()}%`)
      .order("created_at", { ascending: false })
      .limit(50);

    // Filtro de tipo: excluir quizzes si type === "posts"
    if (filters?.type === "posts") {
      postsQuery = postsQuery.neq("type", "quiz");
    }

    // Filtro de personas: solo posts de personas que sigues
    if (filters?.people === "following" && user) {
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = follows?.map((f) => f.following_id) || [];
      if (followingIds.length > 0) {
        postsQuery = postsQuery.in("user_id", followingIds);
      } else {
        // Si no sigue a nadie, no hay resultados
        return [];
      }
    }

    // Filtro de ubicación: cerca de ti
    if (filters?.location === "nearby" && user) {
      // Obtener ubicación del usuario
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("location")
        .eq("id", user.id)
        .single();

      if (userProfile?.location) {
        postsQuery = postsQuery.ilike("location", `%${userProfile.location}%`);
      }
    }

    const { data: posts, error } = await postsQuery;

    if (error) {
      console.error("Error buscando posts:", error);
      return [];
    }

      return (
        posts?.map((post: any) => ({
          type: (post.type === "quiz" ? "quiz" : "post") as "post" | "quiz",
          id: post.id,
          content: post.content || undefined,
          created_at: post.created_at || undefined,
          post_type: post.type as "text" | "image" | "quiz" | "poll",
          author_name: post.profiles?.full_name || undefined,
          username: post.profiles?.username || undefined,
          avatar_url: post.profiles?.avatar_url || undefined,
          location: post.location || undefined,
          media_urls: post.media_urls || undefined,
        })) || []
      );
  } catch (error) {
    console.error("Error en searchGlobal:", error);
    return [];
  }
}
