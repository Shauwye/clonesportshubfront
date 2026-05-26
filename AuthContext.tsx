import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  username: string;
  role?: string;
  usuarioId?: number;
  operadorId?: number;
  nombreCompleto?: string;
  avatarUrl?: string;
  pais?: string;
  ciudadResidencia?: string;
  zonaHoraria?: string;
  idioma?: string;
  telefono?: string;
  favoriteTeam?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshPerfil: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = "http://localhost:8081";

async function fetchPerfil(username: string, token: string): Promise<Partial<User>> {
  try {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
    const userRes = await fetch(`${API_URL}/user/getbyusername/${username}`, { headers });
    if (!userRes.ok) return {};
    const userData = await userRes.json();
    const usuarioId: number = userData.id;

    const perfilRes = await fetch(`${API_URL}/perfil/getbyusuarioid/${usuarioId}`, { headers });
    if (!perfilRes.ok || perfilRes.status === 204) return { usuarioId };

    const perfil = await perfilRes.json();
    return {
      usuarioId,
      nombreCompleto: perfil.nombreCompleto,
      avatarUrl: perfil.avatarUrl,
      pais: perfil.pais,
      ciudadResidencia: perfil.ciudadResidencia,
      zonaHoraria: perfil.zonaHoraria,
      idioma: perfil.idioma,
      telefono: perfil.telefono,
      favoriteTeam: localStorage.getItem("favoriteTeam") || undefined,
    };
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (token && username) {
      const baseUser: User = { username, role: role || undefined };
      setUser(baseUser);
      setIsAuthenticated(true);

      fetchPerfil(username, token).then((perfilData) => {
        const extra = role === "SOPORTE" ? { operadorId: 1 } : {};
        setUser((prev) => prev ? { ...prev, ...perfilData, ...extra } : prev);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const refreshPerfil = async () => {
    const role = localStorage.getItem("role");
    if (role === "SOPORTE") return;
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    if (!token || !username) return;
    const perfilData = await fetchPerfil(username, token);
    setUser((prev) => prev ? { ...prev, ...perfilData } : prev);
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ nombreUsuario: username.trim(), contrasenaHash: password }),
      });

      const text = await response.text();
      if (!response.ok) return false;

      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; }
      catch { data = { token: text }; }

      const token = data.token || data.jwt || data.accessToken || text;
      const role = data.role || "USER";

      localStorage.setItem("token", token);
      localStorage.setItem("username", username.trim());
      localStorage.setItem("role", role);

      const baseUser: User = { username: username.trim(), role };
      setUser(baseUser);
      setIsAuthenticated(true);

      // ── Soporte: no necesita perfil ni sobre diario ───────────
      if (role === "SOPORTE") {
        try {
          const perfilData = await fetchPerfil(username.trim(), token);
          setUser((prev) => prev ? { ...prev, ...perfilData, operadorId: 1 } : prev);
        } catch {}
        return true;
      }

      // ── Usuario normal: cargar perfil y dar sobre ─────────────
      fetchPerfil(username.trim(), token).then(async (perfilData) => {
        setUser((prev) => prev ? { ...prev, ...perfilData } : prev);
        if (role === "SOPORTE") return;

        if (perfilData.usuarioId) {
          const key = `loginPack_${perfilData.usuarioId}_${new Date().toDateString()}`;
          if (!localStorage.getItem(key)) {
            try {
              await fetch(`${API_URL}/paquetelaminas/create`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  usuarioId: perfilData.usuarioId,
                  nombre: "Sobre Login Diario",
                  tipoOrigen: "LOGIN_DIARIO",
                  cantidadLaminas: 5,
                  costoPuntos: 0,
                  estado: "DISPONIBLE",
                  fechaObtencion: new Date().toISOString(),
                  abierto: false,
                }),
              });
              localStorage.setItem(key, "true");
            } catch (e) {
              console.error("Error dando sobre de login:", e);
            }
          }
        }
      });

      return true;
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    const payload = {
      id: 0,
      nombreUsuario: username.trim(),
      correo: email.trim().toLowerCase(),
      contrasenaHash: password,
      estadoCuenta: "ACTIVA",
      intentosFallidos: 0,
      bloqueadoHasta: null,
      fechaRegistro: null,
      ultimoAcceso: null,
      role: "USER",
      activo: true,
    };
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("favoriteTeam");
    localStorage.removeItem("country");
    localStorage.removeItem("avatarUrl");
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
      <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout, refreshPerfil }}>
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}