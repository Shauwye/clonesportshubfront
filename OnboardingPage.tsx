import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { Trophy, MapPin, Users, User, Smile } from "lucide-react";
import { guardarPerfil } from "../../services/perfilService";
import { guardarAgendaPersonal } from "../../services/agendaService";
import fondoMundial from "../../assets/fondoprincipal.png";
import wc26Logo from "../../assets/WC26_Logo.png";

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
  { value: "America/New_York", label: "🇺🇸 Nueva York (UTC-5/-4)" },
  { value: "America/Chicago", label: "🇺🇸 Chicago (UTC-6/-5)" },
  { value: "America/Denver", label: "🇺🇸 Denver (UTC-7/-6)" },
  { value: "America/Los_Angeles", label: "🇺🇸 Los Ángeles (UTC-8/-7)" },
  { value: "America/Mexico_City", label: "🇲🇽 Ciudad de México (UTC-6)" },
  { value: "America/Toronto", label: "🇨🇦 Toronto (UTC-5/-4)" },
  { value: "America/Vancouver", label: "🇨🇦 Vancouver (UTC-8/-7)" },
  { value: "America/Sao_Paulo", label: "🇧🇷 São Paulo (UTC-3)" },
  { value: "America/Buenos_Aires", label: "🇦🇷 Buenos Aires (UTC-3)" },
  { value: "America/Lima", label: "🇵🇪 Lima (UTC-5)" },
  { value: "America/Caracas", label: "🇻🇪 Caracas (UTC-4)" },
  { value: "Europe/London", label: "🇬🇧 Londres (UTC+0/+1)" },
  { value: "Europe/Madrid", label: "🇪🇸 Madrid (UTC+1/+2)" },
  { value: "Europe/Paris", label: "🇫🇷 París (UTC+1/+2)" },
  { value: "Europe/Berlin", label: "🇩🇪 Berlín (UTC+1/+2)" },
  { value: "Europe/Rome", label: "🇮🇹 Roma (UTC+1/+2)" },
  { value: "Europe/Lisbon", label: "🇵🇹 Lisboa (UTC+0/+1)" },
  { value: "Asia/Tokyo", label: "🇯🇵 Tokio (UTC+9)" },
  { value: "Asia/Seoul", label: "🇰🇷 Seúl (UTC+9)" },
  { value: "Asia/Dubai", label: "🇦🇪 Dubái (UTC+4)" },
  { value: "Asia/Riyadh", label: "🇸🇦 Riad (UTC+3)" },
  { value: "Africa/Cairo", label: "🇪🇬 El Cairo (UTC+2)" },
  { value: "Australia/Sydney", label: "🇦🇺 Sídney (UTC+10/+11)" },
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

