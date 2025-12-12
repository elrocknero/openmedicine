"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { SuggestedUser, TrendingHashtag } from "@/lib/actions/sidebar.actions";
import Link from "next/link";

// Componente SearchFilters
function SearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derivar directamente de searchParams en lugar de estado sincronizado
  const contentTypeFilter = searchParams.get("type") || "all";
  const peopleFilter = searchParams.get("people") || "anyone";
  const locationFilter = searchParams.get("location") || "anywhere";

  const [localContentTypeFilter, setLocalContentTypeFilter] = useState(contentTypeFilter);
  const [localPeopleFilter, setLocalPeopleFilter] = useState(peopleFilter);
  const [localLocationFilter, setLocalLocationFilter] = useState(locationFilter);

  // Actualizar estado local cuando cambien los search params
  useEffect(() => {
    const newType = searchParams.get("type") || "all";
    const newPeople = searchParams.get("people") || "anyone";
    const newLocation = searchParams.get("location") || "anywhere";
    
    if (newType !== localContentTypeFilter) setLocalContentTypeFilter(newType);
    if (newPeople !== localPeopleFilter) setLocalPeopleFilter(newPeople);
    if (newLocation !== localLocationFilter) setLocalLocationFilter(newLocation);
  }, [searchParams, localContentTypeFilter, localPeopleFilter, localLocationFilter]);

  // Función para actualizar los parámetros de URL
  const updateSearchParams = (
    type?: string,
    people?: string,
    location?: string
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    if (type !== undefined) {
      if (type === "all") {
        params.delete("type");
      } else {
        params.set("type", type);
      }
    }
    if (people !== undefined) {
      if (people === "anyone") {
        params.delete("people");
      } else {
        params.set("people", people);
      }
    }
    if (location !== undefined) {
      if (location === "anywhere") {
        params.delete("location");
      } else {
        params.set("location", location);
      }
    }

    const newUrl = `/search${params.toString() ? `?${params.toString()}` : ""}`;
    router.push(newUrl);
  };

  const handleContentTypeChange = (value: string) => {
    setLocalContentTypeFilter(value);
    updateSearchParams(value, undefined, undefined);
  };

  const handlePeopleFilterChange = (value: string) => {
    setLocalPeopleFilter(value);
    updateSearchParams(undefined, value, undefined);
  };

  const handleLocationFilterChange = (value: string) => {
    setLocalLocationFilter(value);
    updateSearchParams(undefined, undefined, value);
  };

  return (
    <div className="bg-black border border-[#2f3336] rounded-2xl mb-4 flex flex-col pt-3 pb-4">
      <h2 className="px-4 pb-3 font-bold tracking-tight text-white text-base">
        Filtros de búsqueda
      </h2>

      {/* Sección Tipo de Contenido */}
      <div className="px-4 pb-4 border-b border-[#2f3336]">
        <Label className="text-sm font-semibold text-white mb-3 block">
          Tipo de contenido
        </Label>
        <RadioGroup
          value={localContentTypeFilter}
          onValueChange={handleContentTypeChange}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <Label
              htmlFor="all"
              className="text-sm text-neutral-400 font-normal cursor-pointer"
            >
              Todo
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="posts" id="posts" />
            <Label
              htmlFor="posts"
              className="text-sm text-neutral-400 font-normal cursor-pointer"
            >
              Publicaciones
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="quizzes" id="quizzes" />
            <Label
              htmlFor="quizzes"
              className="text-sm text-neutral-400 font-normal cursor-pointer"
            >
              Quizzes
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Sección People */}
      <div className="px-4 pb-4 pt-4 border-b border-[#2f3336]">
        <Label className="text-sm font-semibold text-white mb-3 block">
          Personas
        </Label>
        <RadioGroup
          value={localPeopleFilter}
          onValueChange={handlePeopleFilterChange}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="anyone" id="anyone" />
            <Label
              htmlFor="anyone"
              className="text-sm text-neutral-400 font-normal cursor-pointer"
            >
              De cualquiera
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="following" id="following" />
            <Label
              htmlFor="following"
              className="text-sm text-neutral-400 font-normal cursor-pointer"
            >
              Personas que sigues
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Sección Location */}
      <div className="px-4 pt-4">
        <Label className="text-sm font-semibold text-white mb-3 block">
          Ubicación
        </Label>
        <RadioGroup
          value={localLocationFilter}
          onValueChange={handleLocationFilterChange}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="anywhere" id="anywhere" />
            <Label
              htmlFor="anywhere"
              className="text-sm text-neutral-400 font-normal cursor-pointer"
            >
              Cualquier lugar
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nearby" id="nearby" />
            <Label
              htmlFor="nearby"
              className="text-sm text-neutral-400 font-normal cursor-pointer"
            >
              Cerca de ti
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}

