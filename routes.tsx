import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ProfilePage } from "./pages/ProfilePage";
import { QuinielasPage } from "./pages/PollasPage";
import { AlbumPage } from "./pages/AlbumPage";
import { TicketsPage } from "./pages/TicketsPage";
import { AgendaPage } from "./pages/AgendaPage";
import { MatchDetailPage } from "./pages/MatchDetailPage";
import { SoportePage } from "./pages/SoportePage";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "home", Component: HomePage },
      { path: "quinielas", Component: QuinielasPage },
      { path: "grupos", element: <Navigate to="/quinielas" replace /> },
      { path: "album", Component: AlbumPage },
      { path: "entradas", Component: TicketsPage },
      { path: "agenda", Component: AgendaPage },
      { path: "perfil", Component: ProfilePage },
      { path: "partido/:id", Component: MatchDetailPage },
      { path: "soporte", Component: SoportePage },
    ],
  },
  { path: "/login", Component: LoginPage },
  { path: "/registro", Component: RegisterPage },
  { path: "/onboarding", Component: OnboardingPage },
  { path: "*", Component: NotFound },
]);