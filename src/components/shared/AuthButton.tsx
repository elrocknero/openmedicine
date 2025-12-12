"use client";

import { createClient } from "@/utils/supabase/client";

export function AuthButton() {
  const handleLogin = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Error al iniciar sesión:", error);
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center xl:w-[90%] xl:h-auto xl:px-8 xl:py-3 font-bold mt-2 hover:bg-opacity-90 transition-opacity shadow-md"
    >
      <span className="hidden xl:block text-[17px]">Entrar con Google</span>
      <span className="xl:hidden text-[17px]">G</span>
    </button>
  );
}

