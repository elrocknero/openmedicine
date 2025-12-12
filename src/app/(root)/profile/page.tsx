import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfileRedirect() {
  const supabase = await createClient();

  // Obtener sesión del usuario
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si no hay usuario, redirigir al home
  if (!user) {
    redirect("/");
  }

  // Obtener el username del perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  // Si no tiene perfil o username, redirigir al home
  if (!profile || !profile.username) {
    redirect("/");
  }

  // Redirigir a la página dinámica del perfil
  redirect(`/profile/${profile.username}`);
}

