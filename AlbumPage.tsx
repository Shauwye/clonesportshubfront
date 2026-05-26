import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { teamFlags } from '../data/teamFlags';
import { teamAssets } from '../data/teamAssets';
import {
  Package, Sparkles, ArrowLeftRight, Loader2,
  BookOpen, Gift, Search, CheckCircle2, Lock, Zap, Coins,
} from 'lucide-react';


import {
  getLaminasCatalog, getPaquetesPendientes, claimDailyPack,
  redeemPromoCode, openPack, getColeccionCompleta, pegarLamina,
  getOrCreateAlbum, getInventario,
} from '../../services/albumService';
import {
  getIntercambiosPendientes, proponerIntercambio, aceptarIntercambio,
  rechazarIntercambio, cancelarIntercambio, intercambiarConMonedas,
  convertirRepetidas, getOrCreateMonedas, buscarUsuarioPorUsername, LIMITES,
} from '../../services/intercambioService';

// ── RAREZA ────────────────────────────────────────────────────
const RAREZA = {
  COMUN: { label: 'Común', border: 'border-gray-300',   bg: 'bg-gray-50',   badge: 'bg-gray-100 text-gray-700',    glow: '' },
  RARA:  { label: 'Rara',  border: 'border-purple-400', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-700', glow: 'shadow-purple-200 shadow-lg' },
  EPICA: { label: 'Épica', border: 'border-yellow-400', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700', glow: 'shadow-yellow-300 shadow-xl' },
};

const CATEGORIA = {
  ESCUDO:  { label: 'Escudo',  emoji: '' },
  AVATAR:  { label: 'Avatar',  emoji: '' },
  BANDERA: { label: 'Bandera', emoji: '' },
};

// ── IMAGEN ────────────────────────────────────────────────────
function LaminaImage({ lamina, size = 'md' }: { lamina: any; size?: 'sm' | 'md' | 'lg' }) {
  const h = { sm: 'h-16', md: 'h-24', lg: 'h-36' }[size];
  const seleccion = lamina.seleccion || '';
  const assets = teamAssets[seleccion];

  // ESCUDO — imagen local
  if (lamina.categoria === 'ESCUDO') {
    const src = assets?.escudo;
    if (src) return (
        <div className={`${h} w-full flex items-center justify-center p-2`}>
          <img src={src} alt={seleccion} className="h-full w-auto object-contain drop-shadow-sm" />
        </div>
    );
  }

  // AVATAR/JUGADOR — imagen local
  if (lamina.categoria === 'AVATAR') {
    const src = assets?.jugador;
    if (src) return (
        <div className={`${h} w-full flex items-center justify-center p-1 overflow-hidden`}>
          <img src={src} alt={seleccion} className="h-full w-auto object-contain object-top" />
        </div>
    );
  }

  // BANDERA — teamFlags o flagcdn
  if (lamina.categoria === 'BANDERA') {
    const src = teamFlags[seleccion] || lamina.imagenUrl;
    if (src) return (
        <div className={`${h} w-full flex items-center justify-center p-2`}>
          <img src={src} alt={seleccion} className="h-full w-auto object-contain rounded" />
        </div>
    );
  }

  // Fallback — DiceBear
  const style = lamina.categoria === 'AVATAR' ? 'avataaars' : 'initials';
  const seed = (seleccion || lamina.nombre || 'seed').replace(/\s/g, '');
  const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  return (
      <div className={`${h} w-full flex items-center justify-center p-2`}>
        <img src={url} alt={lamina.nombre} className="h-full w-auto object-contain" />
      </div>
  );
}

// ── CARD LÁMINA ───────────────────────────────────────────────
function LaminaCard({ lamina, onClick, showCount = false }: any) {
  const r = RAREZA[lamina.rareza as keyof typeof RAREZA] || RAREZA.COMUN;
  return (
      <div className="cursor-pointer transition-transform hover:scale-105" onClick={onClick}>
        <Card className={`overflow-hidden border-2 ${r.border} ${r.glow} hover:shadow-lg transition-all`}>
          <div className={r.bg}><LaminaImage lamina={lamina} size="sm" /></div>
          <div className="p-1.5 text-center bg-white">
            <div className="text-xs font-semibold truncate">{lamina.nombre}</div>
            <div className="text-[10px] text-gray-400 truncate">{lamina.seleccion}</div>
            <div className="flex justify-center gap-1 mt-1 flex-wrap">
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${r.badge}`}>{r.label}</span>
              {showCount && lamina.cantidad > 1 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">×{lamina.cantidad}</span>
              )}
              {lamina.pegada && <CheckCircle2 className="size-3 text-green-500" />}
            </div>
          </div>
        </Card>
      </div>
  );
}

// ── ANIMACIÓN APERTURA ────────────────────────────────────────


// ─── RAREZA CONFIG ───────────────────────────────────────────────────────────
const RAREZA_CFG = {
  COMUN: {
    label: "Común", stars: "★",
    gradient: "linear-gradient(145deg, #f0f0f0 0%, #e0e0e0 100%)",
    border: "#9ca3af", glow: "rgba(156,163,175,0.35)", badge: "#6b7280",
  },
  RARA: {
    label: "Rara", stars: "★★",
    gradient: "linear-gradient(145deg, #ede9fe 0%, #c4b5fd 60%, #a78bfa 100%)",
    border: "#8b5cf6", glow: "rgba(139,92,246,0.55)", badge: "#7c3aed",
  },
  EPICA: {
    label: "Épica", stars: "★★★",
    gradient: "linear-gradient(145deg, #fff7ed 0%, #fde68a 40%, #fbbf24 80%, #f59e0b 100%)",
    border: "#d97706", glow: "rgba(245,158,11,0.75)", badge: "#b45309",
  },
};


const PACK_CSS = `
@keyframes packEnter {
  0%  { transform:translateY(-60px) scale(0.75); opacity:0; }
  70% { transform:translateY(6px)   scale(1.04); opacity:1; }
  100%{ transform:translateY(0)     scale(1);    opacity:1; }
}
@keyframes packShake {
  0%,100%{ transform:translateX(0)     rotate(0deg);  }
  12%    { transform:translateX(-11px)  rotate(-5deg); }
  25%    { transform:translateX(11px)   rotate(5deg);  }
  37%    { transform:translateX(-16px)  rotate(-8deg); }
  50%    { transform:translateX(16px)   rotate(8deg);  }
  62%    { transform:translateX(-9px)   rotate(-4deg); }
  75%    { transform:translateX(9px)    rotate(4deg);  }
  87%    { transform:translateX(-19px)  rotate(-9deg); }
}
@keyframes burstLeft {
  to { transform:translate(-220px,-110px) rotate(-38deg) scale(0.45); opacity:0; }
}
@keyframes burstRight {
  to { transform:translate(220px,-110px)  rotate(38deg)  scale(0.45); opacity:0; }
}
@keyframes packFlash {
  0%  { opacity:0; }
  18% { opacity:1; }
  100%{ opacity:0; }
}
@keyframes cardIn {
  0%  { transform:translateY(-40px) rotateY(90deg) scale(0.8); opacity:0; }
  65% { transform:translateY(5px)   rotateY(-8deg) scale(1.05);opacity:1; }
  100%{ transform:translateY(0)     rotateY(0deg)  scale(1);   opacity:1; }
}
@keyframes epicGlow {
  0%,100%{ box-shadow:0 0 20px rgba(245,158,11,.6),0 0 45px rgba(245,158,11,.25); }
  50%    { box-shadow:0 0 38px rgba(245,158,11,.9),0 0 80px rgba(245,158,11,.45); }
}
@keyframes greenShimmer {
  0%  { background-position:-200% center; }
  100%{ background-position: 200% center; }
}
@keyframes confettiFall {
  0%  { transform:translateY(0)     rotate(0deg);   opacity:1; }
  100%{ transform:translateY(105vh) rotate(540deg); opacity:0; }
}
@keyframes ballBounce {
  0%,100%{ transform:translateY(0);     }
  50%    { transform:translateY(-10px); }
}
`;

const CONFETTI_COLORS = [
  '#16a34a','#ffffff','#15803d','#bbf7d0',
  '#fbbf24','#f87171','#3b82f6','#a3e635',
];

function generatePackConfetti() {
  return Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${8 + Math.random() * 84}%`,
    w: `${6 + (i % 4) * 2}px`,
    h: `${10 + (i % 5) * 3}px`,
    delay: `${(Math.random() * 0.55).toFixed(2)}s`,
    dur: `${(1.5 + Math.random() * 1.5).toFixed(2)}s`,
    round: i % 3 === 0,
  }));
}

