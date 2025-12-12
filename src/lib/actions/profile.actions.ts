"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  // 1. Verificar usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión para actualizar tu perfil");
  }

  // 2. Extraer datos del FormData
  const full_name = formData.get("full_name") as string;
  const bio = formData.get("bio") as string;
  const location = formData.get("location") as string;
  const website = formData.get("website") as string;
  const avatarFile = formData.get("avatar") as File | null;
  const bannerFile = formData.get("banner") as File | null;

  // 3. Obtener username para revalidar la ruta correcta
  const { data: profileData } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const username = profileData?.username;

  let avatarUrl: string | null = null;
  let bannerUrl: string | null = null;

  // 4. Subir avatar si se proporcionó
  if (avatarFile && avatarFile instanceof File && avatarFile.size > 0) {
    try {
      // Validar que sea una imagen
      if (!avatarFile.type.startsWith("image/")) {
        throw new Error("El archivo debe ser una imagen");
      }

      // Generar nombre único
      const avatarExt = avatarFile.name.split(".").pop() || "jpg";
      const avatarFileName = `${user.id}/avatar_${Date.now()}.${avatarExt}`;

      // Convertir a Buffer
      const arrayBuffer = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Subir a Supabase Storage (usar bucket 'profiles' o 'avatars' según configuración)
      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(avatarFileName, buffer, {
          upsert: true,
          contentType: avatarFile.type,
          cacheControl: "3600",
        });

      if (uploadError) {
        console.error("Error detallado subiendo avatar:", uploadError);
        // Intentar con bucket 'avatars' si 'profiles' falla
        const { error: fallbackError } = await supabase.storage
          .from("avatars")
          .upload(avatarFileName, buffer, {
            upsert: true,
            contentType: avatarFile.type,
            cacheControl: "3600",
          });

        if (fallbackError) {
          throw new Error(
            `Error al subir el avatar: ${fallbackError.message || "Error desconocido"}`
          );
        }

        // Obtener URL pública del bucket 'avatars'
        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(avatarFileName);
        avatarUrl = publicUrl;
      } else {
        // Obtener URL pública del bucket 'profiles'
        const {
          data: { publicUrl },
        } = supabase.storage.from("profiles").getPublicUrl(avatarFileName);
        avatarUrl = publicUrl;
      }
    } catch (error: any) {
      console.error("Error procesando avatar:", error);
      throw new Error(error.message || "Error al subir el avatar");
    }
  }

  // 5. Subir banner si se proporcionó
  if (bannerFile && bannerFile instanceof File && bannerFile.size > 0) {
    try {
      // Validar que sea una imagen
      if (!bannerFile.type.startsWith("image/")) {
        throw new Error("El archivo debe ser una imagen");
      }

      // Generar nombre único
      const bannerExt = bannerFile.name.split(".").pop() || "jpg";
      const bannerFileName = `${user.id}/banner_${Date.now()}.${bannerExt}`;

      // Convertir a Buffer
      const arrayBuffer = await bannerFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(bannerFileName, buffer, {
          upsert: true,
          contentType: bannerFile.type,
          cacheControl: "3600",
        });

      if (uploadError) {
        console.error("Error detallado subiendo banner:", uploadError);
        // Intentar con bucket 'banners' si 'profiles' falla
        const { error: fallbackError } = await supabase.storage
          .from("banners")
          .upload(bannerFileName, buffer, {
            upsert: true,
            contentType: bannerFile.type,
            cacheControl: "3600",
          });

        if (fallbackError) {
          throw new Error(
            `Error al subir el banner: ${fallbackError.message || "Error desconocido"}`
          );
        }

        // Obtener URL pública del bucket 'banners'
        const {
          data: { publicUrl },
        } = supabase.storage.from("banners").getPublicUrl(bannerFileName);
        bannerUrl = publicUrl;
      } else {
        // Obtener URL pública del bucket 'profiles'
        const {
          data: { publicUrl },
        } = supabase.storage.from("profiles").getPublicUrl(bannerFileName);
        bannerUrl = publicUrl;
      }
    } catch (error: any) {
      console.error("Error procesando banner:", error);
      throw new Error(error.message || "Error al subir el banner");
    }
  }

  // 6. Preparar datos de actualización
  const updateData: any = {
    full_name: full_name?.trim() || null,
    bio: bio?.trim() || null,
    location: location?.trim() || null,
    website: website?.trim() || null,
  };

  if (avatarUrl) {
    updateData.avatar_url = avatarUrl;
  }

  if (bannerUrl) {
    updateData.banner_url = bannerUrl;
  }

  // 7. Actualizar perfil en la base de datos
  const { error: updateError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id);

  if (updateError) {
    console.error("Error actualizando perfil:", updateError);
    throw new Error(
      `Error al actualizar el perfil: ${updateError.message || "Error desconocido"}`
    );
  }

  // 8. Revalidar las rutas
  if (username) {
    revalidatePath(`/profile/${username}`);
  }
  revalidatePath(`/profile/[username]`, "page");
  revalidatePath("/");

  return { success: true };
}

