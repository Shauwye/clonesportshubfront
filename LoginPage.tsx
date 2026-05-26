import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import fondoMundial from "../../assets/fondoprincipal.png";
import wc26Logo from "../../assets/WC26_Logo.png";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "../components/ui/card";
import { Eye, EyeOff, Mail, Lock, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";


export function LoginPage() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return toast.error("El nombre de usuario es obligatorio.");
    if (!password.trim()) return toast.error("La contraseña es obligatoria.");
    try {
      setIsSubmitting(true);
      const success = await login(username.trim(), password);
      if (success) { toast.success("¡Bienvenido!"); navigate("/"); }
      else toast.error("Credenciales incorrectas.");
    } catch { toast.error("Error al iniciar sesión."); }
    finally { setIsSubmitting(false); }
  };

  const handleSoporteLogin = async () => {
    if (username !== SOPORTE_USER || password !== SOPORTE_PASS) {
      toast.error("Credenciales de soporte incorrectas.");
      return;
    }
    setIsSubmittingSoporte(true);
    try {
      const success = await login(SOPORTE_USER, SOPORTE_PASS);
      if (success) { toast.success("¡Bienvenido, Soporte!"); navigate("/"); }
      else toast.error("Error al ingresar.");
    } catch { toast.error("Error al iniciar sesión."); }
    finally { setIsSubmittingSoporte(false); }
  };

  return (
      <div className="relative min-h-screen overflow-hidden bg-[#041C3A]">
        <div className="absolute inset-0 bg-center bg-cover bg-no-repeat"
             style={{ backgroundImage: `url(${fondoMundial})` }} />

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-sm border-white/15 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
            <div className="h-2 w-full bg-[linear-gradient(90deg,#0057B8_0%,#00A86B_50%,#D7263D_100%)]" />

            <CardHeader className="text-center space-y-3 pb-3 pt-5">
              <div className="flex justify-center">
                <div className="relative size-20 rounded-2xl bg-black flex items-center justify-center shadow-lg overflow-hidden">
                  <img src={wc26Logo} alt="Logo Mundial 2026" className="h-14 w-auto object-contain" />
                </div>
              </div>
              <div>
                <CardTitle className="text-3xl font-extrabold tracking-tight text-[#041C3A]">
                  Mundial 2026 Hub
                </CardTitle>
                <CardDescription className="mt-2 text-sm text-slate-600">
                  Inicia sesión para vivir la experiencia del torneo
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[#041C3A] font-semibold">
                    Nombre de usuario
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input id="username" type="text" placeholder="usuario"
                           value={username} onChange={e => setUsername(e.target.value)}
                           className="pl-10 h-12 rounded-xl border-2 border-slate-200 focus-visible:ring-[#0057B8]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#041C3A] font-semibold">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input id="password" type={showPassword ? "text" : "password"}
                           placeholder="••••••••" value={password}
                           onChange={e => setPassword(e.target.value)}
                           className="pl-10 pr-12 h-12 rounded-xl border-2 border-slate-200 focus-visible:ring-[#00A86B]" />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={isSubmitting}
                        className="h-12 w-full rounded-xl text-base font-semibold text-white shadow-lg bg-[#8B000F] hover:bg-[#6F000C]">
                  {isSubmitting ? <><Loader2 className="size-4 animate-spin mr-2" />Ingresando...</> : "Iniciar sesión"}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                <span className="text-slate-600">¿No tienes cuenta? </span>
                <Link to="/registro"
                      className="font-semibold text-[#0057B8] hover:text-[#D7263D] hover:underline transition">
                  Regístrate aquí
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}