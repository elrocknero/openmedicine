"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { generateQuizFromText, extractTextFromPDF } from "@/lib/gen-ai";

export async function toggleLike(postId: string) {
  const supabase = await createClient();

  // 1. Verificar usuario
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión");

  // 2. Verificar si ya existe el like
  const { data: existingLike } = await supabase
    .from("likes")
    .select()
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .single();

  if (existingLike) {
    // Si existe, lo borramos (Dislike)
    await supabase
      .from("likes")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
  } else {
    // Si no existe, lo creamos (Like)
    await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
  }

  // 3. Recargar la página para mostrar datos frescos
  revalidatePath("/");
}

export async function toggleRepost(postId: string, path: string = "/") {
  const supabase = await createClient();

  // 1. Verificar usuario
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión");

  // 2. Verificar si ya existe el repost
  const { data: existingRepost } = await supabase
    .from("reposts")
    .select()
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .single();

  if (existingRepost) {
    // Si existe, lo borramos (Unrepost)
    await supabase
      .from("reposts")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
  } else {
    // Si no existe, lo creamos (Repost)
    await supabase.from("reposts").insert({
      user_id: user.id,
      post_id: postId,
    });
  }

  // 3. Revalidar la página
  revalidatePath(path);
  revalidatePath("/");
  
  return { success: true };
}

// Alias para mantener compatibilidad
export const repost = toggleRepost;

export async function createPost(
  content: string,
  mediaUrl: string | null,
  type: "text" | "image" | "quiz" | "poll",
  location?: string,
  pollOptions?: string[]
) {
  const supabase = await createClient();

  // 1. Validar usuario
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  // 2. Insertar Post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      content,
      media_urls: mediaUrl ? [mediaUrl] : [],
      type,
      location: location || null,
    })
    .select()
    .single();

  if (postError) {
    console.error("Error creando post:", postError);
    throw new Error("No se pudo crear el post");
  }

  // 3. Si es encuesta, crear las opciones en la tabla polls
  if (type === "poll" && pollOptions && pollOptions.length >= 2) {
    const { error: pollError } = await supabase.from("polls").insert({
      post_id: post.id,
      options: pollOptions,
      votes: new Array(pollOptions.length).fill(0),
    });

    if (pollError) {
      console.error("Error creando encuesta:", pollError);
      // No lanzamos error, el post ya se creó
    }
  }

  // 4. Revalidar feed
  revalidatePath("/");
  return { success: true };
}

export async function createQuizPost(formData: FormData) {
  const supabase = await createClient();

  // 1. Extraer datos
  const content = formData.get("content") as string;
  const file = formData.get("file") as File;

  // 2. Auth Check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };
  if (!file) return { error: "Falta el archivo PDF" };

  try {
    // 3. Procesar PDF (IA)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const text = await extractTextFromPDF(buffer);

    // Generamos el JSON del Quiz
    const quizData = await generateQuizFromText(text);

    // 4. Subir PDF a Supabase Storage
    const fileName = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("posts")
      .upload(fileName, file);

    if (uploadError) throw new Error("Error subiendo archivo");

    const pdfUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/posts/${fileName}`;

    // 5. Insertar en DB (Transacción implícita)
    // A) Post Padre
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        content: content || "Nuevo Quiz Generado con IA",
        type: "quiz",
      })
      .select()
      .single();

    if (postError) throw postError;

    // B) Quiz Data
    const { error: quizError } = await supabase.from("quizzes").insert({
      post_id: post.id,
      pdf_source_url: pdfUrl,
      data: quizData, // JSONB
      total_questions: quizData.questions.length,
    });

    if (quizError) throw quizError;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error(error);
    return {
      error: "Error generando el quiz. Intenta con un PDF más corto.",
    };
  }
}

export async function votePoll(pollId: string, optionIndex: number, path: string) {
  const supabase = await createClient();

  // 1. Verificar usuario
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión");

  // 2. Obtener la encuesta actual
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("*")
    .eq("id", pollId)
    .single();

  if (pollError || !poll) {
    throw new Error("Encuesta no encontrada");
  }

  // 3. Verificar que el índice sea válido
  if (optionIndex < 0 || optionIndex >= poll.options.length) {
    throw new Error("Opción inválida");
  }

  // 4. Incrementar el voto en el array
  const newVotes = [...(poll.votes || [])];
  newVotes[optionIndex] = (newVotes[optionIndex] || 0) + 1;

  // 5. Actualizar la encuesta
  const { error: updateError } = await supabase
    .from("polls")
    .update({ votes: newVotes })
    .eq("id", pollId);

  if (updateError) {
    console.error("Error actualizando encuesta:", updateError);
    throw new Error("Error al votar");
  }

  // 6. Revalidar la página
  revalidatePath(path);
  revalidatePath("/");

  return { success: true };
}
