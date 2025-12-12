"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitQuizScore(
  quizId: string,
  score: number,
  totalQuestions: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Debes iniciar sesión");

  // Guardamos el resultado (Upsert para permitir reintentos y actualizar nota)
  const { error } = await supabase.from("quiz_submissions").upsert(
    {
      quiz_id: quizId,
      user_id: user.id,
      score: score,
      // Podríamos guardar también un JSON con las respuestas si quisiéramos detalle futuro
    },
    { onConflict: "quiz_id, user_id" }
  );

  if (error) {
    console.error("Error guardando quiz:", error);
    throw new Error("No se pudo guardar tu resultado");
  }

  revalidatePath(`/quiz/${quizId}`); // Refrescar para mostrar nuevas stats si existen
  return { success: true };
}

