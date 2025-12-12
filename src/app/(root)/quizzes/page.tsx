import { createClient } from "@/utils/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default async function QuizzesPage() {
  const supabase = await createClient();

  // Obtener usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="max-w-4xl mx-auto min-h-screen flex flex-col justify-center p-6 bg-black">
        <div className="text-center space-y-4 border border-[#2f3336] rounded-2xl p-8 bg-[#16181c]">
          <p className="text-xl font-bold text-white mb-2">
            Inicia sesión para ver tus quizzes
          </p>
          <p className="text-x-gray text-sm">
            Necesitas estar logueado para acceder a esta sección.
          </p>
        </div>
      </main>
    );
  }

  // Tab 1: Mis Creaciones (Quizes que yo creé)
  const { data: myQuizzes } = await supabase
    .from("quizzes")
    .select(
      `
      *,
      posts (
        id,
        content,
        created_at,
        user_id
      )
    `
    );

  // Filtrar solo los quizes donde el post.user_id es el usuario actual
  const filteredQuizzes =
    myQuizzes?.filter(
      (quiz) => (quiz.posts as any)?.user_id === user.id
    ) || [];

  // Calcular métricas para cada quiz
  const quizzesWithStats = await Promise.all(
    filteredQuizzes.map(async (quiz) => {
      const { data: submissions } = await supabase
        .from("quiz_submissions")
        .select("score")
        .eq("quiz_id", quiz.id);

      const totalAttempts = submissions?.length || 0;
      const totalScore =
        submissions?.reduce((sum, s) => sum + (s.score || 0), 0) || 0;
      const averageScore =
        totalAttempts > 0 ? totalScore / totalAttempts : 0;

      return {
        ...quiz,
        totalAttempts,
        averageScore: Math.round(averageScore * 10) / 10,
      };
    })
  );

  // Tab 2: Mi Historial (Quizes que yo respondí)
  const { data: mySubmissions } = await supabase
    .from("quiz_submissions")
    .select(
      `
      *,
      quizzes (
        id,
        posts (
          content,
          created_at
        )
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-4xl mx-auto min-h-screen p-6 bg-black">
      <h1 className="text-3xl font-bold text-white mb-8">Biblioteca de Quizzes</h1>

      <Tabs defaultValue="creations" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#16181c] border border-[#2f3336]">
          <TabsTrigger
            value="creations"
            className="data-[state=active]:bg-white data-[state=active]:text-black text-white"
          >
            Mis Creaciones
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-white data-[state=active]:text-black text-white"
          >
            Mi Historial
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Mis Creaciones */}
        <TabsContent value="creations" className="mt-6">
          {quizzesWithStats.length === 0 ? (
            <div className="text-center py-16 border border-[#2f3336] rounded-2xl bg-[#16181c]">
              <p className="text-xl font-semibold text-white mb-2">
                Aún no has creado ningún quiz
              </p>
              <p className="text-x-gray text-sm">
                ¡Sube tu primer apunte y genera un quiz con IA!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quizzesWithStats.map((quiz) => {
                const post = quiz.posts as any;
                const postId = post?.id || "";
                const quizId = quiz.id;

                return (
                  <div
                    key={quiz.id}
                    className="border border-[#2f3336] rounded-2xl p-6 bg-[#16181c] hover:bg-[#1a1c20] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {post?.content || "Quiz sin título"}
                        </h3>
                        <p className="text-xs text-x-gray">
                          {new Date(post?.created_at || "").toLocaleDateString(
                            "es-ES",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <Link
                        href={`/quiz/${postId}`}
                        className="text-white text-sm hover:underline"
                      >
                        Ver Quiz →
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#2f3336]">
                      <div>
                        <p className="text-xs text-x-gray mb-1">Intentos</p>
                        <p className="text-lg font-bold text-white">
                          {quiz.totalAttempts} estudiantes
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-x-gray mb-1">Promedio</p>
                        <p className="text-lg font-bold text-white">
                          Nota media: {quiz.averageScore.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Mi Historial */}
        <TabsContent value="history" className="mt-6">
          {!mySubmissions || mySubmissions.length === 0 ? (
            <div className="text-center py-16 border border-[#2f3336] rounded-2xl bg-[#16181c]">
              <p className="text-xl font-semibold text-white mb-2">
                Aún no has respondido ningún quiz
              </p>
              <p className="text-x-gray text-sm">
                Explora el feed y encuentra quizes interesantes para practicar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mySubmissions.map((submission: any) => {
                const quiz = submission.quizzes;
                const post = quiz?.posts;
                const postId = post?.id || "";
                const totalQuestions =
                  (quiz?.data as any)?.questions?.length || 5;
                const score = submission.score || 0;
                const percentage = Math.round((score / totalQuestions) * 100);

                return (
                  <div
                    key={submission.id}
                    className="border border-[#2f3336] rounded-2xl p-6 bg-[#16181c] hover:bg-[#1a1c20] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {post?.content || "Quiz sin título"}
                        </h3>
                        <p className="text-sm text-x-gray mb-2">
                          Hiciste este quiz el{" "}
                          {new Date(submission.created_at).toLocaleDateString(
                            "es-ES",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </p>
                        <p className="text-lg font-bold text-white">
                          Tu Nota: {score}/{totalQuestions} ({percentage}%)
                        </p>
                      </div>
                      <Link
                        href={`/quiz/${postId}`}
                        className="bg-white text-black rounded-full px-4 py-2 text-sm font-bold hover:bg-[#eff3f4] transition-colors"
                      >
                        Reintentar
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}

