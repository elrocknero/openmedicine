// src/constants/index.ts

export const sidebarLinks = [
    {
      imgURL: "/assets/home.svg", // Asegúrate de tener estos iconos o usa rutas genéricas
      route: "/",
      label: "Inicio",
    },
    {
      imgURL: "/assets/search.svg",
      route: "/explore", // Página de exploración
      label: "Explorar",
    },
    {
      imgURL: "/assets/notification.svg", // Si no tienes icono, puedes repetir home temporalmente
      route: "/notifications",
      label: "Notificaciones",
    },
    {
      imgURL: "/assets/create.svg", // Icono para Quizzes (puedes usar un cerebro o documento)
      route: "/quizzes",
      label: "Quizes",
    },
    {
      imgURL: "/assets/bookmark.svg",
      route: "/saved",
      label: "Guardados",
    },
    {
      imgURL: "/assets/user.svg",
      route: "/profile",
      label: "Perfil",
    },
  ];