import { Link } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { teamFlags } from '../data/teamFlags';
import { matches, teams } from '../data/mockData';
import { worldCupGroups } from '../data/grupos';
import { news } from '../data/news';
import { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Users,
  BookOpen,
  Ticket,
  ChevronLeft,
  ChevronRight,
  UserCircle,
} from 'lucide-react';

export function HomePage() {
  const { user } = useAuth();
  const [currentNews, setCurrentNews] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Buscar equipo favorito — primero en user del contexto, luego en localStorage
  const favoriteTeamName = user?.favoriteTeam || localStorage.getItem("favoriteTeam") || "";
  const userFavoriteTeam = teams.find((t) => t.name === favoriteTeamName);
  const userFlagImg = userFavoriteTeam ? teamFlags[userFavoriteTeam.name] : null;

  // Avatar — primero en user del contexto, luego en localStorage
  const avatarUrl = user?.avatarUrl || localStorage.getItem("avatarUrl") || "";

  // Nombre a mostrar
  const displayName = user?.nombreCompleto || user?.username || "Usuario";

  const worldCupDate = new Date('2026-06-11');
  const today = new Date();
  const daysUntil = Math.ceil((worldCupDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentNews((prev) => (prev + 1) % news.length);
      }, 4000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused]);

  const goTo = (index: number) => {
    setCurrentNews((index + news.length) % news.length);
  };

  return (
      <div className="space-y-8 pb-20 lg:pb-8 w-full px-6">

        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#6B0008_0%,#8B000F_40%,#B80012_75%,#8B000F_100%)] p-6 text-white shadow-xl md:p-8">
          <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
          />
          <div className="absolute top-0 right-0 w-80 h-80 opacity-10 rounded-full bg-white blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-20 w-40 h-40 opacity-5 rounded-full bg-yellow-300 blur-2xl" />

          <div className="relative flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="size-16 rounded-full border-4 border-white/30 overflow-hidden bg-white/10 flex-shrink-0 flex items-center justify-center">
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt="Tu avatar"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <UserCircle className="size-10 text-white/60" />
                )}
              </div>

              <div>
                <h1 className="mb-1 text-3xl font-bold">¡Hola, {displayName}!</h1>
                <p className="text-white/80">Bienvenido a tu hub personal del Mundial 2026</p>
                {userFavoriteTeam && (
                    <div className="mt-2 flex items-center gap-3">
                      {userFlagImg ? (
                          <img
                              src={userFlagImg}
                              alt={`Bandera de ${userFavoriteTeam.name}`}
                              className="h-7 w-10 rounded object-cover shadow-sm border border-white/20"
                          />
                      ) : (
                          <span className="text-2xl">{userFavoriteTeam.flag}</span>
                      )}
                      <span className="text-lg font-medium">Apoyando a {userFavoriteTeam.name}</span>
                    </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-center backdrop-blur-sm min-w-[130px]">
              <div className="text-4xl font-black tracking-tight">{daysUntil}</div>
              <div className="text-xs text-white/70 uppercase tracking-widest mt-1">días para el</div>
              <div className="text-sm font-bold text-white tracking-wide">MUNDIAL</div>
            </div>
          </div>
        </div>

        {/* CARRUSEL DE NOTICIAS */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#111827]">Historias destacadas</h2>
            <div className="flex items-center gap-1">
              <button
                  onClick={() => goTo(currentNews - 1)}
                  className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <ChevronLeft className="size-4 text-gray-600" />
              </button>
              <button
                  onClick={() => goTo(currentNews + 1)}
                  className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <ChevronRight className="size-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div
              className="relative overflow-hidden rounded-2xl shadow-lg cursor-pointer"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
          >
            <div className="relative h-[420px] md:h-[520px] overflow-hidden">
              {news.map((item, index) => (
                  <img
                      key={item.id}
                      src={item.image}
                      alt={item.title}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                          index === currentNews ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                      }`}
                  />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <span className="inline-block bg-[#8B000F] text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                {news[currentNews]?.category}
              </span>
                <h3 className="text-white text-2xl md:text-4xl font-black leading-tight max-w-2xl">
                  {news[currentNews]?.title}
                </h3>
              </div>

              <button
                  onClick={() => goTo(currentNews - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-sm transition-colors"
              >
                <ChevronLeft className="size-6 text-white" />
              </button>
              <button
                  onClick={() => goTo(currentNews + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-sm transition-colors"
              >
                <ChevronRight className="size-6 text-white" />
              </button>

              <div className="absolute bottom-6 right-6 flex items-center gap-2">
                {news.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goTo(index)}
                        className={`rounded-full transition-all duration-300 ${
                            index === currentNews
                                ? 'w-7 h-2.5 bg-white'
                                : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
                        }`}
                    />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* GRUPOS DEL MUNDIAL 2026 */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#111827]">Grupos del Mundial 2026</h2>
            <p className="text-sm text-gray-500 mt-1">48 selecciones · 12 grupos · Fase de grupos: 11–27 junio</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {worldCupGroups.map(({ group, teams: groupTeams }) => (
                <div key={group} className="rounded-2xl bg-white shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="bg-[linear-gradient(135deg,#6B0008,#B80012)] px-4 py-3 flex items-center justify-between">
                    <h3 className="text-white font-black text-base tracking-widest uppercase">Grupo {group}</h3>
                    <span className="text-white/60 text-xs font-medium">4 equipos</span>
                  </div>

                  <div className="px-0">
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Selección</span>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">PJ</span>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Pts</span>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">GD</span>
                    </div>

                    {groupTeams.map((teamName, index) => {
                      const flagImg = teamFlags[teamName];
                      return (
                          <div
                              key={teamName}
                              className="relative grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-4 py-3 items-center border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                          >
                            {index < 2 && (
                                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#8B000F] rounded-r" />
                            )}
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs text-gray-400 font-medium w-4 flex-shrink-0">{index + 1}</span>
                              {flagImg ? (
                                  <img src={flagImg} alt={`Bandera de ${teamName}`} className="h-5 w-8 rounded-sm object-cover shadow-sm border border-gray-200 flex-shrink-0" />
                              ) : (
                                  <div className="h-5 w-8 rounded-sm bg-gray-200 flex-shrink-0" />
                              )}
                              <span className="text-sm font-medium text-[#111827] truncate">{teamName}</span>
                            </div>
                            <span className="text-sm text-gray-400 text-center w-6">0</span>
                            <span className="text-sm font-bold text-gray-700 text-center w-6">0</span>
                            <span className="text-sm text-gray-400 text-center w-6">0</span>
                          </div>
                      );
                    })}
                  </div>

                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#8B000F]" />
                    <span className="text-xs text-gray-400">Clasifican al 16avos</span>
                  </div>
                </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-[#111827]">Acciones rápidas</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Link to="/quinielas">
              <Card className="cursor-pointer border-0 bg-white/95 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#8B000F]">
                    <Trophy className="size-7 text-white" />
                  </div>
                  <h3 className="font-semibold">Pollas Futboleras</h3>
                </CardContent>
              </Card>
            </Link>
            <Link to="/grupos">
              <Card className="cursor-pointer border-0 bg-white/95 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#2F54EB]">
                    <Users className="size-7 text-white" />
                  </div>
                  <h3 className="font-semibold">Grupos</h3>
                </CardContent>
              </Card>
            </Link>
            <Link to="/album">
              <Card className="cursor-pointer border-0 bg-white/95 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#9B7AE6]">
                    <BookOpen className="size-7 text-white" />
                  </div>
                  <h3 className="font-semibold">Álbum</h3>
                </CardContent>
              </Card>
            </Link>
            <Link to="/entradas">
              <Card className="cursor-pointer border-0 bg-white/95 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#B7E000]">
                    <Ticket className="size-7 text-black" />
                  </div>
                  <h3 className="font-semibold">Entradas</h3>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

      </div>
  );
}