// Sobre completo (una sola pieza) — se usa durante enter y shake
function PackFull({ fase }: { fase: string }) {
  const shaking = fase === 'shake';
  return (
      <div style={{
        width: 180, height: 260,
        borderRadius: 14,
        overflow: 'hidden',
        border: '2px solid rgba(134,239,172,.5)',
        background: 'linear-gradient(160deg,#052e16 0%,#14532d 20%,#166534 50%,#15803d 78%,#22c55e 100%)',
        position: 'relative',
        animation: shaking ? 'packShake .13s linear infinite' : 'packEnter .65s cubic-bezier(.34,1.56,.64,1) both',
        filter: shaking
            ? 'brightness(1.3) drop-shadow(0 0 26px #86efac)'
            : 'drop-shadow(0 10px 28px rgba(0,0,0,.6))',
        transition: 'filter .3s ease',
      }}>
        {/* Reflejo tipo foil */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg,transparent 28%,rgba(134,239,172,.2) 50%,transparent 72%)',
          backgroundSize: '200% auto',
          animation: 'greenShimmer 2s linear infinite',
          pointerEvents: 'none',
        }} />

        {/* Líneas de césped */}
        {[33, 52, 70].map(pct => (
            <div key={pct} style={{
              position: 'absolute', left: 0, right: 0,
              top: `${pct}%`, height: 1,
              background: 'rgba(134,239,172,.15)',
            }} />
        ))}

        {/* Estrellas laterales */}
        {[18, 48, 76].map((top, i) => (
            <div key={i}>
              <div style={{ position:'absolute', top:`${top}%`, left:8, fontSize:'.55rem', color:'rgba(134,239,172,.3)' }}>★</div>
              <div style={{ position:'absolute', top:`${top}%`, right:8, fontSize:'.55rem', color:'rgba(134,239,172,.3)' }}>★</div>
            </div>
        ))}

        {/* Contenido centrado */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 12px',
          color: 'white', textAlign: 'center',
          userSelect: 'none',
        }}>
          <div style={{ fontSize: '.52rem', letterSpacing: '.22em', opacity: .85, fontWeight: 700 }}>FIFA</div>

          <div>
            <div style={{ fontSize: '.6rem', letterSpacing: '.22em', opacity: .85, marginBottom: 4 }}>WORLD CUP</div>
            <div style={{ fontSize: '3.4rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-.02em', textShadow: '0 2px 10px rgba(0,0,0,.5)' }}>
              2026
            </div>
            <div style={{ fontSize: '.44rem', letterSpacing: '.14em', opacity: .65, marginTop: 4 }}>
              USA · CAN · MEX
            </div>
          </div>

          <div style={{ fontSize: '2.2rem', lineHeight: 1, animation: 'ballBounce 1.1s ease-in-out infinite' }}>
            ⚽
          </div>

          <div style={{
            fontSize: '.4rem', letterSpacing: '.12em',
            background: 'rgba(255,255,255,.15)', padding: '4px 10px',
            borderRadius: 5, border: '.5px solid rgba(255,255,255,.3)',
            whiteSpace: 'nowrap',
          }}>
            SOBRE ESPECIAL · 5 LÁMINAS
          </div>
        </div>

        {/* Borde dentado inferior */}
        <div style={{
          position: 'absolute', bottom: -1, left: 0, right: 0, height: 14,
          background: 'radial-gradient(circle at 7px 0, transparent 5px, rgba(3,14,3,.95) 5px)',
          backgroundSize: '14px 14px',
        }} />
      </div>
  );
}

