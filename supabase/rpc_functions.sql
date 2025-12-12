-- ============================================
-- FUNCIONES RPC PARA SIDEBAR DERECHO
-- ============================================
-- Este script crea funciones RPC (Remote Procedure Calls) en Supabase
-- para obtener sugerencias de usuarios y hashtags trending.

-- ============================================
-- 1. FUNCIÓN: get_who_to_follow
-- ============================================
-- Devuelve una lista de usuarios sugeridos para seguir,
-- excluyendo al usuario actual y a los que ya sigue.

CREATE OR REPLACE FUNCTION get_who_to_follow(limit_count int DEFAULT 3)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  -- Si no hay usuario autenticado, retornar vacío
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Retornar usuarios que:
  -- 1. No sean el usuario actual
  -- 2. No estén en la lista de usuarios que el usuario actual sigue
  -- 3. Ordenados por fecha de creación (más recientes primero)
  -- 4. Limitados por el parámetro
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.username,
    p.avatar_url,
    p.bio,
    p.created_at
  FROM profiles p
  WHERE p.id != current_user_id
    AND p.id NOT IN (
      -- Excluir usuarios que el usuario actual ya sigue
      SELECT following_id
      FROM follows
      WHERE follower_id = current_user_id
    )
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$;

-- ============================================
-- 2. FUNCIÓN: get_trending_hashtags
-- ============================================
-- Extrae hashtags de los posts de los últimos 7 días,
-- los agrupa y cuenta su frecuencia.

CREATE OR REPLACE FUNCTION get_trending_hashtags(limit_count int DEFAULT 10)
RETURNS TABLE (
  tag TEXT,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Extraer hashtags de posts de los últimos 7 días
  -- Usa regexp_matches para encontrar todas las palabras que empiezan con #
  RETURN QUERY
  WITH hashtag_matches AS (
    SELECT 
      unnest(
        regexp_matches(
          p.content,
          '#[a-zA-Z0-9_]+',
          'g'
        )
      ) AS hashtag
    FROM posts p
    WHERE p.created_at >= NOW() - INTERVAL '7 days'
      AND p.content IS NOT NULL
  ),
  normalized_hashtags AS (
    SELECT 
      LOWER(hashtag) AS normalized_tag
    FROM hashtag_matches
  ),
  hashtag_counts AS (
    SELECT 
      normalized_tag AS tag,
      COUNT(*) AS count
    FROM normalized_hashtags
    GROUP BY normalized_tag
  )
  SELECT 
    hc.tag,
    hc.count
  FROM hashtag_counts hc
  ORDER BY hc.count DESC, hc.tag ASC
  LIMIT limit_count;
END;
$$;

-- ============================================
-- 3. POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================
-- Las funciones RPC con SECURITY DEFINER se ejecutan con permisos elevados,
-- pero aún necesitamos asegurarnos de que los usuarios solo puedan ver
-- datos públicos o sus propios datos.

-- Nota: Las funciones ya filtran por auth.uid() internamente,
-- así que no necesitamos políticas RLS adicionales para estas funciones.

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. get_who_to_follow:
--    - Excluye automáticamente al usuario actual
--    - Excluye usuarios que el usuario actual ya sigue
--    - Ordena por fecha de creación (más recientes primero)
--    - Puedes cambiar el orden a aleatorio si prefieres:
--      ORDER BY RANDOM() (pero esto puede ser más lento)
--
-- 2. get_trending_hashtags:
--    - Busca hashtags en posts de los últimos 7 días
--    - Usa regexp_matches para extraer palabras que empiezan con #
--    - Normaliza a minúsculas para agrupar correctamente
--    - Ordena por frecuencia (más popular primero)
--    - Si no hay hashtags, retorna una tabla vacía
--
-- 3. Ejecuta este script en el SQL Editor de Supabase
--    (Supabase Dashboard > SQL Editor > New Query)
--
-- 4. Para probar las funciones:
--    SELECT * FROM get_who_to_follow(5);
--    SELECT * FROM get_trending_hashtags(10);

