-- ============================================
-- SCHEMA DE NOTIFICACIONES Y GUARDADOS PARA OPEN MEDICINE
-- ============================================
-- Este script crea las tablas de notificaciones y bookmarks,
-- configura triggers automáticos y políticas de seguridad (RLS).

-- ============================================
-- 1. CREAR TABLA DE NOTIFICACIONES
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'follow', 'reply')),
  entity_id UUID, -- ID del post relacionado (nullable, para likes y replies)
  read BOOLEAN DEFAULT FALSE
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);

-- ============================================
-- 2. CREAR TABLA DE BOOKMARKS (GUARDADOS)
-- ============================================

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Evitar que un usuario guarde el mismo post dos veces
  CONSTRAINT unique_user_post_bookmark UNIQUE (user_id, post_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- ============================================
-- 3. FUNCIONES PARA TRIGGERS DE NOTIFICACIONES
-- ============================================

-- Función para crear notificación de Like
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Obtener el dueño del post
  SELECT user_id INTO post_owner_id
  FROM posts
  WHERE id = NEW.post_id;
  
  -- Solo crear notificación si el dueño del post no es quien da el like
  -- Condición: No notificar si user_id == actor_id
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, entity_id)
    SELECT post_owner_id, NEW.user_id, 'like', NEW.post_id
    WHERE NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = post_owner_id
        AND actor_id = NEW.user_id
        AND type = 'like'
        AND entity_id = NEW.post_id
        AND created_at > NOW() - INTERVAL '5 minutes'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear notificación de Follow
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear notificación si no se está siguiendo a sí mismo
  -- Condición: No notificar si follower_id == following_id
  IF NEW.follower_id != NEW.following_id THEN
    INSERT INTO notifications (user_id, actor_id, type)
    SELECT NEW.following_id, NEW.follower_id, 'follow'
    WHERE NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = NEW.following_id
        AND actor_id = NEW.follower_id
        AND type = 'follow'
        AND created_at > NOW() - INTERVAL '5 minutes'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear notificación de Reply
-- OPCIÓN A: Si los posts tienen parent_id (sistema de respuestas anidadas)
CREATE OR REPLACE FUNCTION create_reply_notification()
RETURNS TRIGGER AS $$
DECLARE
  parent_post_user_id UUID;
BEGIN
  -- Verificar si es una respuesta (parent_id no es null)
  IF NEW.parent_id IS NOT NULL THEN
    -- Obtener el dueño del post padre
    SELECT user_id INTO parent_post_user_id
    FROM posts
    WHERE id = NEW.parent_id;
    
    -- Solo crear notificación si el dueño del post padre no es quien responde
    IF parent_post_user_id IS NOT NULL AND parent_post_user_id != NEW.user_id THEN
      INSERT INTO notifications (user_id, actor_id, type, entity_id)
      SELECT parent_post_user_id, NEW.user_id, 'reply', NEW.id
      WHERE NOT EXISTS (
        SELECT 1 FROM notifications
        WHERE user_id = parent_post_user_id
          AND actor_id = NEW.user_id
          AND type = 'reply'
          AND entity_id = NEW.id
          AND created_at > NOW() - INTERVAL '5 minutes'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- OPCIÓN B: Si los comentarios están en la tabla comments (alternativa)
-- Descomenta esta función si tu esquema usa comments.post_id en lugar de posts.parent_id
/*
CREATE OR REPLACE FUNCTION create_reply_notification_from_comments()
RETURNS TRIGGER AS $$
DECLARE
  parent_post_user_id UUID;
BEGIN
  -- Obtener el dueño del post al que se responde
  SELECT user_id INTO parent_post_user_id
  FROM posts
  WHERE id = NEW.post_id;
  
  -- Solo crear notificación si el dueño del post no es quien comenta
  IF parent_post_user_id IS NOT NULL AND parent_post_user_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, entity_id)
    SELECT parent_post_user_id, NEW.user_id, 'reply', NEW.post_id
    WHERE NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = parent_post_user_id
        AND actor_id = NEW.user_id
        AND type = 'reply'
        AND entity_id = NEW.post_id
        AND created_at > NOW() - INTERVAL '5 minutes'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

-- ============================================
-- 4. CREAR TRIGGERS
-- ============================================

-- Trigger para Likes
DROP TRIGGER IF EXISTS trigger_like_notification ON likes;
CREATE TRIGGER trigger_like_notification
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

-- Trigger para Follows
DROP TRIGGER IF EXISTS trigger_follow_notification ON follows;
CREATE TRIGGER trigger_follow_notification
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION create_follow_notification();

-- Trigger para Replies (Posts con parent_id)
-- Si tu esquema usa posts.parent_id, usa este trigger:
DROP TRIGGER IF EXISTS trigger_reply_notification ON posts;
CREATE TRIGGER trigger_reply_notification
  AFTER INSERT ON posts
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION create_reply_notification();

-- Trigger para Replies (Comentarios en tabla comments)
-- Si tu esquema usa comments.post_id, descomenta este trigger y comenta el anterior:
/*
DROP TRIGGER IF EXISTS trigger_reply_notification_from_comments ON comments;
CREATE TRIGGER trigger_reply_notification_from_comments
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION create_reply_notification_from_comments();
*/

-- ============================================
-- 5. POLÍTICAS RLS PARA NOTIFICACIONES
-- ============================================

-- Habilitar RLS en la tabla
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias notificaciones
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden marcar sus notificaciones como leídas
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Permitir inserción de notificaciones desde triggers
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

-- ============================================
-- 6. POLÍTICAS RLS PARA BOOKMARKS
-- ============================================

-- Habilitar RLS en la tabla
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios bookmarks
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON bookmarks;
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden crear bookmarks para ellos mismos
DROP POLICY IF EXISTS "Users can create their own bookmarks" ON bookmarks;
CREATE POLICY "Users can create their own bookmarks"
  ON bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propios bookmarks
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON bookmarks;
CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 7. FUNCIONES AUXILIARES
-- ============================================

-- Función para marcar una notificación como leída
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE
  WHERE id = notification_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para marcar todas las notificaciones como leídas
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications
  SET read = TRUE
  WHERE user_id = auth.uid() AND read = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Asegúrate de que las siguientes tablas existan:
--    - profiles (con columna id UUID)
--    - posts (con columnas id UUID, user_id UUID, y opcionalmente parent_id UUID)
--    - likes (con columnas user_id UUID, post_id UUID)
--    - follows (con columnas follower_id UUID, following_id UUID)
--    - comments (opcional, si usas esta tabla para comentarios en lugar de posts.parent_id)
--
-- 2. Para el trigger de Replies:
--    - Si tu esquema usa posts.parent_id: El trigger ya está configurado (línea ~150)
--    - Si tu esquema usa comments.post_id: Descomenta la función y el trigger alternativo (líneas ~100-120 y ~165-170)
--
-- 3. Ejecuta este script en el SQL Editor de Supabase
--    (Supabase Dashboard > SQL Editor > New Query)
--
-- 4. Después de ejecutar, verifica que los triggers funcionen probando:
--    - Dar un like a un post
--    - Seguir a un usuario
--    - Comentar/respoder a un post
--    - Guardar un post (bookmark)
--
-- 5. El constraint UNIQUE en bookmarks evita duplicados automáticamente.
--    Si intentas guardar el mismo post dos veces, recibirás un error que debes manejar en el frontend.

