"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addComment(
  postId: string,
  content: string,
  mediaUrl?: string
) {
  const supabase = await createClient();

  // Verificar usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión para comentar");
  }

  if (!content.trim()) {
    throw new Error("El comentario no puede estar vacío");
  }

  // Insertar comentario
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user.id,
    content: content.trim(),
    media_url: mediaUrl || null,
  });

  if (error) {
    console.error("Error creando comentario:", error);
    throw new Error("Error al crear el comentario");
  }

  // Revalidar la página del post
  revalidatePath(`/post/${postId}`);
  revalidatePath("/");

  return { success: true };
}

export async function toggleCommentLike(commentId: string, path: string) {
  const supabase = await createClient();

  // Verificar usuario
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión");

  // Verificar si ya existe el like
  const { data: existingLike } = await supabase
    .from("comment_likes")
    .select()
    .eq("user_id", user.id)
    .eq("comment_id", commentId)
    .single();

  if (existingLike) {
    // Si existe, lo borramos (Unlike)
    await supabase
      .from("comment_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("comment_id", commentId);
  } else {
    // Si no existe, lo creamos (Like)
    await supabase.from("comment_likes").insert({
      user_id: user.id,
      comment_id: commentId,
    });
  }

  // Revalidar la página
  revalidatePath(path);
  revalidatePath("/");

  return { success: true };
}