interface RightSidebarClientProps {
  whoToFollow: SuggestedUser[];
  trendingTopics: TrendingHashtag[];
}

export function RightSidebarClient({
  whoToFollow,
  trendingTopics,
}: RightSidebarClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  // Detectar si estamos en rutas de búsqueda
  const isSearchPage = pathname === "/search" || pathname === "/explore";

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      handleSearch();
    }
  };

  // Formatear número de posts para trending
  const formatPostCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="sticky top-0 py-2">
      {/* Search Input - Solo mostrar si NO estamos en página de búsqueda */}
      {!isSearchPage && (
        <div className="group relative w-full mb-4 z-20">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-x-gray group-focus-within:text-x-blue">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Buscar en Open Medicine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-[#202327] rounded-full h-[42px] border-none pl-12 pr-4 focus:outline-none focus:bg-black focus:border focus:border-x-blue placeholder-x-gray transition-all text-white"
          />
        </div>
      )}

      {/* Search Filters - Solo mostrar si estamos en página de búsqueda */}
      {isSearchPage && <SearchFilters />}

      {/* Who to follow */}
      {whoToFollow.length > 0 && (
        <div className="bg-black border border-[#2f3336] rounded-2xl mb-4 flex flex-col pt-3 pb-2">
          <h2 className="px-4 pb-2 font-bold tracking-tight text-white">
            A quién seguir
          </h2>

          {whoToFollow.map((user) => (
            <div
              key={user.id}
              className="px-4 py-3 hover:bg-x-hover transition-colors cursor-pointer flex items-center justify-between gap-2"
            >
              <Link
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 truncate flex-1"
              >
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage
                    src={user.avatar_url || undefined}
                    alt={user.full_name || "Usuario"}
                  />
                  <AvatarFallback className="bg-neutral-800">
                    {(user.full_name || user.username || "U")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate min-w-0">
                  <span className="font-semibold hover:underline truncate text-white">
                    {user.full_name || "Usuario"}
                  </span>
                  <span className="text-x-gray truncate">
                    @{user.username || "usuario"}
                  </span>
                </div>
              </Link>
              <button className="bg-transparent text-white border border-[#536471] hover:bg-white/10 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors flex-shrink-0">
                Seguir
              </button>
            </div>
          ))}

          <div className="px-4 pt-3 pb-1 cursor-pointer hover:bg-x-hover rounded-b-2xl transition-colors">
            <span className="text-x-blue text-sm font-normal">Mostrar más</span>
          </div>
        </div>
      )}

      {/* Trends */}
      {trendingTopics.length > 0 && (
        <div className="bg-black border border-[#2f3336] rounded-2xl mb-4 flex flex-col pt-3 pb-2">
          <h2 className="px-4 pb-2 font-bold tracking-tight text-white">
            Tendencias en Medicina
          </h2>

          {trendingTopics.map((trend, index) => (
            <Link
              key={`${trend.tag}-${index}`}
              href={`/search?q=${encodeURIComponent(trend.tag)}`}
              className="px-4 py-3 hover:bg-x-hover transition-colors cursor-pointer relative"
            >
              <div className="flex justify-between items-start">
                <span className="text-sm text-x-gray">Tendencia en Medicina</span>
                <button
                  onClick={(e) => e.preventDefault()}
                  className="text-x-gray hover:bg-x-blue/10 hover:text-x-blue rounded-full p-1 -mr-2"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
              <div className="font-bold mt-0.5 text-white">
                #{trend.tag.replace(/^#/, "")}
              </div>
              <div className="text-sm text-x-gray mt-1">
                {formatPostCount(Number(trend.count))} publicaciones
              </div>
            </Link>
          ))}

          <div className="px-4 pt-3 pb-1 cursor-pointer hover:bg-x-hover rounded-b-2xl transition-colors">
            <span className="text-x-blue text-sm font-normal">Mostrar más</span>
          </div>
        </div>
      )}

      {/* Footer Links */}
      <div className="px-4 flex flex-wrap gap-x-3 gap-y-1 text-sm text-x-gray leading-tight mb-8">
        <a href="#" className="hover:underline">
          Condiciones de servicio
        </a>
        <a href="#" className="hover:underline">
          Política de Privacidad
        </a>
        <a href="#" className="hover:underline">
          Política de cookies
        </a>
        <a href="#" className="hover:underline">
          Accesibilidad
        </a>
        <a href="#" className="hover:underline">
          Información de anuncios
        </a>
        <span className="flex items-center gap-1">
          Más <MoreHorizontal className="w-3 h-3" />
        </span>
        <span>© 2024 Open Medicine, Inc.</span>
      </div>
    </div>
  );
}

