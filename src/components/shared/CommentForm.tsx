"use client";

import { useState, useRef, useEffect } from "react";
import { addComment } from "@/lib/actions/comment.actions";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, FileImage, Smile, Calendar } from "lucide-react";

interface CommentFormProps {
  postId: string;
  userAvatar?: string | null;
  userName?: string | null;
}

export function CommentForm({ postId, userAvatar, userName }: CommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-ajustar altura del textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // TODO: Subir a Supabase Storage y obtener URL
      // Por ahora, solo preview
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(postId, content, mediaUrl || undefined);
      setContent("");
      setMediaUrl(null);
      setMediaPreview(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      router.refresh();
    } catch (error) {
      console.error("Error al comentar:", error);
      alert("Error al publicar el comentario. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = userName || "Usuario";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <form onSubmit={handleSubmit} className="flex gap-4">
      {/* Avatar Izquierda */}
      <div className="flex-shrink-0">
        <Avatar className="w-10 h-10">
          <AvatarImage src={userAvatar || undefined} alt={displayName} />
          <AvatarFallback className="bg-neutral-800">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Contenido Derecha */}
      <div className="flex flex-col flex-1">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Postea tu respuesta"
          className="w-full bg-transparent border-none text-white placeholder-[#71767b] resize-none focus:outline-none text-[20px] min-h-[60px]"
          rows={1}
        />

        {/* Preview de Imagen */}
        {mediaPreview && (
          <div className="relative mt-3 rounded-2xl overflow-hidden border border-[#2f3336]">
            <img
              src={mediaPreview}
              alt="Preview"
              className="w-full max-h-[400px] object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setMediaPreview(null);
                setMediaUrl(null);
              }}
              className="absolute top-2 left-2 bg-black/70 hover:bg-black/90 rounded-full p-2 text-white transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Separador si hay contenido expandido */}
        {(content.trim() || mediaPreview) && (
          <div className="border-b border-[#2f3336] my-2" />
        )}

        {/* Barra de Herramientas */}
        <div className="flex justify-between items-center mt-2">
          {/* Iconos Izquierda */}
          <div className="flex items-center gap-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleImageSelect}
              className="text-neutral-500 w-5 h-5 cursor-pointer hover:bg-white/10 hover:text-white rounded-full p-2 box-content transition-colors"
            >
              <Image className="w-5 h-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => alert("Próximamente")}
              className="text-neutral-500 w-5 h-5 cursor-pointer hover:bg-white/10 hover:text-white rounded-full p-2 box-content transition-colors"
            >
              <FileImage className="w-5 h-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => alert("Próximamente")}
              className="text-neutral-500 w-5 h-5 cursor-pointer hover:bg-white/10 hover:text-white rounded-full p-2 box-content transition-colors"
            >
              <Smile className="w-5 h-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => alert("Próximamente")}
              className="text-neutral-500 w-5 h-5 cursor-pointer hover:bg-white/10 hover:text-white rounded-full p-2 box-content transition-colors"
            >
              <Calendar className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>

          {/* Botón Derecha */}
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="bg-white text-black font-bold rounded-full px-4 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-200 transition-colors"
          >
            {isSubmitting ? "Publicando..." : "Responder"}
          </button>
        </div>
      </div>
    </form>
  );
}

