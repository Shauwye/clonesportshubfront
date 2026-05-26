import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { teamFlags } from '../data/teamFlags';
import {
  Calendar as CalendarIcon, MapPin, Clock, Bell, BellOff,
  Star, Filter, Globe, Loader2, Navigation, Map,
  Users, Info, Trophy,
} from 'lucide-react';
import {
  matches, STADIUM_COORDS, toggleReminder, getMyReminders,
  convertToUserTimezone, getMatchAlerts, USER_TIMEZONE,
  getAgendaPersonal, guardarAgendaPersonal,
} from '../../services/agendaService';

const API_URL = "http://localhost:8081";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// --- Mapa OpenStreetMap ---
const StadiumMap = ({ lat, lon, nombre }: { lat: number; lon: number; nombre: string }) => {
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01}%2C${lat - 0.008}%2C${lon + 0.01}%2C${lat + 0.008}&layer=mapnik&marker=${lat}%2C${lon}`;
  return (
      <div className="space-y-2">
        <iframe src={src} className="w-full h-52 rounded-xl border-0 shadow-inner" title={`Mapa ${nombre}`} loading="lazy" />
        <div className="flex gap-2">
          <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`} target="_blank" rel="noreferrer" className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs"><Map className="size-3 mr-1" /> OpenStreetMap</Button>
          </a>
          <a href={`https://maps.google.com/?q=${lat},${lon}`} target="_blank" rel="noreferrer" className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs"><Navigation className="size-3 mr-1" /> Google Maps</Button>
          </a>
          <a href={`https://waze.com/ul?ll=${lat},${lon}&navigate=yes`} target="_blank" rel="noreferrer" className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs">🚗 Waze</Button>
          </a>
        </div>
      </div>
  );
};

// --- Hora local ---
const TimezoneInfo = ({ date, time, city }: { date: string; time: string; city: string }) => {
  const info = convertToUserTimezone(date, time, city);
  if (!info.diffLabel || info.diffLabel === 'Misma hora') return (
      <span className="text-xs text-gray-400 flex items-center gap-1">
      <Globe className="size-3" /> {info.userTime} (Colombia)
    </span>
  );
  return (
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="bg-gray-100 rounded px-2 py-0.5 flex items-center gap-1"><Globe className="size-3" /> {info.userTime} Colombia</span>
        <span className="bg-blue-50 text-blue-600 rounded px-2 py-0.5">{info.diffLabel}</span>
      </div>
  );
};

