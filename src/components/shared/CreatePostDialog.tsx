"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Image,
  FileText,
  Upload,
  X,
  Smile,
  BarChart2,
  MapPin,
  Globe,
  ChevronDown,
  Plus,
  List,
  CalendarClock,
  Loader2,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { createClient } from "@/utils/supabase/client";
import { createPost, createQuizPost } from "@/lib/actions/post.actions";

interface CreatePostDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreatePostDialog({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreatePostDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Usar estado controlado si se proporciona, sino usar estado interno
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;
  const [postType, setPostType] = useState<"post" | "quiz">("post");
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [discussionContent, setDiscussionContent] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [quizFile, setQuizFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [isDragging, setIsDragging] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Nuevos estados para funcionalidades avanzadas
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [location, setLocation] = useState("");
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollDuration, setPollDuration] = useState({ days: 1, hours: 0, minutes: 0 });

  // Obtener usuario actual
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    if (open) {
      fetchUser();
    }
  }, [open]);

  // Auto-expand textarea (mínimo 2 filas, máximo razonable)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      // Mínimo de 2 filas, máximo de ~20 filas para evitar que crezca demasiado
      const minHeight = 48; // ~2 filas
      const maxHeight = 480; // ~20 filas
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
    }
  }, [discussionContent]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowModeDropdown(false);
      }
    };

    if (showModeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModeDropdown]);

  // Manejar selección de imagen
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      // Si se selecciona imagen, ocultar encuesta (mutuamente exclusivo)
      setShowPoll(false);
      setPollOptions(["", ""]);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find((file) => file.type === "application/pdf");

    if (pdfFile) {
      setQuizFile(pdfFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación según el modo
    if (postType === "quiz") {
      // Solo aceptar PDFs en modo Quiz
      if (file.type === "application/pdf") {
        setQuizFile(file);
      } else {
        alert("Por favor, selecciona un archivo PDF");
      }
    } else {
      // En modo Post, solo aceptar imágenes
      if (file.type.startsWith("image/")) {
        setSelectedImage(file);
        // Si se selecciona imagen, ocultar encuesta
        setShowPoll(false);
        setPollOptions(["", ""]);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        alert("Por favor, selecciona una imagen");
      }
    }
  };

  // Manejar emoji
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    setDiscussionContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Función para geocodificación inversa (obtener ciudad, país desde coordenadas)
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'OpenMedicine/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data.address) {
        const city = data.address.city || data.address.town || data.address.village || data.address.municipality || '';
        const country = data.address.country || '';
        if (city && country) {
          return `${city}, ${country}`;
        } else if (city) {
          return city;
        } else if (country) {
          return country;
        }
      }
      return "Mi ubicación actual";
    } catch (error) {
      console.error("Error en geocodificación inversa:", error);
      return "Mi ubicación actual";
    }
  };

  // Manejar geolocalización
  const handleLocationClick = () => {
    if (isLocating) return;

    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationCoords({ lat: latitude, lng: longitude });
        
        // Intentar obtener nombre de la ubicación
        const locationName = await reverseGeocode(latitude, longitude);
        setLocation(locationName);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        let errorMessage = "Error al obtener tu ubicación";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permiso de ubicación denegado. Por favor, permite el acceso a tu ubicación en la configuración del navegador.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Información de ubicación no disponible.";
            break;
          case error.TIMEOUT:
            errorMessage = "Tiempo de espera agotado al obtener la ubicación.";
            break;
        }
        
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Manejar encuesta
  const handlePollToggle = () => {
    if (showPoll) {
      // Desactivar encuesta
      setShowPoll(false);
      setPollOptions(["", ""]);
      setPollDuration({ days: 1, hours: 0, minutes: 0 });
    } else {
      // Activar encuesta (ocultar imagen)
      setShowPoll(true);
      setSelectedImage(null);
      setImagePreview(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = pollOptions.filter((_, i) => i !== index);
      setPollOptions(newOptions);
    }
  };

  const canPublish = () => {
    if (postType === "quiz") {
      return quizFile !== null;
    }
    if (showPoll) {
      // Validar que haya al menos 2 opciones con texto
      const validOptions = pollOptions.filter((opt) => opt.trim().length > 0);
      return validOptions.length >= 2 && discussionContent.trim().length > 0;
    }
    return discussionContent.trim().length > 0;
  };

  const handlePublish = async () => {
    if (!canPublish() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (postType === "quiz") {
        // Modo Quiz: Procesar PDF con IA
        if (!quizFile) {
          alert("Por favor, selecciona un archivo PDF");
          setIsSubmitting(false);
          return;
        }

        if (quizFile.type !== "application/pdf") {
          alert("El archivo debe ser un PDF");
          setIsSubmitting(false);
          return;
        }

        alert("Generando Quiz con IA... esto puede tardar unos segundos");

        const formData = new FormData();
        formData.append("content", discussionContent || "");
        formData.append("file", quizFile);

        const result = await createQuizPost(formData);

        if (result.error) {
          alert(result.error);
          setIsSubmitting(false);
          return;
        }

        // Reset y cerrar
        setDiscussionContent("");
        setQuizFile(null);
        setPostType("post");
        onOpenChange(false);
      } else {
        // Modo Post: Subir imagen si existe
        let mediaUrl: string | null = null;

        if (selectedImage) {
          try {
            const supabase = createClient();
            const {
              data: { user: currentUser },
            } = await supabase.auth.getUser();

            if (!currentUser) throw new Error("Usuario no autenticado");

            const fileExt = selectedImage.name.split(".").pop();
            const fileName = `${currentUser.id}/${Date.now()}_${selectedImage.name}`;

            const arrayBuffer = await selectedImage.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const { error: uploadError } = await supabase.storage
              .from("posts")
              .upload(fileName, buffer, {
                contentType: selectedImage.type,
                upsert: true,
              });

            if (uploadError) {
              throw new Error("Error al subir la imagen");
            }

            const {
              data: { publicUrl },
            } = supabase.storage.from("posts").getPublicUrl(fileName);
            mediaUrl = publicUrl;
          } catch (error: any) {
            console.error("Error subiendo imagen:", error);
            alert("Error al subir la imagen. Intenta nuevamente.");
            setIsSubmitting(false);
            return;
          }
        }

        // Determinar tipo de post
        let postTypeValue: "text" | "image" | "poll" = "text";
        if (showPoll) {
          postTypeValue = "poll";
        } else if (mediaUrl) {
          postTypeValue = "image";
        }

        await createPost(
          discussionContent || "",
          mediaUrl,
          postTypeValue,
          location.trim() || undefined,
          showPoll ? pollOptions.filter((opt) => opt.trim().length > 0) : undefined
        );

        // Reset y cerrar
        setDiscussionContent("");
        setSelectedImage(null);
        setImagePreview(null);
        setLocation("");
        setShowLocationInput(false);
        setShowPoll(false);
        setPollOptions(["", ""]);
        setPollDuration({ days: 1, hours: 0, minutes: 0 });
        setPostType("post");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error al publicar:", error);
      alert("Error al publicar. Por favor, intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="bg-black border-[#2f3336] text-white p-0 gap-0 sm:max-w-[600px] [&>button]:hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-3">
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-full hover:bg-[#181818] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <button className="text-white font-bold text-sm hover:underline">
            Borradores
          </button>
        </div>

        {/* Cuerpo - Grid Layout */}
        <div className="grid grid-cols-[48px_1fr] gap-3 p-4 pb-2">
          {/* Columna 1: Avatar */}
          <div>
            <Avatar className="w-10 h-10 rounded-full">
              <AvatarImage
                src={user?.user_metadata?.avatar_url}
                alt={user?.user_metadata?.full_name || "Usuario"}
              />
              <AvatarFallback className="bg-neutral-800">
                {user?.user_metadata?.full_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Columna 2: Composer */}
          <div className="space-y-2">
            {/* Fila 1: Selector de Modo */}
            <div className="flex mb-2">
              <div className="relative" ref={dropdownRef}>
                 <button
                   onClick={() => setShowModeDropdown(!showModeDropdown)}
                   className="border border-white text-white rounded-full px-3 py-1 text-sm font-bold flex items-center gap-1 cursor-pointer hover:bg-white/10 transition-colors"
                 >
                  {postType === "quiz" ? "Quiz IA" : "Publicación"}
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Dropdown Menu */}
                {showModeDropdown && (
                  <div className="absolute top-full left-0 mt-2 bg-black border border-[#2f3336] rounded-lg shadow-lg z-10 min-w-[150px]">
                    <button
                      onClick={() => {
                        setPostType("post");
                        setShowModeDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#181818] transition-colors ${
                        postType === "post" ? "text-white font-semibold" : "text-[#71767b]"
                      }`}
                    >
                      Publicación
                    </button>
                    <button
                      onClick={() => {
                        setPostType("quiz");
                        setShowModeDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#181818] transition-colors ${
                        postType === "quiz" ? "text-white font-semibold" : "text-[#71767b]"
                      }`}
                    >
                      Quiz IA
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Fila 2: Input - Fluido y compacto */}
            <Textarea
              ref={textareaRef}
              placeholder={postType === "quiz" ? "Describe el tema del Quiz..." : "¿Qué está pasando?!"}
              value={discussionContent}
              onChange={(e) => setDiscussionContent(e.target.value)}
              rows={2}
              className="bg-transparent border-none text-xl text-white placeholder:text-neutral-500 w-full resize-none focus-visible:ring-0 p-2"
            />

            {/* Badge de Ubicación (si hay ubicación) */}
            {location && (
              <div className="mt-2">
                <div className="inline-flex items-center gap-1.5 bg-white/5 rounded-full py-1 px-3 w-fit">
                  <span className="text-xs">📍</span>
                  <span className="text-xs text-neutral-400">{location}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLocation("");
                      setLocationCoords(null);
                      setShowLocationInput(false);
                    }}
                    className="ml-1 p-0.5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3 text-neutral-400 hover:text-white" />
                  </button>
                </div>
              </div>
            )}

            {/* Input de Ubicación Manual (solo si se activa manualmente sin ubicación) */}
            {showLocationInput && !location && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="📍 Añadir ubicación"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-transparent border border-[#2f3336] rounded-lg px-4 py-2 text-white placeholder:text-[#71767b] focus:outline-none focus:border-white/50"
                />
              </div>
            )}

            {/* Opciones de Encuesta */}
            {showPoll && (
              <div className="mt-2 space-y-4 border border-neutral-800 rounded-lg p-4">
                {/* Inputs de Opciones */}
                <div className="space-y-3">
                  {pollOptions.map((option, index) => (
                    <div key={index} className="relative">
                      <input
                        type="text"
                        placeholder={`Opción ${index + 1}`}
                        value={option}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                        maxLength={25}
                        className="w-full bg-transparent border border-neutral-800 rounded-md px-4 py-3 text-white placeholder:text-[#71767b] focus:outline-none focus:border-white transition-colors pr-16"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#71767b] text-sm">
                        {option.length}/25
                      </span>
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removePollOption(index)}
                          className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 text-[#71767b] hover:text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Botón Añadir Opción */}
                {pollOptions.length < 4 && (
                  <button
                    type="button"
                    onClick={addPollOption}
                    className="w-full flex items-center justify-center gap-2 text-white hover:text-neutral-300 transition-colors text-sm py-2 border border-neutral-800 rounded-md hover:bg-white/5"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir opción
                  </button>
                )}

                {/* Selectores de Tiempo */}
                <div className="border-t border-neutral-800 pt-4 mt-4">
                  <label className="block text-white text-sm font-medium mb-3">
                    Duración de la encuesta
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-[#71767b] text-xs mb-1">Días</label>
                      <input
                        type="number"
                        min="0"
                        max="7"
                        value={pollDuration.days}
                        onChange={(e) => setPollDuration({ ...pollDuration, days: parseInt(e.target.value) || 0 })}
                        className="w-full bg-transparent border border-neutral-800 rounded-md px-3 py-2 text-white focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[#71767b] text-xs mb-1">Horas</label>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={pollDuration.hours}
                        onChange={(e) => setPollDuration({ ...pollDuration, hours: parseInt(e.target.value) || 0 })}
                        className="w-full bg-transparent border border-neutral-800 rounded-md px-3 py-2 text-white focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[#71767b] text-xs mb-1">Minutos</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={pollDuration.minutes}
                        onChange={(e) => setPollDuration({ ...pollDuration, minutes: parseInt(e.target.value) || 0 })}
                        className="w-full bg-transparent border border-neutral-800 rounded-md px-3 py-2 text-white focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Botón Eliminar Encuesta */}
                <button
                  type="button"
                  onClick={() => {
                    setShowPoll(false);
                    setPollOptions(["", ""]);
                    setPollDuration({ days: 1, hours: 0, minutes: 0 });
                  }}
                  className="w-full text-center text-red-500 hover:bg-red-500/10 transition-colors py-2 rounded-md mt-4"
                >
                  Eliminar encuesta
                </button>
              </div>
            )}

            {/* Fila 3: Preview/Dropzone */}
            {postType === "post" ? (
              /* Preview de Imagen - Completa y centrada */
              imagePreview && (
                <div className="relative w-full mt-2 max-h-[300px] rounded-2xl overflow-hidden bg-neutral-900/50 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-[300px] w-auto h-auto object-contain rounded-2xl mx-auto"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 bg-black/80 rounded-full hover:bg-black transition-colors z-10"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )
            ) : (
              /* Quiz IA: Drag & Drop Area */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed border-[#2f3336] rounded-xl p-8 text-center text-[#71767b] transition-colors mt-3
                  ${
                    isDragging
                      ? "border-[#2f3336]/50 bg-white/5"
                      : "bg-transparent"
                  }
                  ${quizFile ? "border-[#2f3336]/30 bg-white/5" : ""}
                `}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  {quizFile ? (
                    <div className="space-y-2">
                      <FileText className="w-12 h-12 mx-auto text-white" />
                      <p className="text-white font-medium">{quizFile.name}</p>
                      <p className="text-sm text-[#71767b]">
                        {(quizFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuizFile(null);
                        }}
                        className="text-[#71767b] hover:text-white text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 mx-auto text-[#71767b]" />
                      <p className="text-white font-medium">Sube un PDF (Papers, Apuntes)</p>
                      <p className="text-sm text-[#71767b]">
                        Generaremos preguntas automáticamente.
                      </p>
                    </div>
                  )}
                </label>
              </div>
            )}

          </div>
        </div>

        {/* Barra de Herramientas Estilo X - Debajo del contenido */}
        <div className="px-4 pb-3 border-b border-[#2f3336]">
          <div className="flex items-center gap-1">
            {/* Image */}
            {!showPoll && (
              <label className="cursor-pointer">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <div className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <Image className="w-5 h-5 text-white" />
                </div>
              </label>
            )}

            {/* List (Encuesta) */}
            <div
              className={`p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer ${
                showPoll ? "bg-white/10" : ""
              }`}
              onClick={handlePollToggle}
            >
              <List className="w-5 h-5 text-white" />
            </div>

            {/* Emoji */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <div className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
                  <Smile className="w-5 h-5 text-white" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="bg-black border-[#2f3336] p-0 w-auto">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme={"dark" as any}
                  width={350}
                />
              </PopoverContent>
            </Popover>

            {/* CalendarClock (Programación) */}
            <div
              className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => alert("Próximamente")}
            >
              <CalendarClock className="w-5 h-5 text-white" />
            </div>

            {/* MapPin (Ubicación) */}
            <div
              className={`p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer ${
                location ? "bg-white/10" : ""
              } ${isLocating ? "cursor-wait" : ""}`}
              onClick={handleLocationClick}
            >
              {isLocating ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <MapPin className="w-5 h-5 text-white" />
              )}
            </div>
          </div>
        </div>

        {/* Footer con Permisos y Botón Postear */}
        <div className="p-3 flex justify-between items-center">
          {/* Izquierda: Permisos */}
          <button className="flex items-center gap-2 text-neutral-500 font-normal text-sm hover:underline">
            <Globe className="w-4 h-4 text-neutral-500" />
            <span>Cualquiera puede responder</span>
          </button>

          {/* Derecha: Botón Postear Blanco */}
          <button
            onClick={handlePublish}
            disabled={!canPublish() || isSubmitting}
            className={`
              bg-white text-black font-bold rounded-full px-5 py-1.5 transition-colors
              ${
                canPublish()
                  ? "hover:bg-neutral-200"
                  : "opacity-50 cursor-not-allowed"
              }
            `}
          >
            {isSubmitting
              ? postType === "quiz"
                ? "Procesando..."
                : "Publicando..."
              : "Postear"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
