"use server";

import { createClient } from "@/utils/supabase/server";

export interface SuggestedUser {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface TrendingHashtag {
  tag: string;
  count: number;
}

/**
 * Obtiene usuarios sugeridos para seguir
 * Excluye al usuario actual y a los que ya sigue
 */
export async function getSuggestedUsers(
  limit: number = 3
): Promise<SuggestedUser[]> {
  const supabase = await createClient();

  try {
    // Verificar usuario autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Si no hay usuario, retornar array vacío
      return [];
    }

    // Llamar a la función RPC
    const { data, error } = await supabase.rpc("get_who_to_follow", {
      limit_count: limit,
    });

    if (error) {
      console.error("Error obteniendo usuarios sugeridos:", error);
      return [];
    }

    // Transformar y retornar los datos
    return (data as SuggestedUser[]) || [];
  } catch (error) {
    console.error("Error en getSuggestedUsers:", error);
    return [];
  }
}

/**
 * Obtiene hashtags trending de los últimos 7 días
 */
export async function getTrends(
  limit: number = 10
): Promise<TrendingHashtag[]> {
  const supabase = await createClient();

  try {
    // Llamar a la función RPC
    const { data, error } = await supabase.rpc("get_trending_hashtags", {
      limit_count: limit,
    });

    if (error) {
      console.error("Error obteniendo hashtags trending:", error);
      return [];
    }

    // Transformar y retornar los datos
    // Asegurarse de que los datos tengan el formato correcto
    const trends: TrendingHashtag[] =
      (data as TrendingHashtag[])?.map((item: any) => ({
        tag: item.tag || "",
        count: Number(item.count) || 0,
      })) || [];

    return trends;
  } catch (error) {
    console.error("Error en getTrends:", error);
    return [];
  }
}

