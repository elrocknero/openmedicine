import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationItem, type NotificationData } from "@/components/shared/NotificationItem";
import { Settings } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { NotificationsReader } from "@/components/shared/NotificationsReader";

interface SupabaseNotification {
  id: string;
  type: string;
  entity_id: string | null;
  created_at: string;
  read: boolean;
  actor: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface SupabasePost {
  id: string;
  content: string;
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Si no hay usuario autenticado, mostrar mensaje
  if (!user) {
    return (
      <main className="min-h-screen bg-black">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <h2 className="text-xl font-semibold text-white mb-2">
            Inicia sesión para ver tus notificaciones
          </h2>
          <p className="text-[#71767b] text-center max-w-sm">
            Necesitas estar autenticado para ver tus notificaciones.
          </p>
        </div>
      </main>
    );
  }

  // Obtener notificaciones reales de Supabase
  // Hacemos join con profiles para obtener datos del actor (quien hizo la acción)
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select(`
      *,
      actor:profiles!notifications_actor_id_fkey (
        id,
        full_name,
        username,
        avatar_url
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al cargar notificaciones:", error);
  }

  // Obtener posts relacionados si hay entity_ids
  const entityIds = (notifications || [])
    .filter((n: SupabaseNotification) => n.entity_id && (n.type === 'like' || n.type === 'reply'))
    .map((n: SupabaseNotification) => n.entity_id as string);

  const postsMap: Record<string, { id: string; content: string }> = {};
  if (entityIds.length > 0) {
    const { data: posts } = await supabase
      .from("posts")
      .select("id, content")
      .in("id", entityIds);
    
    if (posts) {
      posts.forEach((post: SupabasePost) => {
        postsMap[post.id] = { id: post.id, content: post.content || "" };
      });
    }
  }

  // Calcular cuántas notificaciones no leídas hay
  const unreadCount = (notifications || []).filter((n: SupabaseNotification) => !n.read).length;

  // Transformar datos de Supabase a NotificationData
  const allNotifications: NotificationData[] = (notifications || []).map((n: SupabaseNotification) => ({
    id: n.id,
    type: n.type as "like" | "follow" | "reply",
    user: {
      id: n.actor?.id || "",
      full_name: n.actor?.full_name || "Usuario",
      username: n.actor?.username || "usuario",
      avatar_url: n.actor?.avatar_url || null,
    },
    post: n.entity_id && postsMap[n.entity_id] ? {
      id: postsMap[n.entity_id].id,
      content: postsMap[n.entity_id].content,
    } : null,
    created_at: n.created_at,
    read: n.read || false, // Usar el estado real de la base de datos
  }));

  // Filtrar notificaciones verificadas (por ahora, todas las que tengan "dr" o "dra" en el username)
  const verifiedNotifications = allNotifications.filter(
    (n) => n.user.username?.toLowerCase().includes("dr") || 
          n.user.username?.toLowerCase().includes("dra")
  );

  return (
    <main className="min-h-screen bg-black">
      {/* Componente invisible que marca notificaciones como leídas */}
      <NotificationsReader unreadCount={unreadCount} />
      
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-black/80 border-b border-[#2f3336]">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold text-white text-xl">Notificaciones</h1>
          <Link
            href="/settings/notifications"
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Configuración de notificaciones"
          >
            <Settings className="w-5 h-5 text-white" />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <div className="sticky top-[53px] z-20 bg-black/60 backdrop-blur-md border-b border-[#2f3336]">
          <TabsList className="flex w-full h-[53px] rounded-none bg-transparent p-0">
            <TabsTrigger
              value="all"
              className="flex-1 h-full relative flex items-center justify-center text-[15px] font-medium text-[#71767b] transition-colors hover:bg-white/10 cursor-pointer rounded-none border-none outline-none data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:w-[56px] data-[state=active]:after:h-[4px] data-[state=active]:after:bg-white data-[state=active]:after:rounded-full"
            >
              Todas
            </TabsTrigger>
            <TabsTrigger
              value="verified"
              className="flex-1 h-full relative flex items-center justify-center text-[15px] font-medium text-[#71767b] transition-colors hover:bg-white/10 cursor-pointer rounded-none border-none outline-none data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:w-[56px] data-[state=active]:after:h-[4px] data-[state=active]:after:bg-white data-[state=active]:after:rounded-full"
            >
              Verificado
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab: Todas */}
        <TabsContent value="all" className="mt-0">
          {allNotifications.length === 0 ? (
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                No hay notificaciones
              </h2>
              <p className="text-[#71767b] text-center max-w-sm">
                Cuando tengas notificaciones nuevas, aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#2f3336]">
              {allNotifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Verificado */}
        <TabsContent value="verified" className="mt-0">
          {verifiedNotifications.length === 0 ? (
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                No hay notificaciones verificadas
              </h2>
              <p className="text-[#71767b] text-center max-w-sm">
                Las notificaciones de cuentas verificadas aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#2f3336]">
              {verifiedNotifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}