// Mitad izquierda/derecha que salen volando solo durante el flash
function PackBurstHalf({ side }: { side: 'left' | 'right' }) {
  return (
      <div style={{
        width: 90, height: 260,
        borderRadius: side === 'left' ? '14px 0 0 14px' : '0 14px 14px 14px',
        overflow: 'hidden',
        border: '2px solid rgba(134,239,172,.5)',
        background: 'linear-gradient(160deg,#052e16 0%,#14532d 20%,#166534 50%,#15803d 78%,#22c55e 100%)',
        animation: side === 'left' ? 'burstLeft .42s ease-in forwards' : 'burstRight .42s ease-in forwards',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg,transparent 28%,rgba(134,239,172,.2) 50%,transparent 72%)',
          backgroundSize: '200% auto',
          animation: 'greenShimmer 2s linear infinite',
        }} />
      </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export function PackAnimation({ laminas, onClose }: { laminas: any[]; onClose: () => void }) {
  const [fase, setFase]         = useState<'enter' | 'shake' | 'flash' | 'reveal' | 'done'>('enter');
  const [revealed, setRevealed] = useState<number[]>([]);
  const [confetti, setConfetti] = useState<any[]>([]);

  useEffect(() => {
    const t1 = setTimeout(() => setFase('shake'),                                     600);
    const t2 = setTimeout(() => { setFase('flash'); setConfetti(generatePackConfetti()); }, 2100);
    const t3 = setTimeout(() => setFase('reveal'),                                   2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    if (fase !== 'reveal') return;
    laminas.forEach((_, i) => {
      setTimeout(() => {
        setRevealed(p => [...p, i]);
        if (i === laminas.length - 1) setTimeout(() => setFase('done'), 600);
      }, i * 480);
    });
  }, [fase]);

  return (
      <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'rgba(3,14,3,0.93)', fontFamily: 'Georgia, serif' }}
          onClick={fase === 'done' ? onClose : undefined}
      >
        <style>{PACK_CSS}</style>

        {/* Confeti */}
        {confetti.map(c => (
            <div key={c.id} style={{
              position: 'absolute', top: '38%', left: c.left,
              width: c.w, height: c.round ? c.w : c.h,
              borderRadius: c.round ? '50%' : '2px',
              background: c.color,
              animation: `confettiFall ${c.dur} ease-out ${c.delay} both`,
              pointerEvents: 'none', zIndex: 10,
            }} />
        ))}

        {/* Flash */}
        {fase === 'flash' && (
            <div style={{
              position: 'absolute', inset: 0, background: 'white',
              animation: 'packFlash .5s ease-out forwards',
              pointerEvents: 'none', zIndex: 20,
            }} />
        )}

        {/* ── SOBRE ── */}
        {(fase === 'enter' || fase === 'shake') && (
            <div className="flex flex-col items-center gap-6 relative z-10">
              <p className="text-white text-2xl font-bold tracking-wide"
                 style={{ textShadow: fase === 'shake' ? '0 0 22px rgba(134,239,172,.9)' : 'none' }}>
                {fase === 'shake' ? '¡Va a explotar!' : 'Abriendo sobre…'}
              </p>

              {/* Sobre completo — sin partir */}
              <PackFull fase={fase} />

              <p className="text-green-300/40 text-sm">
                {fase === 'shake' ? 'Preparando la magia…' : 'Tus láminas te esperan…'}
              </p>
            </div>
        )}

        {/* Flash: mitades saliendo volando */}
        {fase === 'flash' && (
            <div style={{ display: 'flex', gap: 0 }}>
              <PackBurstHalf side="left" />
              <PackBurstHalf side="right" />
            </div>
        )}

        {/* ── LÁMINAS ── */}
        {(fase === 'reveal' || fase === 'done') && (
            <div className="flex flex-col items-center gap-5 relative z-10 px-4 w-full">
              <div className="text-center">
                <div style={{ fontSize: '.52rem', letterSpacing: '.22em', color: '#86efac', marginBottom: 4 }}>
                  MUNDIAL 2026 · SOBRE ESPECIAL
                </div>
                <p className="text-white text-2xl font-bold">¡Tus nuevas láminas!</p>
              </div>

              <div className="flex gap-3 justify-center flex-wrap">
                {laminas.map((lamina, i) => {
                  const r = RAREZA[lamina.rareza as keyof typeof RAREZA] || RAREZA.COMUN;
                  const vis = revealed.includes(i);
                  return (
                      <div key={i} style={{
                        width: 112,
                        animation: vis ? 'cardIn .6s cubic-bezier(.34,1.56,.64,1) both' : 'none',
                        animationDelay: vis ? `${i * 0.08}s` : '0s',
                        opacity: vis ? undefined : 0,
                      }}>
                        <div className={`rounded-xl overflow-hidden border-2 ${r.border} ${r.glow} bg-white`}
                             style={{ animation: lamina.rareza === 'EPICA' && vis ? 'epicGlow 1.6s ease-in-out infinite' : 'none' }}>
                          {vis ? (
                              <>
                                <div className={r.bg}><LaminaImage lamina={lamina} size="md" /></div>
                                <div className="p-2 text-center">
                                  <div className="text-xs font-bold truncate">{lamina.nombre}</div>
                                  <div className="text-[10px] text-gray-400">{lamina.seleccion}</div>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${r.badge} mt-1 inline-block`}>
                            {r.label}
                          </span>
                                  {lamina.rareza === 'EPICA' && (
                                      <Sparkles className="size-4 text-yellow-500 mx-auto mt-1 animate-spin" />
                                  )}
                                </div>
                              </>
                          ) : (
                              <div className="h-32 flex items-center justify-center"
                                   style={{ background: 'linear-gradient(135deg,#052e16,#15803d)' }}>
                                <span style={{ fontSize: '2rem', animation: 'ballBounce .9s ease-in-out infinite' }}>⚽</span>
                              </div>
                          )}
                        </div>
                      </div>
                  );
                })}
              </div>

              {fase === 'done' && (
                  <Button
                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-10 text-base rounded-full"
                      onClick={onClose}
                  >
                    ¡Genial! Ver mi colección
                  </Button>
              )}
            </div>
        )}
      </div>
  );
}

// ── PÁGINA ────────────────────────────────────────────────────
export function AlbumPage() {
  const { user } = useAuth();
  const usuarioId = user?.usuarioId;

  // ── ESTADOS — todos aquí dentro ──────────────────────────────
  const [todasLaminas, setTodasLaminas] = useState<any[]>([]);
  const [paquetes, setPaquetes] = useState<any[]>([]);
  const [coleccion, setColeccion] = useState<any[]>([]);
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedLamina, setSelectedLamina] = useState<any>(null);
  const [animLaminas, setAnimLaminas] = useState<any[]>([]);
  const [showAnim, setShowAnim] = useState(false);
  const [openingPack, setOpeningPack] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [redeemingCode, setRedeemingCode] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [rarFilter, setRarFilter] = useState('all');

  // Intercambios
  const [monedas, setMonedas] = useState<any>(null);
  const [intercambiosBD, setIntercambiosBD] = useState<any[]>([]);
  const [modoIntercambio, setModoIntercambio] = useState<'directo' | 'monedas'>('directo');
  const [usernameDestino, setUsernameDestino] = useState<string>('');
  const [usuarioDestinoBuscado, setUsuarioDestinoBuscado] = useState<any>(null);
  const [buscandoUsuario, setBuscandoUsuario] = useState(false);
  const [showTrade, setShowTrade] = useState(false);
  const [ofrecida, setOfrecida] = useState<any>(null);
  const [buscada, setBuscada] = useState<any>(null);

  // ── CARGA INICIAL ─────────────────────────────────────────────
  const cargar = useCallback(async () => {
    if (!usuarioId) return;
    setLoading(true);
    try {
      const [lams, packs, mon, intercBD] = await Promise.all([
        getLaminasCatalog(),
        getPaquetesPendientes(usuarioId),
        getOrCreateMonedas(usuarioId),
        getIntercambiosPendientes(usuarioId),
      ]);
      setTodasLaminas(lams);
      setPaquetes(packs);
      setMonedas(mon);
      setIntercambiosBD(intercBD);

      const albumBD = await getOrCreateAlbum(usuarioId);
      setAlbum(albumBD);

      if (lams.length > 0) {
        const col = await getColeccionCompleta(usuarioId, lams);
        setColeccion(col);
      }
    } finally { setLoading(false); }
  }, [usuarioId]);

  useEffect(() => { cargar(); }, [cargar]);

  // ── CÁLCULOS ──────────────────────────────────────────────────
  const stats = {
    total: todasLaminas.length,
    collected: coleccion.length,
    placed: coleccion.filter(l => l.pegada).length,
    duplicates: coleccion.filter(l => l.cantidad > 1).length,
    epicas: coleccion.filter(l => l.rareza === 'EPICA').length,
  };
  const duplicadas = coleccion.filter(l => l.cantidad > 1);
  const faltantes = todasLaminas.filter(l => !coleccion.find(c => String(c.id) === String(l.id)));
  const colFiltrada = coleccion.filter(l => {
    const s = l.nombre?.toLowerCase().includes(search.toLowerCase()) || l.seleccion?.toLowerCase().includes(search.toLowerCase());
    const c = catFilter === 'all' || l.categoria === catFilter;
    const r = rarFilter === 'all' || l.rareza === rarFilter;
    return s && c && r;
  });
  const progress = todasLaminas.length > 0 ? (stats.collected / todasLaminas.length) * 100 : 0;

  // ── HANDLERS ──────────────────────────────────────────────────
  const handleDailyPack = async () => {
    try {
      await claimDailyPack(usuarioId);
      await cargar();
      toast.success('🎁 ¡Sobre diario reclamado!');
    } catch (e: any) { toast.error(e.message); }
  };

  const handleRedeemCode = async () => {
    if (!promoCode.trim()) return toast.error('Ingresa un código');
    setRedeemingCode(true);
    try {
      const r = await redeemPromoCode(usuarioId, promoCode.toUpperCase().trim());
      await cargar();
      toast.success(`✅ ${r.packs} sobre(s) añadido(s)`);
      setPromoCode('');
    } catch (e: any) { toast.error(e.message); }
    finally { setRedeemingCode(false); }
  };

  const handleOpenPack = async () => {
    if (paquetes.length === 0) return toast.error('No tienes sobres');
    if (todasLaminas.length === 0) return toast.error('El catálogo no está disponible');
    if (!album) return toast.error('No se pudo cargar el álbum');
    setOpeningPack(true);
    try {
      const resultado = await openPack(paquetes[0].id, usuarioId, album.id, todasLaminas);
      setAnimLaminas(resultado);
      setShowAnim(true);
      setPaquetes(p => p.filter((_, i) => i !== 0));
    } catch (e: any) { toast.error(e.message || 'Error al abrir el sobre'); }
    finally { setOpeningPack(false); }
  };

  const handleCloseAnim = async () => {
    setShowAnim(false);
    const col = await getColeccionCompleta(usuarioId, todasLaminas);
    setColeccion(col);
  };

  const handlePegar = async (lamina: any) => {
    try {
      await pegarLamina(lamina.inventarioId, lamina.id, usuarioId);
      const col = await getColeccionCompleta(usuarioId, todasLaminas);
      setColeccion(col);
      setSelectedLamina(null);
      toast.success('✅ ¡Lámina pegada!');
    } catch { toast.error('Error al pegar la lámina'); }
  };

  if (loading) return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-[#8B000F]" />
      </div>
  );

  return (
      <div className="space-y-6 pb-20 lg:pb-8 px-6">

        {showAnim && <PackAnimation laminas={animLaminas} onClose={handleCloseAnim} />}

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold mb-1"> Álbum Digital</h1>
            <p className="text-gray-500 text-sm">Colecciona, pega e intercambia láminas del Mundial 2026</p>
          </div>
          <Button variant="outline" onClick={handleDailyPack}>
            <Gift className="size-4 mr-2 text-[#8B000F]" /> Sobre diario
          </Button>
        </div>

        {/* Stats + Sobres */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="md:col-span-2 border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Progreso del álbum</span>
                <span className="text-sm font-black text-[#8B000F]">{stats.collected}/{todasLaminas.length}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 mb-3 overflow-hidden">
                <div className="h-4 rounded-full bg-gradient-to-r from-[#8B000F] to-[#D90404] transition-all duration-700"
                     style={{ width: `${progress}%` }} />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Pegadas',  v: stats.placed,     color: 'text-green-600',  bg: 'bg-green-50' },
                  { label: 'Repetidas',v: stats.duplicates, color: 'text-blue-600',   bg: 'bg-blue-50' },
                  { label: 'Épicas',   v: stats.epicas,     color: 'text-yellow-600', bg: 'bg-yellow-50' },
                  { label: 'Sobres',   v: paquetes.length,  color: 'text-[#8B000F]',  bg: 'bg-red-50' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                      <div className={`text-2xl font-black ${s.color}`}>{s.v}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-[#8B000F] to-[#6B0008] text-white">
            <CardContent className="p-5 text-center">
              <Package className="size-10 mx-auto mb-2 opacity-90" />
              <div className="text-5xl font-black">{paquetes.length}</div>
              <div className="text-sm text-white/80 mb-4">
                {paquetes.length === 1 ? 'sobre disponible' : 'sobres disponibles'}
              </div>
              <Button className="w-full bg-white text-[#8B000F] hover:bg-white/90 font-bold"
                      onClick={handleOpenPack} disabled={openingPack || paquetes.length === 0}>
                {openingPack
                    ? <><Loader2 className="size-4 animate-spin mr-2" />Abriendo...</>
                    : <><Zap className="size-4 mr-2" />Abrir sobre</>}
              </Button>
              <div className="flex gap-2 mt-4">
                <Input placeholder="CÓDIGO PROMO" value={promoCode}
                       onChange={e => setPromoCode(e.target.value.toUpperCase())}
                       className="bg-white/20 border-white/30 text-white placeholder:text-white/40 text-xs uppercase tracking-widest" />
                <Button size="sm" variant="outline"
                        className="border-white/30 text-white hover:bg-white/20 bg-transparent flex-shrink-0"
                        onClick={handleRedeemCode} disabled={redeemingCode}>
                  {redeemingCode ? <Loader2 className="size-3 animate-spin" /> : '✓'}
                </Button>
              </div>
              <p className="text-[10px] text-white/40 mt-1">Prueba: MUNDIAL2026</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="coleccion" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="album"> Álbum</TabsTrigger>
            <TabsTrigger value="coleccion"> Colección ({coleccion.length})</TabsTrigger>
            <TabsTrigger value="faltantes">❓ Faltantes ({faltantes.length})</TabsTrigger>
            <TabsTrigger value="intercambios">🤝 Intercambios</TabsTrigger>
          </TabsList>

          {/* ÁLBUM */}
          <TabsContent value="album" className="mt-4 space-y-4">
            {(['ESCUDO', 'AVATAR', 'BANDERA'] as const).map(cat => {
              const cfg = CATEGORIA[cat];
              const laminasCat = todasLaminas.filter(l => l.categoria === cat);
              const pegadas = coleccion.filter(l => l.categoria === cat && l.pegada);
              return (
                  <Card key={cat} className="border-0 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        {cfg.emoji} {cfg.label}s
                        <Badge variant="secondary">{pegadas.length}/{laminasCat.length}</Badge>
                        <div className="ml-auto w-28 bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full bg-[#8B000F]"
                               style={{ width: laminasCat.length ? `${(pegadas.length / laminasCat.length) * 100}%` : '0%' }} />
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-2">
                        {laminasCat.map(lamina => {
                          const en = coleccion.find(c => String(c.id) === String(lamina.id) && c.pegada);
                          const r = RAREZA[lamina.rareza as keyof typeof RAREZA] || RAREZA.COMUN;
                          return (
                              <div key={lamina.id}
                                   className={`rounded-xl overflow-hidden border-2 transition-all ${en ? `${r.border} shadow-sm` : 'border-dashed border-gray-200 opacity-35'}`}>
                                {en
                                    ? <><div className={r.bg}><LaminaImage lamina={lamina} size="sm" /></div>
                                      <div className="p-1 bg-white text-center text-[9px] text-gray-500 truncate">{lamina.seleccion}</div></>
                                    : <><div className="h-14 flex items-center justify-center bg-gray-50 text-xl text-gray-300">?</div>
                                      <div className="p-1 bg-white text-center text-[9px] text-gray-300">???</div></>
                                }
                              </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
              );
            })}
          </TabsContent>

          {/* COLECCIÓN */}
          <TabsContent value="coleccion" className="mt-4 space-y-4">
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-40">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-1 flex-wrap">
                {['all', 'ESCUDO', 'AVATAR', 'BANDERA'].map(c => (
                    <Button key={c} size="sm" variant={catFilter === c ? 'default' : 'outline'}
                            className={catFilter === c ? 'bg-[#8B000F] text-white' : ''}
                            onClick={() => setCatFilter(c)}>
                      {c === 'all' ? 'Todas' : `${CATEGORIA[c as keyof typeof CATEGORIA]?.emoji} ${CATEGORIA[c as keyof typeof CATEGORIA]?.label}`}
                    </Button>
                ))}
                {['all', 'COMUN', 'RARA', 'EPICA'].map(r => (
                    <Button key={r} size="sm" variant={rarFilter === r ? 'default' : 'outline'}
                            className={rarFilter === r ? 'bg-[#8B000F] text-white' : ''}
                            onClick={() => setRarFilter(r)}>
                      {r === 'all' ? 'Rareza' : RAREZA[r as keyof typeof RAREZA]?.label}
                    </Button>
                ))}
              </div>
            </div>
            {colFiltrada.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-200">
                  <CardContent className="p-10 text-center text-gray-400">
                    <Package className="size-10 mx-auto mb-3 opacity-40" />
                    <p>No tienes láminas aún. ¡Reclama tu sobre diario!</p>
                  </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
                  {colFiltrada.map(l => <LaminaCard key={l.id} lamina={l} onClick={() => setSelectedLamina(l)} showCount />)}
                </div>
            )}
          </TabsContent>

          {/* FALTANTES */}
          <TabsContent value="faltantes" className="mt-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Te faltan {faltantes.length} láminas</CardTitle>
                <CardDescription>Abre sobres o intercambia para conseguirlas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-2">
                  {faltantes.map(l => {
                    const r = RAREZA[l.rareza as keyof typeof RAREZA] || RAREZA.COMUN;
                    return (
                        <div key={l.id} className={`rounded-xl overflow-hidden border-dashed border-2 ${r.border} opacity-50`}>
                          <div className="h-14 flex items-center justify-center bg-gray-50">
                            <Lock className="size-5 text-gray-300" />
                          </div>
                          <div className="p-1 text-center bg-white">
                            <span className={`text-[9px] px-1 rounded ${r.badge}`}>{r.label}</span>
                            <div className="text-[9px] text-gray-400 truncate">{l.seleccion}</div>
                          </div>
                        </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-center">
                  <Button className="bg-[#8B000F] hover:bg-[#6B0008] text-white"
                          onClick={handleOpenPack} disabled={paquetes.length === 0}>
                    <Package className="size-4 mr-2" />
                    {paquetes.length > 0 ? 'Abrir sobre' : 'Sin sobres disponibles'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* INTERCAMBIOS */}
          <TabsContent value="intercambios" className="mt-4 space-y-4">

            {/* Stats monedas y límites */}
            <div className="grid md:grid-cols-3 gap-3">
              <Card className="border-0 shadow-sm bg-gradient-to-r from-yellow-50 to-amber-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <Coins className="size-8 text-yellow-600" />
                  <div>
                    <div className="text-2xl font-black text-yellow-700">{monedas?.saldoActual || 0}</div>
                    <div className="text-xs text-yellow-600">monedas disponibles</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="text-lg font-black text-[#8B000F]">
                    {intercambiosBD.filter(i => i.estado === 'PENDIENTE' && i.usuarioOrigenId === usuarioId).length}/{LIMITES.maxOfertasActivas}
                  </div>
                  <div className="text-xs text-gray-500">ofertas activas</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="text-lg font-black text-blue-600">
                    {LIMITES.maxIntercambiosDia - parseInt(localStorage.getItem(`intercambiosHoy_${usuarioId}_${new Date().toDateString()}`) || '0')}
                  </div>
                  <div className="text-xs text-gray-500">intercambios restantes hoy</div>
                </CardContent>
              </Card>
            </div>

            {/* Selector modo */}
            <div className="flex gap-2">
              <Button size="sm"
                      variant={modoIntercambio === 'directo' ? 'default' : 'outline'}
                      className={modoIntercambio === 'directo' ? 'bg-[#8B000F] text-white' : ''}
                      onClick={() => setModoIntercambio('directo')}>
                <ArrowLeftRight className="size-4 mr-2" /> Directo
              </Button>
              <Button size="sm"
                      variant={modoIntercambio === 'monedas' ? 'default' : 'outline'}
                      className={modoIntercambio === 'monedas' ? 'bg-yellow-600 text-white' : ''}
                      onClick={() => setModoIntercambio('monedas')}>
                <Coins className="size-4 mr-2" /> Con monedas
              </Button>
            </div>

            {/* MODO DIRECTO */}
            {modoIntercambio === 'directo' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">Intercambio directo usuario a usuario</p>
                    <Button className="bg-[#8B000F] hover:bg-[#6B0008] text-white"
                            onClick={() => setShowTrade(true)} disabled={duplicadas.length === 0}>
                      <ArrowLeftRight className="size-4 mr-2" /> Nueva oferta
                    </Button>
                  </div>

                  {showTrade && (
                      <Card className="border-2 border-[#8B000F]/30 bg-red-50">
                        <CardContent className="p-5 space-y-4">
                          <h3 className="font-bold text-[#8B000F]">Proponer intercambio directo</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-2">Tú ofreces (repetidas):</p>
                              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                                {duplicadas.map(l => (
                                    <div key={l.id} onClick={() => setOfrecida(l)}
                                         className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${ofrecida?.id === l.id ? 'border-[#8B000F] scale-105' : 'border-gray-200'}`}>
                                      <LaminaImage lamina={l} size="sm" />
                                      <div className="p-1 text-[10px] text-center truncate">{l.nombre}</div>
                                      <div className="text-[9px] text-center text-blue-600 pb-1">×{l.cantidad}</div>
                                    </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-2">Quieres obtener:</p>
                              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                                {faltantes.slice(0, 18).map(l => {
                                  const r = RAREZA[l.rareza as keyof typeof RAREZA] || RAREZA.COMUN;
                                  return (
                                      <div key={l.id} onClick={() => setBuscada(l)}
                                           className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${buscada?.id === l.id ? 'border-[#8B000F] scale-105' : 'border-dashed border-gray-300'}`}>
                                        <div className={`h-10 flex items-center justify-center ${r.bg}`}>
                                          <Lock className="size-4 text-gray-400" />
                                        </div>
                                        <div className="p-1 text-center">
                                          <div className="text-[9px] text-gray-500 truncate">{l.seleccion}</div>
                                          <span className={`text-[9px] px-1 rounded ${r.badge}`}>{r.label}</span>
                                        </div>
                                      </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          {/* Búsqueda de usuario destino */}
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500">Usuario destino:</label>
                            <div className="flex gap-2">
                              <Input
                                  placeholder="Escribe el username del usuario"
                                  value={usernameDestino}
                                  onChange={e => {
                                    setUsernameDestino(e.target.value);
                                    setUsuarioDestinoBuscado(null);
                                  }}
                                  className="text-sm"
                              />
                              <Button size="sm" variant="outline"
                                      disabled={!usernameDestino.trim() || buscandoUsuario}
                                      onClick={async () => {
                                        setBuscandoUsuario(true);
                                        try {
                                          const encontrado = await buscarUsuarioPorUsername(usernameDestino.trim());
                                          if (encontrado) {
                                            setUsuarioDestinoBuscado(encontrado);
                                            toast.success(`✅ Usuario encontrado: ${encontrado.username}`);
                                          } else {
                                            toast.error('Usuario no encontrado');
                                            setUsuarioDestinoBuscado(null);
                                          }
                                        } finally { setBuscandoUsuario(false); }
                                      }}>
                                {buscandoUsuario ? <Loader2 className="size-3 animate-spin" /> : 'Buscar'}
                              </Button>
                            </div>

                            {/* Confirmación visual del usuario encontrado */}
                            {usuarioDestinoBuscado && (
                                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-2">
                                  <CheckCircle2 className="size-4 text-green-500 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-semibold text-green-800">@{usuarioDestinoBuscado.username}</p>
                                    <p className="text-[10px] text-green-600">ID: #{usuarioDestinoBuscado.id}</p>
                                  </div>
                                </div>
                            )}
                            <p className="text-[10px] text-gray-400">El usuario recibirá la solicitud y podrá aceptarla o rechazarla</p>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => {
                              setShowTrade(false);
                              setOfrecida(null);
                              setBuscada(null);
                              setUsernameDestino('');
                              setUsuarioDestinoBuscado(null);
                            }}>
                              Cancelar
                            </Button>
                            <Button className="bg-[#8B000F] hover:bg-[#6B0008] text-white"
                                    disabled={!ofrecida || !buscada || !usuarioDestinoBuscado}
                                    onClick={async () => {
                                      try {
                                        await proponerIntercambio({
                                          usuarioOrigenId: usuarioId,
                                          usuarioDestinoId: usuarioDestinoBuscado.id,
                                          laminaOrigenId: ofrecida.id,
                                          laminaDestinoId: buscada.id,
                                          laminaOrigenNombre: ofrecida.nombre,
                                          laminaDestinoNombre: buscada.nombre,
                                        });
                                        const nuevos = await getIntercambiosPendientes(usuarioId);
                                        setIntercambiosBD(nuevos);
                                        setShowTrade(false);
                                        setOfrecida(null);
                                        setBuscada(null);
                                        setUsernameDestino('');
                                        setUsuarioDestinoBuscado(null);
                                        toast.success('📤 Oferta enviada');
                                      } catch (e: any) { toast.error(e.message); }
                                    }}>
                              Enviar solicitud
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                  )}

                  {intercambiosBD.length === 0 ? (
                      <Card className="border-dashed border-2 border-gray-200">
                        <CardContent className="p-10 text-center text-gray-400">
                          <ArrowLeftRight className="size-10 mx-auto mb-3 opacity-40" />
                          <p className="text-sm">No tienes intercambios pendientes</p>
                        </CardContent>
                      </Card>
                  ) : intercambiosBD.map(inter => {
                    const detalle = (() => { try { return JSON.parse(inter.detalleIntercambio || '{}'); } catch { return {}; } })();
                    const esMio = inter.usuarioOrigenId === usuarioId;
                    const esPendiente = inter.estado === 'PENDIENTE';
                    const estadoColor: Record<string, string> = {
                      PENDIENTE: 'bg-yellow-100 text-yellow-700',
                      COMPLETADO: 'bg-green-100 text-green-700',
                      RECHAZADO: 'bg-red-100 text-red-700',
                      CANCELADO: 'bg-gray-100 text-gray-500',
                    };
                    return (
                        <Card key={inter.id} className="border-0 shadow-md">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={estadoColor[inter.estado] || 'bg-gray-100 text-gray-500'}>{inter.estado}</Badge>
                                  <Badge variant="outline" className="text-[10px]">{esMio ? '📤 Enviada' : '📥 Recibida'}</Badge>
                                </div>
                                <div className="text-sm font-medium">
                                  <span className="text-green-700">{detalle.laminaOrigenNombre || 'Lámina'}</span>
                                  <ArrowLeftRight className="size-3 inline mx-2 text-gray-400" />
                                  <span className="text-blue-700">{detalle.laminaDestinoNombre || 'Lámina'}</span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {esMio ? `Para #${inter.usuarioDestinoId}` : `De #${inter.usuarioOrigenId}`} · {new Date(inter.fechaSolicitud).toLocaleDateString('es-CO')}
                                </p>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                {!esMio && esPendiente && (
                                    <>
                                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                                              onClick={async () => {
                                                try {
                                                  const invOrigen = await getInventario(inter.usuarioOrigenId);
                                                  const invDestino = await getInventario(usuarioId);
                                                  await aceptarIntercambio(inter.id, inter, invOrigen, invDestino);
                                                  const col = await getColeccionCompleta(usuarioId, todasLaminas);
                                                  setColeccion(col);
                                                  setIntercambiosBD(await getIntercambiosPendientes(usuarioId));
                                                  setMonedas(await getOrCreateMonedas(usuarioId));
                                                  toast.success('🤝 ¡Intercambio completado!');
                                                } catch (e: any) { toast.error(e.message); }
                                              }}>Aceptar</Button>
                                      <Button size="sm" variant="outline" className="text-red-500"
                                              onClick={async () => {
                                                await rechazarIntercambio(inter.id, inter, usuarioId);
                                                setIntercambiosBD(await getIntercambiosPendientes(usuarioId));
                                                toast.success('Rechazado');
                                              }}>Rechazar</Button>
                                    </>
                                )}
                                {esMio && esPendiente && (
                                    <Button size="sm" variant="outline" className="text-red-500 border-red-200"
                                            onClick={async () => {
                                              await cancelarIntercambio(inter.id, inter, usuarioId);
                                              setIntercambiosBD(await getIntercambiosPendientes(usuarioId));
                                              toast.success('Cancelado');
                                            }}>Cancelar oferta</Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                    );
                  })}

                  {duplicadas.length > 0 && (
                      <Card className="border-0 shadow-sm bg-yellow-50 border border-yellow-200">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                            <Coins className="size-4" /> Convertir repetidas en monedas
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {duplicadas.slice(0, 6).map(l => (
                                <Button key={l.id} size="sm" variant="outline"
                                        className="border-yellow-400 text-yellow-700 hover:bg-yellow-100 text-xs"
                                        onClick={async () => {
                                          try {
                                            const inv = coleccion.find(c => String(c.id) === String(l.id));
                                            await convertirRepetidas(usuarioId, { ...inv, id: inv?.inventarioId });
                                            setColeccion(await getColeccionCompleta(usuarioId, todasLaminas));
                                            setMonedas(await getOrCreateMonedas(usuarioId));
                                            toast.success(`🪙 +${LIMITES.monedasPorRepetida} moneda`);
                                          } catch (e: any) { toast.error(e.message); }
                                        }}>
                                  {l.nombre} (×{l.cantidad}) → 🪙
                                </Button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                  )}
                </div>
            )}

            {/* MODO MONEDAS */}
            {modoIntercambio === 'monedas' && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h4 className="font-semibold text-yellow-800 mb-1 flex items-center gap-2">
                      <Coins className="size-4" /> Tienda de monedas
                    </h4>
                    <p className="text-xs text-yellow-700">
                      Común = {LIMITES.costoMonedasPorLaminaComun}🪙 · Rara = {LIMITES.costoMonedasPorLaminaRara}🪙 · Épica = {LIMITES.costoMonedasPorLaminaEpica}🪙
                    </p>
                  </div>
                  {faltantes.length === 0 ? (
                      <Card className="border-dashed border-2 border-gray-200">
                        <CardContent className="p-10 text-center text-gray-400">
                          <CheckCircle2 className="size-10 mx-auto mb-3 text-green-300" />
                          <p className="text-sm">¡Tienes todas las láminas!</p>
                        </CardContent>
                      </Card>
                  ) : (
                      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
                        {faltantes.map(l => {
                          const r = RAREZA[l.rareza as keyof typeof RAREZA] || RAREZA.COMUN;
                          const costo = ({ COMUN: LIMITES.costoMonedasPorLaminaComun, RARA: LIMITES.costoMonedasPorLaminaRara, EPICA: LIMITES.costoMonedasPorLaminaEpica } as any)[l.rareza] || 1;
                          const puedePagar = (monedas?.saldoActual || 0) >= costo;
                          return (
                              <div key={l.id}
                                   className={`cursor-pointer transition-transform ${puedePagar ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'}`}
                                   onClick={async () => {
                                     if (!puedePagar) return toast.error(`Necesitas ${costo} monedas`);
                                     try {
                                       const inv = await getInventario(usuarioId);
                                       await intercambiarConMonedas({ usuarioId, laminaDeseadaId: l.id, laminaDeseadaNombre: l.nombre, rareza: l.rareza, inventarioOrigen: inv });
                                       setColeccion(await getColeccionCompleta(usuarioId, todasLaminas));
                                       setMonedas(await getOrCreateMonedas(usuarioId));
                                       toast.success(`✅ ¡${l.nombre} añadida!`);
                                     } catch (e: any) { toast.error(e.message); }
                                   }}>
                                <Card className={`overflow-hidden border-2 ${r.border} ${puedePagar ? r.glow : ''}`}>
                                  <div className={r.bg}><LaminaImage lamina={l} size="sm" /></div>
                                  <div className="p-1.5 text-center bg-white">
                                    <div className="text-xs font-semibold truncate">{l.nombre}</div>
                                    <div className="text-[10px] text-gray-400 truncate">{l.seleccion}</div>
                                    <div className={`text-xs font-bold mt-1 ${puedePagar ? 'text-yellow-600' : 'text-gray-400'}`}>{costo} 🪙</div>
                                  </div>
                                </Card>
                              </div>
                          );
                        })}
                      </div>
                  )}
                </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog detalle lámina */}
        <Dialog open={!!selectedLamina} onOpenChange={() => setSelectedLamina(null)}>
          <DialogContent className="max-w-xs">
            <DialogHeader><DialogTitle>{selectedLamina?.nombre}</DialogTitle></DialogHeader>
            {selectedLamina && (() => {
              const r = RAREZA[selectedLamina.rareza as keyof typeof RAREZA] || RAREZA.COMUN;
              return (
                  <div className="space-y-3">
                    <Card className={`overflow-hidden border-2 ${r.border} ${r.glow}`}>
                      <div className={r.bg}><LaminaImage lamina={selectedLamina} size="lg" /></div>
                    </Card>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={r.badge}>{r.label}</Badge>
                      <Badge variant="outline">{selectedLamina.categoria}</Badge>
                      {selectedLamina.seleccion && <Badge variant="outline">{selectedLamina.seleccion}</Badge>}
                      {selectedLamina.cantidad > 1 && <Badge className="bg-blue-100 text-blue-700">×{selectedLamina.cantidad} copias</Badge>}
                    </div>
                    {selectedLamina.descripcion && <p className="text-xs text-gray-500">{selectedLamina.descripcion}</p>}
                    <div className="flex gap-2">
                      {!selectedLamina.pegada && (
                          <Button className="flex-1 bg-[#8B000F] hover:bg-[#6B0008] text-white"
                                  onClick={() => handlePegar(selectedLamina)}>
                            <BookOpen className="size-4 mr-2" /> Pegar en álbum
                          </Button>
                      )}
                      {selectedLamina.cantidad > 1 && (
                          <Button variant="outline" className="flex-1"
                                  onClick={() => { setShowTrade(true); setOfrecida(selectedLamina); setSelectedLamina(null); }}>
                            <ArrowLeftRight className="size-4 mr-2" /> Intercambiar
                          </Button>
                      )}
                      {selectedLamina.pegada && (
                          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                            <CheckCircle2 className="size-4" /> Ya pegada
                          </div>
                      )}
                    </div>
                  </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
  );
}