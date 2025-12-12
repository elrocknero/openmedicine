import { searchGlobal, type SearchResult } from "@/lib/actions/search.actions";
import { PostCard, type PostData } from "@/components/shared/PostCard";
import { UserResultCard } from "@/components/shared/UserResultCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/utils/supabase/server";
import { SearchInput } from "@/components/shared/SearchInput";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    people?: string;
    location?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const type = params.type || "all";
  const people = params.people || "anyone";
  const location = params.location || "anywhere";

  // Obtener usuario para calcular likes
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Realizar búsqueda con filtros
  const filters = {
    type: type as "all" | "posts" | "quizzes" | "people",
    people: people as "anyone" | "following",
    location: location as "anywhere" | "nearby",
  };

  const allResults = query.trim()
    ? await searchGlobal(query, filters)
    : [];

  // Filtrar resultados por tipo
  const posts = allResults.filter(
    (r) => r.type === "post" || r.type === "quiz"
  );
  const quizzes = allResults.filter((r) => r.type === "quiz");
  const users = allResults.filter((r) => r.type === "user");
  const mediaPosts = posts.filter((p) => p.post_type === "image");

  // Nota: El RPC devuelve campos planos (author_name, username, avatar_url)
  // PostCard espera una estructura anidada con profiles
  // El mapeo se hace inline en cada .map() más abajo

  // Obtener todos los likes, comentarios y reposts de los posts encontrados de una vez
  const postIds = posts.map((p) => p.id);
  let allLikes: Array<{ post_id: string; user_id: string }> | null = null;
  let allComments: Array<{ post_id: string }> | null = null;
  let allReposts: Array<{ post_id: string; user_id: string }> | null = null;

  if (postIds.length > 0) {
    const [likesData, commentsData, repostsData] = await Promise.all([
      supabase
        .from("likes")
        .select("post_id, user_id")
        .in("post_id", postIds),
      supabase
        .from("comments")
        .select("post_id")
        .in("post_id", postIds),
      supabase
        .from("reposts")
        .select("post_id, user_id")
        .in("post_id", postIds),
    ]);

    allLikes = likesData.data;
    allComments = commentsData.data;
    allReposts = repostsData.data;
  }

  // Función helper para obtener stats de un post
  const getPostStats = (postId: string) => {
    const postLikes = allLikes?.filter((like) => like.post_id === postId) || [];
    const postComments = allComments?.filter((c) => c.post_id === postId) || [];
    const postReposts = allReposts?.filter((r) => r.post_id === postId) || [];
    
    const likesCount = postLikes.length;
    const commentsCount = postComments.length;
    const repostsCount = postReposts.length;
    
    const isLikedByCurrentUser =
      user && postLikes.some((like) => like.user_id === user.id);
    const isRepostedByCurrentUser =
      user && postReposts.some((repost) => repost.user_id === user.id);

    return {
      likes: likesCount,
      comments: commentsCount,
      reposts: repostsCount,
      isLiked: isLikedByCurrentUser || false,
      isReposted: isRepostedByCurrentUser || false,
    };
  };

  return (
    <main className="min-h-screen bg-black">
      {/* Header con Input de Búsqueda */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-black/80 border-b border-[#2f3336]">
        <div className="px-4 py-3">
          <SearchInput defaultValue={query} placeholder="Buscar en Open Medicine..." />
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-2xl mx-auto p-4">
        {!query.trim() ? (
          <div className="text-center py-16 border border-[#2f3336] rounded-2xl bg-[#16181c] mt-6">
            <p className="text-xl font-semibold text-white mb-2">
              Busca en Open Medicine
            </p>
            <p className="text-x-gray text-sm">
              Encuentra publicaciones, quizzes y personas relacionadas con medicina.
            </p>
          </div>
        ) : allResults.length === 0 ? (
          <div className="text-center py-16 border border-[#2f3336] rounded-2xl bg-[#16181c] mt-6">
            <p className="text-xl font-semibold text-white mb-2">
              No encontramos nada sobre "{query}"
            </p>
            <p className="text-x-gray text-sm">
              Intenta con otra palabra clave o verifica la ortografía.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="top" className="w-full">
            <div className="sticky top-[53px] z-20 bg-black/60 backdrop-blur-md border-b border-[#2f3336]">
              <TabsList className="flex w-full h-[53px] rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="top"
                  className="flex-1 h-full relative flex items-center justify-center text-[15px] font-medium text-[#71767b] transition-colors hover:bg-white/10 cursor-pointer rounded-none border-none outline-none data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:w-[56px] data-[state=active]:after:h-[4px] data-[state=active]:after:bg-white data-[state=active]:after:rounded-full"
                >
                  Top ({allResults.length})
                </TabsTrigger>
                <TabsTrigger
                  value="latest"
                  className="flex-1 h-full relative flex items-center justify-center text-[15px] font-medium text-[#71767b] transition-colors hover:bg-white/10 cursor-pointer rounded-none border-none outline-none data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:w-[56px] data-[state=active]:after:h-[4px] data-[state=active]:after:bg-white data-[state=active]:after:rounded-full"
                >
                  Recientes ({posts.length})
                </TabsTrigger>
                <TabsTrigger
                  value="people"
                  className="flex-1 h-full relative flex items-center justify-center text-[15px] font-medium text-[#71767b] transition-colors hover:bg-white/10 cursor-pointer rounded-none border-none outline-none data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:w-[56px] data-[state=active]:after:h-[4px] data-[state=active]:after:bg-white data-[state=active]:after:rounded-full"
                >
                  Personas ({users.length})
                </TabsTrigger>
                <TabsTrigger
                  value="media"
                  className="flex-1 h-full relative flex items-center justify-center text-[15px] font-medium text-[#71767b] transition-colors hover:bg-white/10 cursor-pointer rounded-none border-none outline-none data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:w-[56px] data-[state=active]:after:h-[4px] data-[state=active]:after:bg-white data-[state=active]:after:rounded-full"
                >
                  Multimedia ({mediaPosts.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab: Top */}
            <TabsContent value="top" className="mt-0 space-y-4 pt-6">
              {allResults.length === 0 ? (
                <p className="text-x-gray text-center py-8">
                  No hay resultados para mostrar
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Posts y Quizzes */}
                  {posts.length > 0 && (
                    <div className="space-y-0 divide-y divide-[#2f3336]">
                      {posts.map((result: any) => {
                        // Transformación de datos (Adapter Pattern)
                        // Mejorar mapeo: usar username si full_name está vacío
                        const displayName = result.author_name?.trim() || 
                                           result.username || 
                                           "Usuario de OpenMedicine";
                        const mappedPost: PostData = {
                          id: result.id,
                          content: result.content || result.title || "",
                          created_at: result.created_at || new Date().toISOString(),
                          type: (result.post_type || result.type) as "text" | "image" | "quiz" | "poll",
                          media_urls: (result.media_urls as string[]) || null,
                          location: result.location || null,
                          // Reconstruimos el objeto profiles con fallbacks mejorados
                          profiles: {
                            full_name: displayName,
                            username: result.username || "usuario",
                            avatar_url: result.avatar_url || null,
                          },
                        };
                        const stats = getPostStats(result.id);

                        return (
                          <PostCard
                            key={result.id}
                            post={mappedPost}
                            stats={stats}
                            isLikedByCurrentUser={stats.isLiked}
                            isRepostedByCurrentUser={stats.isReposted}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Usuarios */}
                  {users.length > 0 && (
                    <div className="space-y-3 mt-6">
                      <h2 className="text-lg font-semibold text-white mb-2">
                        Personas
                      </h2>
                      {users.map((user) => {
                        // Mejorar mapeo: usar username si full_name está vacío
                        const displayName = user.full_name?.trim() || 
                                           user.username || 
                                           "Usuario de OpenMedicine";
                        return (
                          <UserResultCard
                            key={user.id}
                            id={user.id}
                            full_name={displayName}
                            username={user.username || "@usuario"}
                            avatar_url={user.avatar_url || null}
                            bio={user.bio || null}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Tab: Recientes */}
            <TabsContent value="latest" className="mt-0 pt-6">
              {posts.length === 0 ? (
                <div className="text-center py-16 border border-[#2f3336] rounded-2xl bg-[#16181c]">
                  <p className="text-x-gray">
                    No se encontraron publicaciones para "{query}"
                  </p>
                </div>
              ) : (
                <div className="space-y-0 divide-y divide-[#2f3336]">
                  {posts.map((result: any) => {
                    // Transformación de datos (Adapter Pattern)
                    const mappedPost: PostData = {
                      id: result.id,
                      content: result.content || result.title || "",
                      created_at: result.created_at || new Date().toISOString(),
                      type: (result.post_type || result.type) as "text" | "image" | "quiz" | "poll",
                      media_urls: (result.media_urls as string[]) || null,
                      location: result.location || null,
                      // Reconstruimos el objeto profiles con los campos planos del RPC
                      profiles: {
                        full_name: result.author_name || "Usuario Desconocido",
                        username: result.username || "usuario",
                        avatar_url: result.avatar_url || null,
                      },
                    };
                    const stats = getPostStats(result.id);

                    return (
                      <PostCard
                        key={result.id}
                        post={mappedPost}
                        stats={stats}
                        isLikedByCurrentUser={stats.isLiked}
                        isRepostedByCurrentUser={stats.isReposted}
                      />
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Tab: Personas */}
            <TabsContent value="people" className="mt-0 pt-6">
              {users.length === 0 ? (
                <div className="text-center py-16 border border-[#2f3336] rounded-2xl bg-[#16181c]">
                  <p className="text-x-gray">
                    No se encontraron personas para "{query}"
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => {
                    // Mejorar mapeo: usar username si full_name está vacío
                    const displayName = user.full_name?.trim() || 
                                       user.username || 
                                       "Usuario de OpenMedicine";
                    return (
                      <UserResultCard
                        key={user.id}
                        id={user.id}
                        full_name={displayName}
                        username={user.username || "@usuario"}
                        avatar_url={user.avatar_url || null}
                        bio={user.bio || null}
                      />
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Tab: Multimedia */}
            <TabsContent value="media" className="mt-0 pt-6">
              {mediaPosts.length === 0 ? (
                <div className="text-center py-16 border border-[#2f3336] rounded-2xl bg-[#16181c]">
                  <p className="text-x-gray">
                    No se encontraron publicaciones con imágenes para "{query}"
                  </p>
                </div>
              ) : (
                <div className="space-y-0 divide-y divide-[#2f3336]">
                  {mediaPosts.map((result: any) => {
                      const mappedPost: PostData = {
                        id: result.id,
                        content: result.content || result.title || "",
                        created_at: result.created_at || new Date().toISOString(),
                        type: (result.post_type || result.type) as "text" | "image" | "quiz" | "poll",
                        media_urls: (result.media_urls as string[]) || null,
                        location: result.location || null,
                        profiles: {
                          full_name: result.author_name || "Usuario Desconocido",
                          username: result.username || "usuario",
                          avatar_url: result.avatar_url || null,
                        },
                      };
                      const stats = getPostStats(result.id);

                      return (
                        <PostCard
                          key={result.id}
                          post={mappedPost}
                          stats={stats}
                          isLikedByCurrentUser={stats.isLiked}
                          isRepostedByCurrentUser={stats.isReposted}
                        />
                      );
                    })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}

