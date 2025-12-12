"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updateProfile } from "@/lib/actions/profile.actions";
import { X } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  username: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  avatar_url: string | null;
  banner_url: string | null;
}

interface EditProfileModalProps {
  profile: Profile;
}

export function EditProfileModal({ profile }: EditProfileModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile.full_name || "",
    bio: profile.bio || "",
    location: profile.location || "",
    website: profile.website || "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile.avatar_url
  );
  const [bannerPreview, setBannerPreview] = useState<string | null>(
    profile.banner_url
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("full_name", formData.full_name || "");
      formDataToSend.append("bio", formData.bio || "");
      formDataToSend.append("location", formData.location || "");
      formDataToSend.append("website", formData.website || "");
      
      // Verificar que los archivos sean válidos antes de enviarlos
      if (avatarFile && avatarFile instanceof File && avatarFile.size > 0) {
        // Validar tamaño (máximo 5MB)
        if (avatarFile.size > 5 * 1024 * 1024) {
          alert("La imagen del avatar no puede ser mayor a 5MB");
          setIsSubmitting(false);
          return;
        }
        formDataToSend.append("avatar", avatarFile);
      }
      
      if (bannerFile && bannerFile instanceof File && bannerFile.size > 0) {
        // Validar tamaño (máximo 10MB)
        if (bannerFile.size > 10 * 1024 * 1024) {
          alert("La imagen del banner no puede ser mayor a 10MB");
          setIsSubmitting(false);
          return;
        }
        formDataToSend.append("banner", bannerFile);
      }

      await updateProfile(formDataToSend);
      setOpen(false);
      // Usar router.refresh() en lugar de window.location.reload() para mejor UX
      window.location.reload();
    } catch (error: any) {
      console.error("Error actualizando perfil:", error);
      const errorMessage =
        error?.message || "Error al actualizar el perfil. Intenta nuevamente.";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="px-4 py-2 border border-[#536471] text-white rounded-full font-bold text-sm hover:bg-white/10 transition-colors">
          Editar Perfil
        </button>
      </DialogTrigger>
      <DialogContent className="bg-black border-[#2f3336] sm:max-w-[600px] p-0 gap-0 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2f3336] sticky top-0 bg-black z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setOpen(false)}
              className="text-white hover:bg-white/10 rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white">Editar Perfil</h2>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-white text-black rounded-full px-4 py-2 font-bold text-sm hover:bg-[#eff3f4] disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Banner */}
          <div className="relative -mx-6 -mt-6">
            <div
              className="h-[200px] bg-[#333639] overflow-hidden"
              style={
                bannerPreview
                  ? {
                      backgroundImage: `url(${bannerPreview})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : {}
              }
            >
              <label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                />
                <span className="text-white font-semibold">Cambiar banner</span>
              </label>
            </div>
          </div>

          {/* Avatar */}
          <div className="relative -mt-16 ml-4 inline-block">
            <div className="w-[134px] h-[134px] rounded-full border-4 border-black overflow-hidden bg-black">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#333639] flex items-center justify-center text-white text-3xl font-bold">
                  {formData.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "U"}
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-black border-2 border-white rounded-full p-2 cursor-pointer hover:bg-[#333639] transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </label>
          </div>

          {/* Campos del formulario */}
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-white font-semibold mb-2">
                Nombre
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                maxLength={50}
                className="w-full bg-black border border-[#2f3336] rounded-lg px-4 py-3 text-white placeholder-[#71767b] focus:outline-none focus:border-[#1d9bf0]"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                maxLength={160}
                rows={4}
                className="w-full bg-black border border-[#2f3336] rounded-lg px-4 py-3 text-white placeholder-[#71767b] focus:outline-none focus:border-[#1d9bf0] resize-none"
                placeholder="Cuéntanos sobre ti..."
              />
              <p className="text-[#71767b] text-sm mt-1 text-right">
                {formData.bio.length}/160
              </p>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Ubicación
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                maxLength={30}
                className="w-full bg-black border border-[#2f3336] rounded-lg px-4 py-3 text-white placeholder-[#71767b] focus:outline-none focus:border-[#1d9bf0]"
                placeholder="Ciudad, País"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Sitio Web
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                maxLength={100}
                className="w-full bg-black border border-[#2f3336] rounded-lg px-4 py-3 text-white placeholder-[#71767b] focus:outline-none focus:border-[#1d9bf0]"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

