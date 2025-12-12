export default function NotFound() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl font-bold text-white mb-2">Post no encontrado</p>
        <p className="text-x-gray text-sm">
          El post que buscas no existe o ha sido eliminado.
        </p>
      </div>
    </main>
  );
}

