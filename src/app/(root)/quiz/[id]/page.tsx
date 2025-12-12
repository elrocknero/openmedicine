import { createClient } from "@/utils/supabase/server";
import { QuizPlayer } from "@/components/shared/QuizPlayer";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QuizPage({ params }: PageProps) {
  const supabase = await createClient();
  
  // Obtener Usuario Actual
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  // Async Params - Next.js 16
  const { id } = await params;
  
  // Depuración
  console.log("Buscando quiz para post:", id);

  // Consulta Robusta - Explícita con la relación de llave foránea
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select(`
      *,
      posts (
        content,
        user_id,
        profiles!posts_user_id_fkey (
          full_name,
          avatar_url
        )
      )
    `)
    .eq("post_id", id)
    .maybeSingle(); // Usa maybeSingle en lugar de single para no lanzar excepción

  // Manejo de Errores - Mostrar estilizado
  if (error) {
    console.error("Error consultando quiz:", error);
    return (
      <main className="max-w-2xl mx-auto min-h-screen flex flex-col justify-center p-6 bg-black">
        <div className="text-center space-y-4 border border-[#2f3336] rounded-2xl p-8 bg-[#16181c]">
          <p className="text-xl font-bold text-white mb-2">Error al cargar el quiz</p>
          <p className="text-x-gray text-sm">
            {error.message || "No se pudo conectar con la base de datos."}
          </p>
          <p className="text-x-gray text-xs mt-4">
            Post ID: {id}
          </p>
        </div>
      </main>
    );
  }

  if (!quiz) {
    console.log("No se encontró quiz para post:", id);
    return (
      <main className="max-w-2xl mx-auto min-h-screen flex flex-col justify-center p-6 bg-black">
        <div className="text-center space-y-4 border border-[#2f3336] rounded-2xl p-8 bg-[#16181c]">
          <p className="text-xl font-bold text-white mb-2">Quiz no encontrado</p>
          <p className="text-x-gray text-sm">
            No existe un quiz asociado a este post.
          </p>
          <p className="text-x-gray text-xs mt-4">
            Post ID: {id}
          </p>
        </div>
      </main>
    );
  }

  // Validar que el quiz tenga datos
  if (!quiz.data || typeof quiz.data !== "object") {
    console.log("Quiz encontrado pero sin datos válidos:", quiz);
    return (
      <main className="max-w-2xl mx-auto min-h-screen flex flex-col justify-center p-6 bg-black">
        <div className="text-center space-y-4 border border-[#2f3336] rounded-2xl p-8 bg-[#16181c]">
          <p className="text-xl font-bold text-white mb-2">Quiz inválido</p>
          <p className="text-x-gray text-sm">
            El quiz no tiene datos válidos para mostrar.
          </p>
        </div>
      </main>
    );
  }

  // Éxito - Obtener el nombre del autor y el ID del quiz
  const authorName =
    (quiz.posts as any)?.profiles?.full_name || "Usuario";
  const quizId = quiz.id; // ID del quiz para guardar el resultado
  const userId = user?.id || null;

  console.log("Quiz encontrado exitosamente para post:", id);

  return (
    <main className="max-w-2xl mx-auto min-h-screen flex flex-col justify-center p-6 bg-black">
      <QuizPlayer
        quizData={quiz.data as any}
        authorName={authorName}
        quizId={quizId}
        userId={userId}
      />
    </main>
  );
}