// --- Alertas ---
const MatchAlerts = ({ date, time, city }: { date: string; time: string; city: string }) => {
  const alerts = getMatchAlerts(date, time, city);
  if (alerts.length === 0) return null;
  const colorMap: Record<string, string> = {
    urgent: 'bg-red-50 border-red-200 text-red-700',
    today: 'bg-amber-50 border-amber-200 text-amber-700',
    soon: 'bg-blue-50 border-blue-200 text-blue-700',
    travel: 'bg-purple-50 border-purple-200 text-purple-700',
    past: 'bg-gray-50 border-gray-200 text-gray-500',
  };
  return (
      <div className="space-y-1 mt-2">
        {alerts.map((a, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs px-2 py-1 rounded border ${colorMap[a.type]}`}>
              <span>{a.icon}</span> {a.message}
            </div>
        ))}
      </div>
  );
};

// --- Tarjeta de partido ---
const MatchCard = ({ match, isFavorite, hasReminder, onToggleFavorite, onToggleReminder, onViewStadium, onViewTeam, compact = false }: any) => {
  const homeFlagImg = teamFlags[match.homeTeam];
  const awayFlagImg = teamFlags[match.awayTeam];
  const flagSize = compact ? 'h-10 w-14' : 'h-14 w-20';

  return (
      <Card className={`border-0 shadow-md hover:shadow-lg transition-all ${isFavorite ? 'ring-2 ring-yellow-300' : ''}`}>
        <CardContent className={compact ? 'p-4' : 'p-5'}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-gray-100 text-gray-700 border-0 text-xs">Grupo {match.group}</Badge>
                <Badge className="border-0 text-xs bg-green-100 text-green-700">🟢 Próximo</Badge>
              </div>

              <div className={`flex items-center gap-4 ${compact ? 'mb-2' : 'mb-4'}`}>
                <button className="text-center flex-1 hover:opacity-75 transition-opacity" onClick={() => onViewTeam(match.homeTeam)}>
                  <div className="flex justify-center mb-1">
                    {homeFlagImg
                        ? <img src={homeFlagImg} alt={match.homeTeam} className={`${flagSize} object-cover rounded shadow-sm border border-gray-200`} />
                        : <span className={compact ? 'text-3xl' : 'text-5xl'}>{match.homeFlag}</span>}
                  </div>
                  <div className="font-semibold text-sm">{match.homeTeam}</div>
                  <div className="text-[10px] text-[#8B000F]">Ver equipo</div>
                </button>

                <div className="text-center px-2 flex-shrink-0">
                  <div className="text-xl font-black text-gray-300">VS</div>
                </div>

                <button className="text-center flex-1 hover:opacity-75 transition-opacity" onClick={() => onViewTeam(match.awayTeam)}>
                  <div className="flex justify-center mb-1">
                    {awayFlagImg
                        ? <img src={awayFlagImg} alt={match.awayTeam} className={`${flagSize} object-cover rounded shadow-sm border border-gray-200`} />
                        : <span className={compact ? 'text-3xl' : 'text-5xl'}>{match.awayFlag}</span>}
                  </div>
                  <div className="font-semibold text-sm">{match.awayTeam}</div>
                  <div className="text-[10px] text-[#8B000F]">Ver equipo</div>
                </button>
              </div>

              <div className="space-y-1 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="size-3.5 flex-shrink-0" />
                  {new Date(match.date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Clock className="size-3.5 flex-shrink-0" />
                  {match.time} (sede) · <TimezoneInfo date={match.date} time={match.time} city={match.city} />
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 flex-shrink-0" />
                  <button className="text-[#8B000F] hover:underline text-left" onClick={() => onViewStadium(match.stadium)}>
                    {match.stadium}, {match.city}
                  </button>
                </div>
              </div>
              <MatchAlerts date={match.date} time={match.time} city={match.city} />
            </div>

            <div className="flex md:flex-col gap-2 justify-end">
              <Button size="sm" variant="outline"
                      className={`flex-1 md:flex-none ${isFavorite ? 'border-yellow-400 text-yellow-600 bg-yellow-50' : ''}`}
                      onClick={() => onToggleFavorite(match.id)}>
                <Star className={`size-3.5 mr-1 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                {isFavorite ? 'Favorito' : 'Guardar'}
              </Button>
              <Button size="sm" variant="outline"
                      className={`flex-1 md:flex-none ${hasReminder ? 'border-[#8B000F] text-[#8B000F] bg-red-50' : ''}`}
                      onClick={() => onToggleReminder(match)}>
                {hasReminder ? <BellOff className="size-3.5 mr-1" /> : <Bell className="size-3.5 mr-1" />}
                {hasReminder ? 'Silenciar' : 'Recordar'}
              </Button>
              <Button size="sm" variant="outline" className="flex-1 md:flex-none"
                      onClick={() => onViewStadium(match.stadium)}>
                <Map className="size-3.5 mr-1" /> Mapa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
  );
};

export function AgendaPage() {
  const { user } = useAuth();
  const usuarioId = user?.usuarioId;
  const favoriteTeamName = user?.favoriteTeam || localStorage.getItem("favoriteTeam") || "";

  // Filtros — inicializan en 'all', se aplica favorito después de cargar
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const [favorites, setFavorites] = useState<string[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [agenda, setAgenda] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedStadium, setSelectedStadium] = useState<any>(null); // objeto estadio completo
  const [selectedTeamData, setSelectedTeamData] = useState<any>(null);

  const [estadiosBD, setEstadiosBD] = useState<any[]>([]);
  const [equiposBD, setEquiposBD] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const headers = getAuthHeaders();

      // Recordatorios
      const r = await getMyReminders(usuarioId);
      setReminders(r);

      // Agenda desde BD → aplica filtro equipo
      if (usuarioId) {
        const agendaBD = await getAgendaPersonal(usuarioId);
        if (agendaBD) {
          setAgenda(agendaBD);
          // Solo aplicar el filtro si tiene equipo guardado
          if (agendaBD.filtroEquipos) {
            setSelectedTeam(agendaBD.filtroEquipos);
          } else if (favoriteTeamName) {
            setSelectedTeam(favoriteTeamName);
          }
        } else if (favoriteTeamName) {
          setSelectedTeam(favoriteTeamName);
        }
      }

      // Estadios desde BD
      try {
        const res = await fetch(`${API_URL}/estadio/getall`, { headers });
        if (res.status === 202) {
          setEstadiosBD(await res.json());
        }
      } catch (e) { console.error(e); }

      // Equipos desde BD
      try {
        const res = await fetch(`${API_URL}/equipo/getall`, { headers });
        if (res.status === 202) {
          setEquiposBD(await res.json());
        }
      } catch (e) { console.error(e); }

      setLoading(false);
    }
    load();
  }, [usuarioId]);

  const handleViewTeam = (teamName: string) => {
    const equipo = equiposBD.find(e => e.nombre === teamName);
    if (equipo) setSelectedTeamData(equipo);
    else toast.info("Información del equipo no disponible aún");
  };

  const handleViewStadium = (stadiumName: string) => {
    // Buscar en BD primero, luego en STADIUM_COORDS como fallback
    const estadioBD = estadiosBD.find(e => e.nombre === stadiumName);
    if (estadioBD) {
      setSelectedStadium(estadioBD);
    } else {
      const coords = STADIUM_COORDS[stadiumName];
      if (coords) {
        setSelectedStadium({
          nombre: stadiumName, ciudad: coords.city, pais: coords.country,
          capacidad: coords.capacity, latitud: coords.lat, longitud: coords.lon,
          descripcion: '', direccion: '', zonaHoraria: '',
        });
      }
    }
  };

  // Guardar filtro equipo en agenda cuando cambia
  const handleTeamChange = async (value: string) => {
    setSelectedTeam(value);
    if (usuarioId && value !== 'all') {
      await guardarAgendaPersonal({
        usuarioId,
        favoriteTeam: value,
        pais: user?.pais || '',
      });
      toast.success(`Agenda actualizada para ${value}`);
    }
  };

  const handleToggleFavorite = (matchId: string) => {
    setFavorites(prev => {
      const isFav = prev.includes(matchId);
      toast.success(isFav ? 'Quitado de favoritos' : '⭐ Agregado a favoritos');
      return isFav ? prev.filter(id => id !== matchId) : [...prev, matchId];
    });
  };

  const handleToggleReminder = async (match: any) => {
    const result = await toggleReminder({
      userId: usuarioId,
      matchId: match.id,
      matchName: `${match.homeTeam} vs ${match.awayTeam}`,
      matchDate: match.date,
    });
    setReminders(result.reminders);
    toast.success(result.active ? '🔔 Recordatorio activado' : '🔕 Recordatorio desactivado');
  };

  // Filtros — todos funcionan independientemente
  const cities = useMemo(() => ['all', ...new Set(matches.map(m => m.city))].sort(), []);
  const groups = useMemo(() => ['all', ...new Set(matches.map(m => m.group))].sort(), []);
  const allTeams = useMemo(() => ['all', ...new Set([...matches.map(m => m.homeTeam), ...matches.map(m => m.awayTeam)])].sort(), []);

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const teamOk = selectedTeam === 'all' || m.homeTeam === selectedTeam || m.awayTeam === selectedTeam;
      const cityOk = selectedCity === 'all' || m.city === selectedCity;
      const groupOk = selectedGroup === 'all' || m.group === selectedGroup;
      return teamOk && cityOk && groupOk;
    });
  }, [selectedTeam, selectedCity, selectedGroup]);

  const favoriteMatches = useMemo(() => matches.filter(m => favorites.includes(m.id)), [favorites]);
  const reminderMatchIds = reminders.map(r => r.matchId);
  const myTeamMatches = favoriteTeamName
      ? matches.filter(m => m.homeTeam === favoriteTeamName || m.awayTeam === favoriteTeamName)
      : [];

  if (loading) return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-[#8B000F]" />
      </div>
  );

  return (
      <div className="space-y-6 pb-20 lg:pb-8 px-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold mb-1"> Agenda Personal</h1>
            <p className="text-gray-500 text-sm">Horarios en tu zona horaria · Colombia ({USER_TIMEZONE})</p>
          </div>
          {reminders.length > 0 && (
              <div className="flex items-center gap-2 bg-[#8B000F]/10 text-[#8B000F] rounded-xl px-3 py-2 text-sm">
                <Bell className="size-4" />
                <span className="font-semibold">{reminders.length} recordatorio{reminders.length > 1 ? 's' : ''} activo{reminders.length > 1 ? 's' : ''}</span>
              </div>
          )}
        </div>

        {/* Banner equipo favorito */}
        {favoriteTeamName && myTeamMatches.length > 0 && (
            <Card className="border-0 bg-gradient-to-r from-[#6B0008] to-[#B80012] text-white shadow-lg">
              <CardContent className="p-4">
                <p className="text-xs text-white/70 uppercase tracking-widest mb-1">Tu equipo favorito</p>
                <div className="flex items-center gap-3 mb-3">
                  {teamFlags[favoriteTeamName]
                      ? <img src={teamFlags[favoriteTeamName]} alt={favoriteTeamName} className="h-10 w-14 object-cover rounded border border-white/30 shadow" />
                      : <span className="text-3xl">{matches.find(m => m.homeTeam === favoriteTeamName)?.homeFlag}</span>
                  }
                  <div>
                    <h3 className="font-bold text-xl">{favoriteTeamName}</h3>
                    <p className="text-white/70 text-xs">{myTeamMatches.length} partidos · Grupo {myTeamMatches[0]?.group}</p>
                  </div>
                  <Button size="sm" variant="outline"
                          className="ml-auto border-white/30 text-white hover:bg-white/20 bg-transparent text-xs"
                          onClick={() => setSelectedTeam(selectedTeam === favoriteTeamName ? 'all' : favoriteTeamName)}>
                    {selectedTeam === favoriteTeamName ? 'Ver todos' : 'Filtrar partidos'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {myTeamMatches.map(m => {
                    const isHome = m.homeTeam === favoriteTeamName;

                    const myFlag = teamFlags[favoriteTeamName];
                    const rival = isHome ? m.awayTeam : m.homeTeam;
                    const rivalFlag = teamFlags[rival];

                    return (
                        <span key={m.id} className="bg-white/20 rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5">

      {/* MI EQUIPO */}
                          {myFlag
                              ? <img src={myFlag} alt={favoriteTeamName} className="h-3 w-5 object-cover rounded" />
                              : <span>{isHome ? m.homeFlag : m.awayFlag}</span>
                          }
                          <span className="font-medium">{favoriteTeamName}</span>

      <span className="text-white/60">vs</span>

                          {/* RIVAL */}
                          {rivalFlag
                              ? <img src={rivalFlag} alt={rival} className="h-3 w-5 object-cover rounded" />
                              : <span>{isHome ? m.awayFlag : m.homeFlag}</span>
                          }
                          <span className="font-medium">{rival}</span>

      <span className="text-white/60">
        · {new Date(m.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
      </span>
    </span>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
        )}

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todos los partidos</TabsTrigger>
            <TabsTrigger value="favorites">⭐ Favoritos {favorites.length > 0 && `(${favorites.length})`}</TabsTrigger>
            <TabsTrigger value="stadiums"> Estadios ({estadiosBD.length || 16})</TabsTrigger>
          </TabsList>

          {/* TAB TODOS */}
          <TabsContent value="all" className="space-y-4 mt-4">
            <Card className="border-0 shadow-sm bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="size-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-600">Filtrar partidos</span>
                  {(selectedTeam !== 'all' || selectedCity !== 'all' || selectedGroup !== 'all') && (
                      <button className="text-xs text-[#8B000F] ml-auto hover:underline"
                              onClick={() => { setSelectedTeam('all'); setSelectedCity('all'); setSelectedGroup('all'); }}>
                        Limpiar filtros
                      </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Filtro equipo — guarda en agenda */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Equipo</label>
                    <Select value={selectedTeam} onValueChange={handleTeamChange}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos los equipos" /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        <SelectItem value="all">Todos los equipos</SelectItem>
                        {allTeams.filter(t => t !== 'all').map(t => (
                            <SelectItem key={t} value={t}>
                              <div className="flex items-center gap-2">
                                {teamFlags[t]
                                    ? <img src={teamFlags[t]} alt="" className="h-3 w-5 object-cover rounded" />
                                    : null
                                }
                                {t}
                              </div>
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro ciudad */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Ciudad sede</label>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todas las ciudades" /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        <SelectItem value="all">Todas las ciudades</SelectItem>
                        {cities.filter(c => c !== 'all').map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro grupo */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Grupo</label>
                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos los grupos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los grupos</SelectItem>
                        {groups.filter(g => g !== 'all').map(g => (
                            <SelectItem key={g} value={g}>Grupo {g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {favoriteTeamName && selectedTeam !== favoriteTeamName && (
                    <button className="mt-3 text-xs text-[#8B000F] flex items-center gap-1.5 hover:underline"
                            onClick={() => handleTeamChange(favoriteTeamName)}>
                      {teamFlags[favoriteTeamName]
                          ? <img src={teamFlags[favoriteTeamName]} alt="" className="h-3 w-5 object-cover rounded" />
                          : null
                      }
                      Ver solo partidos de {favoriteTeamName}
                    </button>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {filteredMatches.length} partido{filteredMatches.length !== 1 ? 's' : ''} encontrado{filteredMatches.length !== 1 ? 's' : ''}
                {agenda && <span className="ml-2 text-[#8B000F]">· {agenda.nombre}</span>}
              </p>
            </div>

            {filteredMatches.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-200">
                  <CardContent className="p-10 text-center text-gray-400">
                    <CalendarIcon className="size-10 mx-auto mb-3 opacity-40" />
                    <p>No hay partidos con los filtros seleccionados</p>
                    <button className="text-[#8B000F] text-sm mt-2 hover:underline"
                            onClick={() => { setSelectedTeam('all'); setSelectedCity('all'); setSelectedGroup('all'); }}>
                      Limpiar filtros
                    </button>
                  </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                  {filteredMatches.map(match => (
                      <MatchCard key={match.id} match={match}
                                 isFavorite={favorites.includes(match.id)}
                                 hasReminder={reminderMatchIds.includes(match.id)}
                                 onToggleFavorite={handleToggleFavorite}
                                 onToggleReminder={handleToggleReminder}
                                 onViewStadium={handleViewStadium}
                                 onViewTeam={handleViewTeam}
                      />
                  ))}
                </div>
            )}
          </TabsContent>

          {/* TAB FAVORITOS */}
          <TabsContent value="favorites" className="space-y-4 mt-4">
            {favoriteMatches.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-200">
                  <CardContent className="p-12 text-center">
                    <Star className="size-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400 text-sm">Guarda partidos con ⭐ para verlos aquí</p>
                  </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                  {favoriteMatches.map(match => (
                      <MatchCard key={match.id} match={match} isFavorite
                                 hasReminder={reminderMatchIds.includes(match.id)}
                                 onToggleFavorite={handleToggleFavorite}
                                 onToggleReminder={handleToggleReminder}
                                 onViewStadium={handleViewStadium}
                                 onViewTeam={handleViewTeam}
                                 compact
                      />
                  ))}
                </div>
            )}
          </TabsContent>

          {/* TAB ESTADIOS — carga todos desde BD */}
          <TabsContent value="stadiums" className="space-y-4 mt-4">
            {estadiosBD.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="size-6 animate-spin text-gray-300 mr-2" />
                  <span className="text-gray-400 text-sm">Cargando estadios...</span>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {estadiosBD.map((stadium: any) => {
                    const stadiumMatches = matches.filter(m => m.stadium === stadium.nombre);
                    return (
                        <Card key={stadium.id} className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                          <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-4 py-3">
                            <h3 className="text-white font-bold text-base">🏟️ {stadium.nombre}</h3>
                            <p className="text-gray-300 text-xs mt-0.5 flex items-center gap-1">
                              <MapPin className="size-3" /> {stadium.ciudad}, {stadium.pais}
                            </p>
                          </div>

                          <CardContent className="p-4 space-y-3">
                            {/* Stats rápidas */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-gray-50 rounded-lg p-2 text-center">
                                <Users className="size-4 mx-auto text-gray-400 mb-1" />
                                <p className="text-xs font-bold text-gray-700">{(stadium.capacidad || 0).toLocaleString()}</p>
                                <p className="text-[10px] text-gray-400">Aforo</p>
                              </div>
                              <div className="bg-red-50 rounded-lg p-2 text-center">
                                <Trophy className="size-4 mx-auto text-[#8B000F] mb-1" />
                                <p className="text-xs font-bold text-[#8B000F]">{stadiumMatches.length}</p>
                                <p className="text-[10px] text-gray-400">Partidos</p>
                              </div>
                              <div className="bg-blue-50 rounded-lg p-2 text-center">
                                <Globe className="size-4 mx-auto text-blue-500 mb-1" />
                                <p className="text-xs font-bold text-gray-700 truncate">{stadium.pais}</p>
                                <p className="text-[10px] text-gray-400">País</p>
                              </div>
                            </div>

                            {/* Descripción */}
                            {stadium.descripcion && (
                                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{stadium.descripcion}</p>
                            )}

                            {/* Dirección */}
                            {stadium.direccion && (
                                <div className="flex items-start gap-1.5 text-xs text-gray-500">
                                  <MapPin className="size-3 flex-shrink-0 mt-0.5 text-gray-400" />
                                  <span className="line-clamp-1">{stadium.direccion}</span>
                                </div>
                            )}

                            {/* Zona horaria */}
                            {stadium.zonaHoraria && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <Clock className="size-3 text-gray-400" />
                                  <span>{stadium.zonaHoraria}</span>
                                </div>
                            )}

                            {/* Partidos en este estadio */}
                            {stadiumMatches.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Partidos programados</p>
                                  <div className="space-y-1 max-h-20 overflow-y-auto">
                                    {stadiumMatches.map(m => {
                                      const hf = teamFlags[m.homeTeam];
                                      const af = teamFlags[m.awayTeam];
                                      return (
                                          <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1 text-xs">
                                            <div className="flex items-center gap-1 min-w-0">
                                              {hf ? <img src={hf} alt="" className="h-3 w-4 object-cover rounded flex-shrink-0" /> : <span>{m.homeFlag}</span>}
                                              <span className="truncate font-medium">{m.homeTeam}</span>
                                              <span className="text-gray-400 flex-shrink-0">vs</span>
                                              {af ? <img src={af} alt="" className="h-3 w-4 object-cover rounded flex-shrink-0" /> : <span>{m.awayFlag}</span>}
                                              <span className="truncate font-medium">{m.awayTeam}</span>
                                            </div>
                                            <span className="text-gray-400 flex-shrink-0 ml-2">
                                    {new Date(m.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                                  </span>
                                          </div>
                                      );
                                    })}
                                  </div>
                                </div>
                            )}

                            <Button variant="outline" size="sm" className="w-full text-[#8B000F] border-[#8B000F]/30 hover:bg-red-50"
                                    onClick={() => handleViewStadium(stadium.nombre)}>
                              <Map className="size-3.5 mr-2" /> Ver mapa completo
                            </Button>
                          </CardContent>
                        </Card>
                    );
                  })}
                </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ── Dialog Estadio ── */}
        <Dialog open={!!selectedStadium} onOpenChange={() => setSelectedStadium(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>🏟️ {selectedStadium?.nombre}</DialogTitle>
            </DialogHeader>
            {selectedStadium && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Ciudad', value: selectedStadium.ciudad },
                      { label: 'País', value: selectedStadium.pais },
                      { label: 'Capacidad', value: `${(selectedStadium.capacidad || 0).toLocaleString()} personas` },
                      { label: 'Zona horaria', value: selectedStadium.zonaHoraria || '—' },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">{label}</p>
                          <p className="font-semibold text-sm">{value}</p>
                        </div>
                    ))}
                  </div>

                  {selectedStadium.descripcion && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Info className="size-3.5 text-blue-500" />
                          <p className="text-xs font-semibold text-blue-700">Sobre este estadio</p>
                        </div>
                        <p className="text-xs text-blue-800 leading-relaxed">{selectedStadium.descripcion}</p>
                      </div>
                  )}

                  {selectedStadium.direccion && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="size-4 flex-shrink-0 mt-0.5 text-[#8B000F]" />
                        <span>{selectedStadium.direccion}</span>
                      </div>
                  )}

                  {selectedStadium.latitud && selectedStadium.longitud && (
                      <StadiumMap lat={selectedStadium.latitud} lon={selectedStadium.longitud} nombre={selectedStadium.nombre} />
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Partidos en esta sede ({matches.filter(m => m.stadium === selectedStadium.nombre).length})
                    </p>
                    {matches.filter(m => m.stadium === selectedStadium.nombre).map(m => {
                      const hf = teamFlags[m.homeTeam];
                      const af = teamFlags[m.awayTeam];
                      return (
                          <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2 text-sm">
                              {hf ? <img src={hf} alt="" className="h-4 w-6 object-cover rounded" /> : <span>{m.homeFlag}</span>}
                              <span className="font-medium">{m.homeTeam}</span>
                              <span className="text-gray-400 text-xs">vs</span>
                              {af ? <img src={af} alt="" className="h-4 w-6 object-cover rounded" /> : <span>{m.awayFlag}</span>}
                              <span className="font-medium">{m.awayTeam}</span>
                            </div>
                            <div className="text-right text-xs text-gray-400">
                              <p>{new Date(m.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</p>
                              <p>{m.time}</p>
                            </div>
                          </div>
                      );
                    })}
                  </div>
                </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Dialog Equipo ── */}
        <Dialog open={!!selectedTeamData} onOpenChange={() => setSelectedTeamData(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {teamFlags[selectedTeamData?.nombre]
                    ? <img src={teamFlags[selectedTeamData.nombre]} alt="" className="h-8 w-12 object-cover rounded border border-gray-200" />
                    : <span className="text-2xl">🏳️</span>
                }
                {selectedTeamData?.nombre}
              </DialogTitle>
            </DialogHeader>
            {selectedTeamData && (() => {
              const stats = (() => { try { return JSON.parse(selectedTeamData.estadisticasJson || '{}'); } catch { return {}; } })();
              const teamMatches = matches.filter(m => m.homeTeam === selectedTeamData.nombre || m.awayTeam === selectedTeamData.nombre);
              return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'País', value: selectedTeamData.pais },
                        { label: 'Grupo', value: `Grupo ${selectedTeamData.grupo}` },
                        { label: 'Código FIFA', value: selectedTeamData.codigoFifa },
                        { label: 'Partidos en grupo', value: teamMatches.length },
                      ].map(({ label, value }) => (
                          <div key={label} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">{label}</p>
                            <p className="font-semibold text-sm font-mono">{value}</p>
                          </div>
                      ))}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Estadísticas fase de grupos</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: 'PJ', value: stats.pj ?? 0, color: '' },
                          { label: 'PG', value: stats.pg ?? 0, color: 'text-green-600' },
                          { label: 'PE', value: stats.pe ?? 0, color: 'text-yellow-600' },
                          { label: 'PP', value: stats.pp ?? 0, color: 'text-red-500' },
                          { label: 'GF', value: stats.gf ?? 0, color: '' },
                          { label: 'GC', value: stats.gc ?? 0, color: '' },
                          { label: 'DG', value: (stats.gf ?? 0) - (stats.gc ?? 0), color: '' },
                          { label: 'PTS', value: stats.pts ?? 0, color: 'text-[#8B000F] font-black' },
                        ].map(s => (
                            <div key={s.label} className="bg-gray-50 rounded-lg p-2 text-center">
                              <p className={`text-base font-bold ${s.color || 'text-gray-700'}`}>{s.value}</p>
                              <p className="text-[10px] text-gray-400">{s.label}</p>
                            </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Calendario del equipo</p>
                      <div className="space-y-2">
                        {teamMatches.map(m => {
                          const isHome = m.homeTeam === selectedTeamData.nombre;
                          const rival = isHome ? m.awayTeam : m.homeTeam;
                          const rivalFlag = teamFlags[rival];
                          return (
                              <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                                <div className="flex items-center gap-2">
                                  {rivalFlag
                                      ? <img src={rivalFlag} alt="" className="h-4 w-6 object-cover rounded" />
                                      : <span>{isHome ? m.awayFlag : m.homeFlag}</span>
                                  }
                                  <span>vs <strong>{rival}</strong></span>
                                  <Badge className={`text-[10px] border-0 h-4 ${isHome ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {isHome ? 'Local' : 'Visitante'}
                                  </Badge>
                                </div>
                                <div className="text-right text-xs text-gray-400">
                                  <p>{new Date(m.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</p>
                                  <p className="text-[10px]">{m.time}</p>
                                </div>
                              </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
  );
}