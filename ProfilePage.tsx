import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { User, Settings, Trophy, BarChart3, Save, Smile, Loader2, Package, ArrowLeftRight, Coins, Target, TrendingUp, Star, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { guardarPerfil } from '../../services/perfilService';
import { getMyStats } from '../../services/quinielasService';
import { getInventario, getOrCreateAlbum, getLaminasCatalog, getPaquetesPendientes } from '../../services/albumService';
import { getOrCreateMonedas } from '../../services/intercambioService';
import { teamFlags } from '../data/teamFlags';

const mundialTeams = [
  { name: "Canadá", flag: "🇨🇦" }, { name: "Estados Unidos", flag: "🇺🇸" },
  { name: "México", flag: "🇲🇽" }, { name: "Argentina", flag: "🇦🇷" },
  { name: "Brasil", flag: "🇧🇷" }, { name: "Colombia", flag: "🇨🇴" },
  { name: "Uruguay", flag: "🇺🇾" }, { name: "Ecuador", flag: "🇪🇨" },
  { name: "Venezuela", flag: "🇻🇪" }, { name: "Alemania", flag: "🇩🇪" },
  { name: "Austria", flag: "🇦🇹" }, { name: "Bélgica", flag: "🇧🇪" },
  { name: "Croacia", flag: "🇭🇷" }, { name: "Dinamarca", flag: "🇩🇰" },
  { name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" }, { name: "España", flag: "🇪🇸" },
  { name: "Francia", flag: "🇫🇷" }, { name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Italia", flag: "🇮🇹" }, { name: "Países Bajos", flag: "🇳🇱" },
  { name: "Portugal", flag: "🇵🇹" }, { name: "Polonia", flag: "🇵🇱" },
  { name: "Serbia", flag: "🇷🇸" }, { name: "Suiza", flag: "🇨🇭" },
  { name: "Turquía", flag: "🇹🇷" }, { name: "Argelia", flag: "🇩🇿" },
  { name: "Camerún", flag: "🇨🇲" }, { name: "Costa de Marfil", flag: "🇨🇮" },
  { name: "Egipto", flag: "🇪🇬" }, { name: "Ghana", flag: "🇬🇭" },
  { name: "Marruecos", flag: "🇲🇦" }, { name: "Nigeria", flag: "🇳🇬" },
  { name: "Senegal", flag: "🇸🇳" }, { name: "Túnez", flag: "🇹🇳" },
  { name: "Arabia Saudita", flag: "🇸🇦" }, { name: "Australia", flag: "🇦🇺" },
  { name: "Corea del Sur", flag: "🇰🇷" }, { name: "Emiratos Árabes Unidos", flag: "🇦🇪" },
  { name: "Irán", flag: "🇮🇷" }, { name: "Irak", flag: "🇮🇶" },
  { name: "Japón", flag: "🇯🇵" }, { name: "Qatar", flag: "🇶🇦" },
  { name: "Costa Rica", flag: "🇨🇷" }, { name: "Jamaica", flag: "🇯🇲" },
  { name: "Panamá", flag: "🇵🇦" }, { name: "Nueva Zelanda", flag: "🇳🇿" },
  { name: "Paraguay", flag: "🇵🇾" }, { name: "Perú", flag: "🇵🇪" },
];

const idiomas = [
  { value: "es", label: "🇪🇸 Español" }, { value: "en", label: "🇬🇧 English" },
  { value: "fr", label: "🇫🇷 Français" }, { value: "de", label: "🇩🇪 Deutsch" },
  { value: "pt", label: "🇧🇷 Português" }, { value: "it", label: "🇮🇹 Italiano" },
  { value: "ar", label: "🇸🇦 العربية" }, { value: "ja", label: "🇯🇵 日本語" },
  { value: "ko", label: "🇰🇷 한국어" },
];

const zonaHorarias = [
  { value: "America/Bogota", label: "🇨🇴 Bogotá (UTC-5)" },
  { value: "America/New_York", label: "🇺🇸 Nueva York" },
  { value: "America/Chicago", label: "🇺🇸 Chicago" },
  { value: "America/Los_Angeles", label: "🇺🇸 Los Ángeles" },
  { value: "America/Mexico_City", label: "🇲🇽 Ciudad de México" },
  { value: "America/Toronto", label: "🇨🇦 Toronto" },
  { value: "America/Sao_Paulo", label: "🇧🇷 São Paulo" },
  { value: "America/Buenos_Aires", label: "🇦🇷 Buenos Aires" },
  { value: "America/Lima", label: "🇵🇪 Lima" },
  { value: "America/Caracas", label: "🇻🇪 Caracas" },
  { value: "Europe/London", label: "🇬🇧 Londres" },
  { value: "Europe/Madrid", label: "🇪🇸 Madrid" },
  { value: "Europe/Paris", label: "🇫🇷 París" },
  { value: "Europe/Berlin", label: "🇩🇪 Berlín" },
  { value: "Asia/Tokyo", label: "🇯🇵 Tokio" },
  { value: "Asia/Seoul", label: "🇰🇷 Seúl" },
  { value: "Asia/Dubai", label: "🇦🇪 Dubái" },
  { value: "Africa/Cairo", label: "🇪🇬 El Cairo" },
  { value: "Australia/Sydney", label: "🇦🇺 Sídney" },
];

const avatares = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Max&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia&backgroundColor=d1f4d1",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro&backgroundColor=d1f4d1",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Valeria&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Diego&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Camila&backgroundColor=ffd5dc",
];

// ── Barra de progreso simple ───────────────────────────────────
function ProgressBar({ value, max, color = 'bg-[#8B000F]' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div className={`h-2.5 rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
  );
}

// ── Stat card pequeña ──────────────────────────────────────────
function StatMini({ label, value, icon: Icon, color }: any) {
  return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
        <Icon className={`size-5 mx-auto mb-1.5 ${color}`} />
        <div className={`text-2xl font-black ${color}`}>{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      </div>
  );
}

export function ProfilePage() {
  const { user, refreshPerfil } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  // Datos del perfil
  const [nombreCompleto, setNombreCompleto] = useState(user?.nombreCompleto || '');
  const [telefono, setTelefono] = useState(user?.telefono || '');
  const [favoriteTeam, setFavoriteTeam] = useState(user?.favoriteTeam || localStorage.getItem("favoriteTeam") || '');
  const [pais, setPais] = useState(user?.pais || '');
  const [ciudadResidencia, setCiudadResidencia] = useState(user?.ciudadResidencia || '');
  const [zonaHoraria, setZonaHoraria] = useState(user?.zonaHoraria || '');
  const [idioma, setIdioma] = useState(user?.idioma || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || localStorage.getItem("avatarUrl") || '');

  // Stats reales
  const [statsPollas, setStatsPollas] = useState<any>(null);
  const [statsAlbum, setStatsAlbum] = useState<any>(null);
  const [monedas, setMonedas] = useState<any>(null);

  const displayName = nombreCompleto || user?.username || 'Usuario';
  const userInitial = displayName.charAt(0).toUpperCase();

  // Bandera del equipo favorito y país
  const flagEquipo = favoriteTeam ? (teamFlags[favoriteTeam] || null) : null;
  const flagPais = pais ? (teamFlags[pais] || null) : null;
  const emojiEquipo = mundialTeams.find(t => t.name === favoriteTeam)?.flag || '';
  const emojiPais = mundialTeams.find(t => t.name === pais)?.flag || '';

  useEffect(() => {
    async function cargarStats() {
      if (!user?.usuarioId) return;
      setLoadingStats(true);
      try {
        const [statsP, inventario, album, catalogo, paquetes, mon] = await Promise.all([
          getMyStats(user.usuarioId).catch(() => null),
          getInventario(user.usuarioId),
          getOrCreateAlbum(user.usuarioId),
          getLaminasCatalog(),
          getPaquetesPendientes(user.usuarioId),
          getOrCreateMonedas(user.usuarioId).catch(() => null),
        ]);

        setStatsPollas(statsP);
        setMonedas(mon);

        // Calcular stats del álbum desde BD
        const total = catalogo.length;
        const unicas = new Set(inventario.map((i: any) => i.laminaId)).size;
        const pegadas = inventario.filter((i: any) => i.pegada).length;
        const repetidas = inventario.filter((i: any) => i.esRepetida).length;
        const epicas = inventario.filter((i: any) => {
          const lam = catalogo.find((l: any) => String(l.id) === String(i.laminaId));
          return lam?.rareza === 'EPICA';
        }).length;
        const raras = inventario.filter((i: any) => {
          const lam = catalogo.find((l: any) => String(l.id) === String(i.laminaId));
          return lam?.rareza === 'RARA';
        }).length;

        setStatsAlbum({
          total,
          unicas,
          pegadas,
          repetidas,
          epicas,
          raras,
          paquetesPendientes: paquetes.length,
          porcentaje: album?.porcentajeCompletitud || (total > 0 ? (unicas / total) * 100 : 0),
        });
      } finally {
        setLoadingStats(false);
      }
    }
    cargarStats();
  }, [user?.usuarioId]);

  const handleSave = async () => {
    if (!user?.username) return;
    setSaving(true);
    try {
      await guardarPerfil({
        username: user.username,
        avatarUrl, nombreCompleto, telefono,
        pais, ciudadResidencia, zonaHoraria, idioma,
        equipoFavorito: favoriteTeam,
      });
      localStorage.setItem("favoriteTeam", favoriteTeam);
      localStorage.setItem("avatarUrl", avatarUrl);
      await refreshPerfil();
      toast.success('✅ Perfil actualizado');
    } catch {
      toast.error('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
      <div className="space-y-6 pb-20 lg:pb-8 px-4 md:px-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-1">
            <User className="size-7 text-[#8B000F]" /> Mi Perfil
          </h1>
          <p className="text-gray-500 text-sm">Gestiona tu información y revisa tus estadísticas</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Tarjeta de perfil ──────────────────────────────────── */}
          <Card className="lg:col-span-1 border-0 shadow-md overflow-hidden">
            {/* Banner con bandera del equipo */}
            <div className="h-24 relative overflow-hidden bg-gradient-to-br from-[#041C3A] to-[#0a3060]">
              {flagEquipo && (
                  <img src={flagEquipo} alt={favoriteTeam}
                       className="absolute inset-0 w-full h-full object-cover opacity-30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            <CardContent className="p-6 -mt-10 relative">
              <div className="flex flex-col items-center text-center">
                {/* Avatar con botón de cambio */}
                <div className="relative mb-3">
                  <div className="size-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                    {avatarUrl
                        ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-blue-600">{userInitial}</div>
                    }
                  </div>
                  <button onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                          className="absolute bottom-0 right-0 bg-[#8B000F] text-white rounded-full p-1.5 shadow-md hover:bg-[#6B0008] transition-colors">
                    <Smile className="size-3.5" />
                  </button>
                </div>

                {/* Selector de avatar */}
                {showAvatarPicker && (
                    <div className="w-full mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500 mb-2 font-medium">Elige tu avatar:</p>
                      <div className="grid grid-cols-6 gap-1.5">
                        {avatares.map((url, i) => (
                            <button key={i} onClick={() => { setAvatarUrl(url); setShowAvatarPicker(false); }}
                                    className={`rounded-full overflow-hidden border-3 transition-all hover:scale-110 ${avatarUrl === url ? 'ring-2 ring-[#8B000F] scale-110' : ''}`}>
                              <img src={url} alt={`Avatar ${i + 1}`} className="w-full h-full" />
                            </button>
                        ))}
                      </div>
                    </div>
                )}

                <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
                <p className="text-gray-400 text-sm mb-3">@{user?.username}</p>

                {/* Equipo favorito con bandera real */}
                {favoriteTeam && (
                    <div className="flex items-center gap-2 bg-[#041C3A]/5 border border-[#041C3A]/10 px-4 py-2 rounded-full mb-2">
                      {flagEquipo
                          ? <img src={flagEquipo} alt={favoriteTeam} className="h-5 w-7 object-cover rounded-sm" />
                          : <span className="text-xl">{emojiEquipo}</span>
                      }
                      <span className="font-semibold text-sm text-[#041C3A]">{favoriteTeam}</span>
                    </div>
                )}

                {/* País con bandera real */}
                {pais && (
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                      {flagPais
                          ? <img src={flagPais} alt={pais} className="h-4 w-5 object-cover rounded-sm" />
                          : <span>{emojiPais}</span>
                      }
                      <span>{ciudadResidencia ? `${ciudadResidencia}, ` : ''}{pais}</span>
                    </div>
                )}

                {/* Mini stats en la tarjeta */}
                {!loadingStats && statsAlbum && (
                    <div className="w-full mt-4 grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-lg font-black text-[#8B000F]">{Math.round(statsAlbum.porcentaje)}%</div>
                        <div className="text-[10px] text-gray-400">Álbum</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-black text-blue-600">{statsPollas?.pollas || 0}</div>
                        <div className="text-[10px] text-gray-400">Pollas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-black text-yellow-600">{monedas?.saldoActual || 0}</div>
                        <div className="text-[10px] text-gray-400">Monedas</div>
                      </div>
                    </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Tabs ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="stats" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="stats">
                  <BarChart3 className="size-4 mr-1.5" /> Dashboard
                </TabsTrigger>
                <TabsTrigger value="info">
                  <Settings className="size-4 mr-1.5" /> Perfil
                </TabsTrigger>
                <TabsTrigger value="logros">
                  <Trophy className="size-4 mr-1.5" /> Logros
                </TabsTrigger>
              </TabsList>

              {/* ── TAB DASHBOARD ─────────────────────────────────── */}
              <TabsContent value="stats" className="space-y-4 mt-4">
                {loadingStats ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="size-8 animate-spin text-[#8B000F]" />
                    </div>
                ) : (
                    <>
                      {/* ── ÁLBUM ── */}
                      <Card className="border-0 shadow-md">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Package className="size-4 text-[#8B000F]" /> Álbum Digital
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Progreso general */}
                          <div>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-sm font-medium text-gray-700">Progreso total</span>
                              <span className="text-sm font-black text-[#8B000F]">
                            {statsAlbum?.unicas || 0} / {statsAlbum?.total || 0} láminas
                          </span>
                            </div>
                            <ProgressBar value={statsAlbum?.unicas || 0} max={statsAlbum?.total || 1} />
                            <p className="text-xs text-gray-400 mt-1">{Math.round(statsAlbum?.porcentaje || 0)}% completado</p>
                          </div>

                          {/* Grid de stats álbum */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatMini label="Pegadas" value={statsAlbum?.pegadas || 0} icon={CheckCircle2} color="text-green-600" />
                            <StatMini label="Repetidas" value={statsAlbum?.repetidas || 0} icon={ArrowLeftRight} color="text-blue-600" />
                            <StatMini label="Épicas" value={statsAlbum?.epicas || 0} icon={Star} color="text-yellow-500" />
                            <StatMini label="Sobres" value={statsAlbum?.paquetesPendientes || 0} icon={Package} color="text-[#8B000F]" />
                          </div>

                          {/* Barra por rareza */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Distribución por rareza</p>
                            <div className="space-y-1.5">
                              {[
                                { label: 'Comunes', value: (statsAlbum?.unicas || 0) - (statsAlbum?.raras || 0) - (statsAlbum?.epicas || 0), color: 'bg-gray-400', max: statsAlbum?.unicas || 1 },
                                { label: 'Raras', value: statsAlbum?.raras || 0, color: 'bg-purple-500', max: statsAlbum?.unicas || 1 },
                                { label: 'Épicas', value: statsAlbum?.epicas || 0, color: 'bg-yellow-500', max: statsAlbum?.unicas || 1 },
                              ].map(r => (
                                  <div key={r.label} className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 w-16">{r.label}</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                      <div className={`h-2 rounded-full ${r.color} transition-all duration-700`}
                                           style={{ width: `${r.max > 0 ? (r.value / r.max) * 100 : 0}%` }} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-600 w-6 text-right">{r.value}</span>
                                  </div>
                              ))}
                            </div>
                          </div>

                          {/* Monedas */}
                          <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                            <div className="flex items-center gap-2">
                              <Coins className="size-5 text-yellow-600" />
                              <span className="text-sm font-semibold text-yellow-800">Monedas de intercambio</span>
                            </div>
                            <span className="text-2xl font-black text-yellow-700">{monedas?.saldoActual || 0} 🪙</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* ── POLLAS ── */}
                      <Card className="border-0 shadow-md">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Trophy className="size-4 text-[#8B000F]" /> Pollas Futboleras
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {!statsPollas ? (
                              <div className="text-center py-6 text-gray-400">
                                <Trophy className="size-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No hay datos de pollas disponibles</p>
                              </div>
                          ) : (
                              <>
                                {/* Stats pollas */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <StatMini label="Pollas activas" value={statsPollas.pollas || 0} icon={Trophy} color="text-[#8B000F]" />
                                  <StatMini label="Pronósticos" value={statsPollas.total || 0} icon={Target} color="text-blue-600" />
                                  <StatMini label="Precisión" value={`${statsPollas.accuracy || 0}%`} icon={BarChart3} color="text-green-600" />
                                  <StatMini label="Mejor racha" value={statsPollas.streak || 0} icon={TrendingUp} color="text-purple-600" />
                                </div>

                                {/* Barra de precisión */}
                                <div>
                                  <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-sm font-medium text-gray-700">Tasa de acierto</span>
                                    <span className="text-sm font-black text-green-600">{statsPollas.accuracy || 0}%</span>
                                  </div>
                                  <ProgressBar
                                      value={statsPollas.accuracy || 0}
                                      max={100}
                                      color={statsPollas.accuracy >= 70 ? 'bg-green-500' : statsPollas.accuracy >= 40 ? 'bg-yellow-500' : 'bg-red-400'}
                                  />
                                </div>

                                {/* Desglose pronósticos */}
                                {(statsPollas.exactos !== undefined || statsPollas.correctos !== undefined) && (
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                      {[
                                        { label: 'Exactos', value: statsPollas.exactos || 0, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', pts: '+3 pts' },
                                        { label: 'Correctos', value: statsPollas.correctos || 0, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', pts: '+1 pt' },
                                        { label: 'Fallados', value: (statsPollas.total || 0) - (statsPollas.exactos || 0) - (statsPollas.correctos || 0), bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', pts: '0 pts' },
                                      ].map(s => (
                                          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-3`}>
                                            <div className={`text-2xl font-black ${s.text}`}>{s.value}</div>
                                            <div className="text-xs text-gray-500">{s.label}</div>
                                            <div className={`text-[10px] font-semibold ${s.text} mt-0.5`}>{s.pts}</div>
                                          </div>
                                      ))}
                                    </div>
                                )}
                              </>
                          )}
                        </CardContent>
                      </Card>
                    </>
                )}
              </TabsContent>

              {/* ── TAB INFORMACIÓN ───────────────────────────────── */}
              <TabsContent value="info" className="mt-4">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base">Información Personal</CardTitle>
                    <CardDescription>Actualiza tu información de perfil</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[#041C3A] font-semibold text-sm">Nombre completo</Label>
                        <Input value={nombreCompleto} onChange={e => setNombreCompleto(e.target.value)}
                               placeholder="Tu nombre completo"
                               className="h-11 rounded-xl border-2 border-slate-200" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#041C3A] font-semibold text-sm">
                          Teléfono <span className="text-gray-400 font-normal text-xs">(opcional)</span>
                        </Label>
                        <Input value={telefono} onChange={e => setTelefono(e.target.value)}
                               placeholder="+57 300 123 4567"
                               className="h-11 rounded-xl border-2 border-slate-200" />
                      </div>
                    </div>

                    {/* Equipo favorito con bandera */}
                    <div className="space-y-1.5">
                      <Label className="text-[#041C3A] font-semibold text-sm">Equipo favorito</Label>
                      <div className="flex items-center gap-3">
                        {flagEquipo && (
                            <img src={flagEquipo} alt={favoriteTeam} className="h-8 w-12 object-cover rounded-md shadow-sm flex-shrink-0" />
                        )}
                        <Select value={favoriteTeam} onValueChange={setFavoriteTeam}>
                          <SelectTrigger className="h-11 rounded-xl border-2 border-slate-200 flex-1">
                            <SelectValue placeholder="Selecciona un equipo" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            {mundialTeams.map(t => (
                                <SelectItem key={t.name} value={t.name}>
                                  {teamFlags[t.name]
                                      ? <span className="flex items-center gap-2">
                                    <img src={teamFlags[t.name]} alt={t.name} className="h-4 w-5 object-cover rounded-sm inline" />
                                        {t.name}
                                  </span>
                                      : `${t.flag} ${t.name}`
                                  }
                                </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* País */}
                      <div className="space-y-1.5">
                        <Label className="text-[#041C3A] font-semibold text-sm">País</Label>
                        <div className="flex items-center gap-2">
                          {flagPais && (
                              <img src={flagPais} alt={pais} className="h-7 w-10 object-cover rounded-md shadow-sm flex-shrink-0" />
                          )}
                          <Select value={pais} onValueChange={setPais}>
                            <SelectTrigger className="h-11 rounded-xl border-2 border-slate-200 flex-1">
                              <SelectValue placeholder="Tu país" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              {mundialTeams.map(t => (
                                  <SelectItem key={t.name} value={t.name}>{t.flag} {t.name}</SelectItem>
                              ))}
                              <SelectItem value="Otro">🌎 Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[#041C3A] font-semibold text-sm">Ciudad</Label>
                        <Input value={ciudadResidencia} onChange={e => setCiudadResidencia(e.target.value)}
                               placeholder="Ej: Bogotá"
                               className="h-11 rounded-xl border-2 border-slate-200" />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[#041C3A] font-semibold text-sm">Zona horaria</Label>
                        <Select value={zonaHoraria} onValueChange={setZonaHoraria}>
                          <SelectTrigger className="h-11 rounded-xl border-2 border-slate-200">
                            <SelectValue placeholder="Zona horaria" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            {zonaHorarias.map(z => (
                                <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#041C3A] font-semibold text-sm">Idioma</Label>
                        <Select value={idioma} onValueChange={setIdioma}>
                          <SelectTrigger className="h-11 rounded-xl border-2 border-slate-200">
                            <SelectValue placeholder="Idioma" />
                          </SelectTrigger>
                          <SelectContent>
                            {idiomas.map(i => (
                                <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button onClick={handleSave} disabled={saving}
                            className="w-full h-11 rounded-xl bg-[#8B000F] hover:bg-[#6B0008] text-white font-semibold">
                      {saving ? <><Loader2 className="size-4 animate-spin mr-2" />Guardando...</> : <><Save className="size-4 mr-2" />Guardar cambios</>}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── TAB LOGROS ────────────────────────────────────── */}
              <TabsContent value="logros" className="mt-4">
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    {
                      emoji: '📖', title: 'Coleccionista Inicial',
                      desc: 'Abre tu primer sobre',
                      unlocked: (statsAlbum?.unicas || 0) > 0,
                      progress: Math.min(1, statsAlbum?.unicas || 0), max: 1,
                    },
                    {
                      emoji: '🃏', title: 'Medio Álbum',
                      desc: 'Completa el 50% del álbum',
                      unlocked: (statsAlbum?.porcentaje || 0) >= 50,
                      progress: Math.round(statsAlbum?.porcentaje || 0), max: 50,
                    },
                    {
                      emoji: '⭐', title: 'Cazador de Épicas',
                      desc: 'Consigue 5 láminas épicas',
                      unlocked: (statsAlbum?.epicas || 0) >= 5,
                      progress: statsAlbum?.epicas || 0, max: 5,
                    },
                    {
                      emoji: '🏆', title: 'Primer Pronosticador',
                      desc: 'Haz tu primer pronóstico',
                      unlocked: (statsPollas?.total || 0) > 0,
                      progress: Math.min(1, statsPollas?.total || 0), max: 1,
                    },
                    {
                      emoji: '🎯', title: 'Predictor Certero',
                      desc: '70% de precisión en pronósticos',
                      unlocked: (statsPollas?.accuracy || 0) >= 70,
                      progress: statsPollas?.accuracy || 0, max: 70,
                    },
                    {
                      emoji: '🤝', title: 'Maestro del Intercambio',
                      desc: 'Realiza 5 intercambios',
                      unlocked: false,
                      progress: 0, max: 5,
                    },
                    {
                      emoji: '💰', title: 'Acumulador',
                      desc: 'Acumula 20 monedas',
                      unlocked: (monedas?.saldoActual || 0) >= 20,
                      progress: monedas?.saldoActual || 0, max: 20,
                    },
                    {
                      emoji: '📚', title: 'Álbum Completo',
                      desc: 'Completa el álbum al 100%',
                      unlocked: (statsAlbum?.porcentaje || 0) >= 100,
                      progress: Math.round(statsAlbum?.porcentaje || 0), max: 100,
                    },
                  ].map(logro => (
                      <Card key={logro.title}
                            className={`border-0 shadow-sm transition-all ${logro.unlocked ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200' : 'bg-gray-50 opacity-70'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`text-3xl ${logro.unlocked ? '' : 'grayscale opacity-50'}`}>{logro.emoji}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-bold text-sm">{logro.title}</p>
                                {logro.unlocked && <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">✓ Desbloqueado</Badge>}
                              </div>
                              <p className="text-xs text-gray-500 mb-2">{logro.desc}</p>
                              <ProgressBar
                                  value={logro.progress}
                                  max={logro.max}
                                  color={logro.unlocked ? 'bg-yellow-500' : 'bg-gray-400'}
                              />
                              <p className="text-[10px] text-gray-400 mt-1">{Math.min(logro.progress, logro.max)}/{logro.max}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
  );
}