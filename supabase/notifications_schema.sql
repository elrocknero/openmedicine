-- ============================================
-- SCHEMA DE NOTIFICACIONES PARA OPEN MEDICINE
-- ============================================
-- Este archivo crea la tabla de notificaciones, triggers automáticos
-- y políticas de seguridad (RLS) para el sistema de notificaciones.

-- ============================================
-- 1. CREAR TABLA DE NOTIFICACIONES
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'follow', 'reply')),
  entity_id UUID, -- ID del post relacionado (opcional, para likes y replies)
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- 2. FUNCIONES PARA TRIGGERS
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
  -- Evitar duplicados recientes (últimos 5 minutos)
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
  -- Evitar duplicados recientes (últimos 5 minutos)
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

-- Función para crear notificación de Reply (Comentario)
CREATE OR REPLACE FUNCTION create_reply_notification()
RETURNS TRIGGER AS $$
DECLARE
  parent_post_user_id UUID;
BEGIN
  -- Obtener el dueño del post al que se responde
  SELECT user_id INTO parent_post_user_id
  FROM posts
  WHERE id = NEW.post_id;
  
  -- Solo crear notificación si el dueño del post no es quien comenta
  -- Evitar duplicados recientes (últimos 5 minutos)
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

-- ============================================
-- 3. CREAR TRIGGERS
-- ============================================

-- Trigger para Likes
DROP TRIGGER IF EXISTS trigger_like_notification ON likes;
CREATE TRIGGER trigger_like_notification
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

-- Trigger para Follows
-- Nota: Ajusta el nombre de la tabla según tu esquema (puede ser 'follows', 'user_follows', etc.)
DROP TRIGGER IF EXISTS trigger_follow_notification ON follows;
CREATE TRIGGER trigger_follow_notification
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION create_follow_notification();

-- Trigger para Comments (Replies)
DROP TRIGGER IF EXISTS trigger_reply_notification ON comments;
CREATE TRIGGER trigger_reply_notification
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION create_reply_notification();

-- ============================================
-- 4. POLÍTICAS RLS (ROW LEVEL SECURITY)
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
-- Las funciones SECURITY DEFINER tienen permisos elevados, pero aún necesitamos
-- una política que permita la inserción. Esta política permite insertar si
-- el usuario autenticado es el actor (quien realiza la acción).
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

-- ============================================
-- 5. FUNCIÓN AUXILIAR PARA MARCAR COMO LEÍDA
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
-- 1. Asegúrate de que la tabla 'follows' existe con las columnas:
--    - follower_id (quien sigue)
--    - following_id (a quien sigue)
--
-- 2. Si tu esquema de comentarios usa 'parent_id' en lugar de 'post_id',
--    ajusta la función create_reply_notification() para usar:
--    SELECT user_id FROM posts WHERE id = NEW.parent_id;
--
-- 3. Ejecuta este script en el SQL Editor de Supabase
--    (Supabase Dashboard > SQL Editor > New Query)
--
-- 4. Después de ejecutar, verifica que los triggers funcionen probando:
--    - Dar un like a un post
--    - Seguir a un usuario
--    - Comentar en un post

