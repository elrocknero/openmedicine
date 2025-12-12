"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Marca todas las notificaciones del usuario actual como leídas
 */
export async function markAllNotificationsAsRead() {
  const supabase = await createClient();

  // Verificar usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión");
  }

  // Marcar todas las notificaciones no leídas como leídas
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) {
    console.error("Error al marcar notificaciones como leídas:", error);
    throw new Error("Error al actualizar las notificaciones");
  }

  // Revalidar la página de notificaciones
  revalidatePath("/notifications");

  return { success: true };
}

/**
 * Marca una notificación específica como leída
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();

  // Verificar usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión");
  }

  // Marcar la notificación como leída
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error al marcar notificación como leída:", error);
    throw new Error("Error al actualizar la notificación");
  }

  // Revalidar la página de notificaciones
  revalidatePath("/notifications");

  return { success: true };
}

