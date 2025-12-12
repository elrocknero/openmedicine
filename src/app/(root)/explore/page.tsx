import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchInput } from "@/components/shared/SearchInput";
import { Hash, TrendingUp, Newspaper, Activity, Film } from "lucide-react";

// Datos simulados para las tendencias
const trendingHashtags = [
  { id: 1, hashtag: "#ENARM", posts: "12.5K", category: "Tendencia en México" },
  { id: 2, hashtag: "#Cardiologia", posts: "8.2K", category: "Medicina · Tendencia" },
  { id: 3, hashtag: "#Internado", posts: "5.7K", category: "Educación · Tendencia" },
  { id: 4, hashtag: "#Residencia", posts: "4.1K", category: "Medicina · Tendencia" },
  { id: 5, hashtag: "#MedicinaInterna", posts: "3.8K", category: "Especialidad · Tendencia" },
];

const newsItems = [
  {
    id: 1,
    title: "Nuevos avances en medicina regenerativa",
    source: "Revista Médica",
    time: "Hace 2h",
  },
  {
    id: 2,
    title: "Actualización en protocolos de vacunación",
    source: "OMS",
    time: "Hace 4h",
  },
  {
    id: 3,
    title: "Descubrimiento en tratamiento de cáncer",
    source: "Nature Medicine",
    time: "Hace 6h",
  },
];

export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Header con Input de Búsqueda */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-black/80 border-b border-[#2f3336]">
        <div className="px-4 py-3">
          <SearchInput placeholder="Buscar en Open Medicine..." />
        </div>
      </div>

      {/* Tabs de Navegación */}
      <Tabs defaultValue="for-you" className="w-full">
        <div className="sticky top-[53px] z-20 bg-black/60 backdrop-blur-md border-b border-[#2f3336]">
          <TabsList className="flex w-full h-[53px] rounded-none bg-transparent p-0">
            <TabsTrigger
              value="for-you"
              className="flex-1 h-full relative flex items-center justify-center text-[15px] font-medium text-[#71767b] transition-colors hover:bg-white/10 cursor-pointer rounded-none border-none outline-none data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:w-[56px] data-[state=active]:after:h-[4px] data-[state=active]:after:bg-white data-[state=active]:after:rounded-full"
            >
              Para ti
            </TabsTrigger>
            <TabsTrigger
              value="trending"
              className="flex-1 h-full relative flex items-center justify-center text-[15px] font-medium text-[#71767b] transition-colors hover:bg-white/10 cursor-pointer rounded-none border-none outline-none data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:w-[56px] data-[state=active]:after:h-[4px] data-[state=active]:after:bg-white data-[state=active]:after:rounded-full"
            >
              Tendencias
            </TabsTrigger>
            <TabsTrigger
              value="news"
              className="flex-1 h-full relative flex items-center justify-center text-[15px] font-medium text-[#71767b] transition-colors hover:bg-white/10 cursor-pointer rounded-none border-none outline-none data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:w-[56px] data-[state=active]:after:h-[4px] data-[state=active]:after:bg-white data-[state=active]:after:rounded-full"
            >
              Noticias
            </TabsTrigger>
            <TabsTrigger
              value="sports"
              className="flex-1 h-full relative flex items-center justify-center text-[15px] font-medium text-[#71767b] transition-colors hover:bg-white/10 cursor-pointer rounded-none border-none outline-none data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:w-[56px] data-[state=active]:after:h-[4px] data-[state=active]:after:bg-white data-[state=active]:after:rounded-full"
            >
              Deportes
            </TabsTrigger>
            <TabsTrigger
              value="entertainment"
              className="flex-1 h-full relative flex items-center justify-center text-[15px] font-medium text-[#71767b] transition-colors hover:bg-white/10 cursor-pointer rounded-none border-none outline-none data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:w-[56px] data-[state=active]:after:h-[4px] data-[state=active]:after:bg-white data-[state=active]:after:rounded-full"
            >
              Entretenimiento
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab: Para ti */}
        <TabsContent value="for-you" className="mt-0">
          <div className="space-y-0 divide-y divide-[#2f3336]">
            {trendingHashtags.map((trend) => (
              <div
                key={trend.id}
                className="px-4 py-4 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <Hash className="w-5 h-5 text-[#71767b] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm text-[#71767b] mb-1">{trend.category}</div>
                    <div className="font-bold text-white text-[15px] mb-1">
                      {trend.hashtag}
                    </div>
                    <div className="text-sm text-[#71767b]">
                      {trend.posts} publicaciones
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Tendencias */}
        <TabsContent value="trending" className="mt-0">
          <div className="space-y-0 divide-y divide-[#2f3336]">
            {trendingHashtags.map((trend) => (
              <div
                key={trend.id}
                className="px-4 py-4 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm text-[#71767b] mb-1">{trend.category}</div>
                    <div className="font-bold text-white text-[15px] mb-1">
                      {trend.hashtag}
                    </div>
                    <div className="text-sm text-[#71767b]">
                      {trend.posts} publicaciones
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Noticias */}
        <TabsContent value="news" className="mt-0">
          <div className="space-y-0 divide-y divide-[#2f3336]">
            {newsItems.map((item) => (
              <div
                key={item.id}
                className="px-4 py-4 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <Newspaper className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm text-[#71767b] mb-1">
                      {item.source} · {item.time}
                    </div>
                    <div className="font-semibold text-white text-[15px]">
                      {item.title}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Deportes */}
        <TabsContent value="sports" className="mt-0">
          <div className="text-center py-16 border border-[#2f3336] rounded-2xl bg-[#16181c] mx-4 my-4">
            <Activity className="w-12 h-12 text-[#71767b] mx-auto mb-4" />
            <p className="text-xl font-semibold text-white mb-2">
              No hay contenido de deportes
            </p>
            <p className="text-[#71767b] text-sm">
              Próximamente habrá contenido relacionado con medicina deportiva.
            </p>
          </div>
        </TabsContent>

        {/* Tab: Entretenimiento */}
        <TabsContent value="entertainment" className="mt-0">
          <div className="text-center py-16 border border-[#2f3336] rounded-2xl bg-[#16181c] mx-4 my-4">
            <Film className="w-12 h-12 text-[#71767b] mx-auto mb-4" />
            <p className="text-xl font-semibold text-white mb-2">
              No hay contenido de entretenimiento
            </p>
            <p className="text-[#71767b] text-sm">
              Próximamente habrá contenido relacionado con medicina y entretenimiento.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

