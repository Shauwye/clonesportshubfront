import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Trophy } from "lucide-react";
import { toast } from "sonner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const validatePassword = (password: string) => {
    if (password.length < 8) return "La contraseña debe tener mínimo 8 caracteres.";
    if (!/[A-Z]/.test(password)) return "Debe tener al menos una mayúscula.";
    if (!/[a-z]/.test(password)) return "Debe tener al menos una minúscula.";
    if (!/[0-9]/.test(password)) return "Debe tener al menos un número.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Debe tener al menos un carácter especial.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      toast.error("El nombre de usuario es obligatorio.");
      return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      toast.error("Ingresa un correo electrónico válido.");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    try {
      await register(cleanName, cleanEmail, password);
      toast.success("¡Cuenta creada exitosamente!");
      navigate("/login");
    } catch (error) {
      toast.error("Error al crear la cuenta. El usuario o correo ya puede existir.");
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="size-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl flex items-center justify-center">
                <Trophy className="size-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Únete al Mundial 2026</CardTitle>
            <CardDescription>Crea tu cuenta para comenzar</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de usuario</Label>
                <Input
                    id="name"
                    type="text"
                    placeholder="juanperez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <p className="text-xs text-gray-500">
                  Debe tener mayúscula, minúscula, número y carácter especial.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
              </div>

              <Button type="submit" className="w-full">
                Crear cuenta
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600">¿Ya tienes cuenta? </span>
              <Link to="/login" className="text-blue-600 hover:underline">
                Inicia sesión aquí
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}