// Colores por step
const STEP_CONFIG = [
  { icon: Trophy,  color: "#0057B8", label: "Equipo favorito",    desc: "¿A quién vas a apoyar?" },
  { icon: Smile,   color: "#00A86B", label: "Elige tu avatar",    desc: "Selecciona cómo te verán" },
  { icon: User,    color: "#0057B8", label: "Datos personales",   desc: "Cuéntanos sobre ti" },
  { icon: MapPin,  color: "#00A86B", label: "Ubicación e idioma", desc: "Personaliza tu experiencia" },
  { icon: Users,   color: "#D7263D", label: "¡Todo listo!",       desc: "Revisa tu perfil" },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshPerfil } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [country, setCountry] = useState("");
  const [ciudadResidencia, setCiudadResidencia] = useState("");
  const [zonaHoraria, setZonaHoraria] = useState("");
  const [idioma, setIdioma] = useState("");

  const totalSteps = 5;
  const currentConfig = STEP_CONFIG[step - 1];
  const StepIcon = currentConfig.icon;

  const handleComplete = async () => {
    if (!user?.username) {
      toast.error("Sesión expirada. Por favor inicia sesión de nuevo.");
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);
    try {
      await guardarPerfil({
        username: user.username,
        avatarUrl, nombreCompleto, telefono,
        pais: country, ciudadResidencia, zonaHoraria, idioma,
        equipoFavorito: favoriteTeam,
      });

      localStorage.setItem("favoriteTeam", favoriteTeam);
      localStorage.setItem("country", country);
      localStorage.setItem("avatarUrl", avatarUrl);
      localStorage.setItem("onboardingCompleted", "true");

      await refreshPerfil();

      const perfilActualizado = await (async () => {
        const token = localStorage.getItem("token");
        const username = localStorage.getItem("username");
        if (!token || !username) return null;
        const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
        const userRes = await fetch(`http://localhost:8081/user/getbyusername/${username}`, { headers });
        if (!userRes.ok) return null;
        return await userRes.json();
      })();

      if (perfilActualizado?.id) {
        await guardarAgendaPersonal({ usuarioId: perfilActualizado.id, favoriteTeam, pais: country });
      }

      toast.success("¡Perfil completado! Bienvenido al Mundial 2026 🏆");
      navigate("/", { replace: true });
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el perfil. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="relative min-h-screen overflow-hidden bg-[#041C3A]">
        {/* Fondo igual al login */}
        <div
            className="absolute inset-0 bg-center bg-cover bg-no-repeat"
            style={{ backgroundImage: `url(${fondoMundial})` }}
        />
        <div className="absolute inset-0 bg-[#041C3A]/40" />

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-white/15 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">

            {/* Barra de color top — igual al login */}
            <div className="h-2 w-full bg-[linear-gradient(90deg,#0057B8_0%,#00A86B_50%,#D7263D_100%)]" />

            <CardHeader className="text-center space-y-3 pb-3 pt-5">
              {/* Logo */}
              <div className="flex justify-center">
                <div className="relative size-16 rounded-2xl bg-black flex items-center justify-center shadow-lg overflow-hidden">
                  <img src={wc26Logo} alt="Logo Mundial 2026" className="h-11 w-auto object-contain" />
                </div>
              </div>

              <div>
                <CardTitle className="text-2xl font-extrabold tracking-tight text-[#041C3A]">
                  Completa tu perfil
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-slate-600">
                  Solo la primera vez — después vas directo al hub
                </CardDescription>
              </div>

              {/* Indicador de pasos */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <div key={i} className="relative">
                      <div className={`h-2 rounded-full transition-all duration-300 ${
                          i + 1 < step ? 'w-6 bg-[#00A86B]' :
                              i + 1 === step ? 'w-10 bg-[#0057B8]' :
                                  'w-6 bg-slate-200'
                      }`} />
                    </div>
                ))}
              </div>

              {/* Título del step actual */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <StepIcon className="size-4" style={{ color: currentConfig.color }} />
                <span className="text-sm font-semibold text-slate-700">{currentConfig.label}</span>
                <span className="text-xs text-slate-400">· {step}/{totalSteps}</span>
              </div>
            </CardHeader>

            <CardContent className="pb-6 space-y-5">

              {/* ── STEP 1: Equipo favorito ── */}
              {step === 1 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500 text-center">{currentConfig.desc}</p>
                    <div className="space-y-2">
                      <Label className="text-[#041C3A] font-semibold">Equipo favorito</Label>
                      <Select value={favoriteTeam} onValueChange={setFavoriteTeam}>
                        <SelectTrigger className="h-11 rounded-xl border-2 border-slate-200">
                          <SelectValue placeholder="Selecciona un equipo" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {mundialTeams.map((team) => (
                              <SelectItem key={team.name} value={team.name}>
                                {team.flag} {team.name}
                              </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                        onClick={() => setStep(2)}
                        disabled={!favoriteTeam}
                        className="h-11 w-full rounded-xl font-semibold text-white bg-[#0057B8] hover:bg-[#004494]">
                      Continuar →
                    </Button>
                  </div>
              )}

              {/* ── STEP 2: Avatar ── */}
              {step === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500 text-center">{currentConfig.desc}</p>
                    <div className="flex justify-center">
                      <div className="size-20 rounded-full border-4 border-[#00A86B] bg-gray-100 overflow-hidden flex items-center justify-center shadow-md">
                        {avatarUrl
                            ? <img src={avatarUrl} alt="Avatar" className="w-full h-full" />
                            : <User className="size-10 text-gray-400" />
                        }
                      </div>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {avatares.map((url, index) => (
                          <button key={index} onClick={() => setAvatarUrl(url)}
                                  className={`rounded-full overflow-hidden border-4 transition-all hover:scale-110 ${
                                      avatarUrl === url ? "border-[#00A86B] scale-110" : "border-transparent"
                                  }`}>
                            <img src={url} alt={`Avatar ${index + 1}`} className="w-full h-full" />
                          </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => setStep(1)} variant="outline"
                              className="h-11 rounded-xl border-2 border-slate-200">
                        ← Atrás
                      </Button>
                      <Button onClick={() => setStep(3)} disabled={!avatarUrl}
                              className="h-11 rounded-xl font-semibold text-white bg-[#00A86B] hover:bg-[#008a57]">
                        Continuar →
                      </Button>
                    </div>
                  </div>
              )}

              {/* ── STEP 3: Datos personales ── */}
              {step === 3 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500 text-center">{currentConfig.desc}</p>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-[#041C3A] font-semibold">Nombre completo</Label>
                        <Input placeholder="Ej: Juan David Rodríguez"
                               value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)}
                               className="h-11 rounded-xl border-2 border-slate-200 focus-visible:ring-[#0057B8]" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#041C3A] font-semibold">
                          Teléfono <span className="text-slate-400 font-normal text-xs">(opcional)</span>
                        </Label>
                        <Input placeholder="+57 300 123 4567"
                               value={telefono} onChange={(e) => setTelefono(e.target.value)}
                               className="h-11 rounded-xl border-2 border-slate-200 focus-visible:ring-[#0057B8]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => setStep(2)} variant="outline"
                              className="h-11 rounded-xl border-2 border-slate-200">
                        ← Atrás
                      </Button>
                      <Button onClick={() => setStep(4)} disabled={!nombreCompleto.trim()}
                              className="h-11 rounded-xl font-semibold text-white bg-[#0057B8] hover:bg-[#004494]">
                        Continuar →
                      </Button>
                    </div>
                  </div>
              )}

              {/* ── STEP 4: Ubicación e idioma ── */}
              {step === 4 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500 text-center">{currentConfig.desc}</p>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-[#041C3A] font-semibold">País</Label>
                        <Select value={country} onValueChange={setCountry}>
                          <SelectTrigger className="h-11 rounded-xl border-2 border-slate-200">
                            <SelectValue placeholder="Selecciona tu país" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            {mundialTeams.map((team) => (
                                <SelectItem key={team.name} value={team.name}>
                                  {team.flag} {team.name}
                                </SelectItem>
                            ))}
                            <SelectItem value="Otro">🌎 Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#041C3A] font-semibold">Ciudad de residencia</Label>
                        <Input placeholder="Ej: Bogotá"
                               value={ciudadResidencia} onChange={(e) => setCiudadResidencia(e.target.value)}
                               className="h-11 rounded-xl border-2 border-slate-200 focus-visible:ring-[#00A86B]" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#041C3A] font-semibold">Zona horaria</Label>
                        <Select value={zonaHoraria} onValueChange={setZonaHoraria}>
                          <SelectTrigger className="h-11 rounded-xl border-2 border-slate-200">
                            <SelectValue placeholder="Selecciona tu zona horaria" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            {zonaHorarias.map((z) => (
                                <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#041C3A] font-semibold">Idioma preferido</Label>
                        <Select value={idioma} onValueChange={setIdioma}>
                          <SelectTrigger className="h-11 rounded-xl border-2 border-slate-200">
                            <SelectValue placeholder="Selecciona tu idioma" />
                          </SelectTrigger>
                          <SelectContent>
                            {idiomas.map((i) => (
                                <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => setStep(3)} variant="outline"
                              className="h-11 rounded-xl border-2 border-slate-200">
                        ← Atrás
                      </Button>
                      <Button onClick={() => setStep(5)}
                              disabled={!country || !ciudadResidencia.trim() || !zonaHoraria || !idioma}
                              className="h-11 rounded-xl font-semibold text-white bg-[#00A86B] hover:bg-[#008a57]">
                        Continuar →
                      </Button>
                    </div>
                  </div>
              )}

              {/* ── STEP 5: Resumen ── */}
              {step === 5 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500 text-center">{currentConfig.desc}</p>

                    <div className="flex justify-center">
                      <img src={avatarUrl} alt="Tu avatar"
                           className="size-20 rounded-full border-4 border-[#D7263D] shadow-lg" />
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                      {[
                        { label: "Nombre", value: nombreCompleto },
                        telefono ? { label: "Teléfono", value: telefono } : null,
                        { label: "Equipo favorito", value: favoriteTeam },
                        { label: "País", value: country },
                        { label: "Ciudad", value: ciudadResidencia },
                        { label: "Zona horaria", value: zonaHoraria },
                        { label: "Idioma", value: idiomas.find(i => i.value === idioma)?.label || idioma },
                      ].filter(Boolean).map((item: any) => (
                          <div key={item.label} className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium">{item.label}</span>
                            <span className="text-[#041C3A] font-semibold">{item.value}</span>
                          </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                      <p className="text-xs text-blue-700 font-semibold mb-1">Podrás disfrutar de:</p>
                      <div className="grid grid-cols-2 gap-1 text-xs text-blue-600">
                        <span>✅ Quinielas</span>
                        <span>✅ Álbum digital</span>
                        <span>✅ Entradas</span>
                        <span>✅ Grupos</span>
                        <span>✅ Agenda</span>
                        <span>✅ Sobres diarios</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => setStep(4)} variant="outline" disabled={loading}
                              className="h-11 rounded-xl border-2 border-slate-200">
                        ← Atrás
                      </Button>
                      <Button onClick={handleComplete} disabled={loading}
                              className="h-11 rounded-xl font-semibold text-white shadow-lg bg-[#D7263D] hover:bg-[#b51e30]">
                        {loading ? "Guardando..." : "¡Comenzar! 🏆"}
                      </Button>
                    </div>
                  </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  );
}