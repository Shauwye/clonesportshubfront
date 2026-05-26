import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { toast } from 'sonner';
import {
  Trophy, Users, Plus, Hash, Copy, Check, Loader2,
  Crown, Medal, BarChart2, Clock, Save, ChevronRight,
  ArrowLeft, TrendingUp, Target
} from 'lucide-react';
import {
  getMyQuinielas, createQuiniela, joinQuiniela,
  getQuinielaRanking, getParticipantes,
  getMyPredictions, savePrediction, getMyStats,
} from '../../services/quinielasService';
import { getPartidosConInfo } from '../../services/partidoService';

const AVATAR_COLORS = [
  'bg-red-100 text-red-700', 'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700', 'bg-pink-100 text-pink-700',
];

function posicionLabel(pos: number, total: number) {
  if (!pos || !total) return null;
  if (pos === 1) return <Badge className="bg-yellow-500 text-white border-0">🥇 Líder</Badge>;
  const pct = Math.ceil((pos / total) * 100);
  return <Badge variant="secondary">Top {pct}%</Badge>;
}

export function QuinielasPage() {
  const { user } = useAuth();

  const [pollas, setPollas] = useState<any[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Polla seleccionada (vista detalle)
  const [pollaActiva, setPollaActiva] = useState<any>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<string, any>>({});
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [savingPred, setSavingPred] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Dialogs
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [q, p, s] = await Promise.all([
          getMyQuinielas(user?.usuarioId),
          getPartidosConInfo(),
          getMyStats(user?.usuarioId),
        ]);
        setPollas(q);
        setPartidos(p);
        setStats(s);
      } catch (e: any) {
        toast.error('Error cargando datos: ' + e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.usuarioId]);

  const abrirDetalle = async (polla: any) => {
    setPollaActiva(polla);
    setLoadingDetalle(true);
    try {
      const [r, part, preds] = await Promise.all([
        getQuinielaRanking(polla.id),
        getParticipantes(polla.id),
        getMyPredictions(polla.id, user?.usuarioId),
      ]);
      setRanking(Array.isArray(r) ? r : []);
      setParticipantes(Array.isArray(part) ? part : []);
      setPredictions(preds || {});
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return toast.error('Escribe un nombre para la polla');
    setActionLoading(true);
    try {
      const created = await createQuiniela({
        nombre: newName,
        creadorId: user?.usuarioId,
        descripcion: newDesc,
        maxParticipantes: 50,
      });
      const updated = await getMyQuinielas(user?.usuarioId);
      setPollas(updated);
      setShowCreate(false);
      setNewName(''); setNewDesc('');
      toast.success(`✅ Polla "${created.nombre}" creada. Código: ${created.codigoInvitacion}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return toast.error('Ingresa el código');
    setActionLoading(true);
    try {
      const result = await joinQuiniela({ codigo: joinCode.toUpperCase(), usuarioId: user?.usuarioId });
      const updated = await getMyQuinielas(user?.usuarioId);
      setPollas(updated);
      setShowJoin(false);
      setJoinCode('');
      toast.success(`🎉 ${result.mensaje}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePredChange = (partidoId: number, campo: 'local' | 'visitante', valor: string) => {
    setPredictions(prev => ({
      ...prev,
      [partidoId]: { ...prev[partidoId], [campo]: valor === '' ? '' : Number(valor) },
    }));
  };

  const handleSavePred = async (partidoId: number) => {
    const pred = predictions[partidoId];
    if (!pred || pred.local === undefined || pred.visitante === undefined)
      return toast.error('Ingresa ambos marcadores');
    setSavingPred(true);
    try {
      await savePrediction({
        pollaId: pollaActiva.id,
        usuarioId: user?.usuarioId,
        partidoId,
        marcadorLocal: Number(pred.local),
        marcadorVisitante: Number(pred.visitante),
      });
      toast.success('Pronóstico guardado ✅');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingPred(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success('Código copiado 📋');
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="size-8 animate-spin text-[#8B000F]" />
        </div>
    );
  }

  // ── Vista detalle de una polla ─────────────────────────────────────────────
  if (pollaActiva) {
    return (
        <div className="space-y-6 pb-20 lg:pb-8 px-6">
          {/* Header detalle */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setPollaActiva(null)}>
              <ArrowLeft className="size-4 mr-1" /> Mis Pollas
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex-1">
              <h1 className="text-xl font-bold">{pollaActiva.nombre}</h1>
              <p className="text-xs text-gray-500">{pollaActiva.numParticipantes} participantes · Estado: {pollaActiva.estado}</p>
            </div>
            <button
                className="flex items-center gap-1 text-sm font-mono bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                onClick={() => handleCopy(pollaActiva.codigoInvitacion)}
            >
              {copiedCode === pollaActiva.codigoInvitacion ? <Check className="size-3 text-green-600" /> : <Copy className="size-3" />}
              {pollaActiva.codigoInvitacion}
            </button>
          </div>

          {loadingDetalle ? (
              <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-gray-400" /></div>
          ) : (
              <Tabs defaultValue="ranking" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="ranking">🏆 Ranking</TabsTrigger>
                  <TabsTrigger value="pronosticos">⚽ Pronósticos</TabsTrigger>
                  <TabsTrigger value="participantes">👥 Participantes</TabsTrigger>
                </TabsList>

                {/* RANKING */}
                <TabsContent value="ranking" className="space-y-3 mt-4">
                  {ranking.length === 0 ? (
                      <Card><CardContent className="p-8 text-center text-gray-400">
                        <Trophy className="size-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Aún no hay puntos. ¡Haz tus pronósticos!</p>
                      </CardContent></Card>
                  ) : ranking.map((item, i) => (
                      <div key={item.usuarioId}
                           className={`flex items-center gap-3 p-3 rounded-xl border ${
                               i === 0 ? 'bg-yellow-50 border-yellow-200' :
                                   i === 1 ? 'bg-gray-50 border-gray-200' :
                                       i === 2 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'
                           }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                            i === 0 ? 'bg-yellow-400 text-white' :
                                i === 1 ? 'bg-gray-300 text-white' :
                                    i === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                        </div>
                        <Avatar className="size-8">
                          <AvatarFallback className={AVATAR_COLORS[i % AVATAR_COLORS.length] + ' text-xs font-bold'}>
                            {item.nombreUsuario?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{item.nombreUsuario || `Usuario ${item.usuarioId}`}</p>
                          {item.rolEnPolla === 'ADMIN' && <p className="text-xs text-gray-400">Admin</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-black text-[#8B000F]">{item.puntos} pts</p>
                          {item.usuarioId === user?.usuarioId && (
                              <p className="text-xs text-blue-600 font-medium">Tú</p>
                          )}
                        </div>
                      </div>
                  ))}

                  <Card className="bg-gray-50 border-0">
                    <CardContent className="p-4 text-xs text-gray-500 space-y-1">
                      <p className="font-semibold text-gray-700 mb-1">Reglas de puntuación</p>
                      <p>⚽ Marcador exacto = <strong>3 puntos</strong></p>
                      <p>✅ Resultado correcto (G/E/P) = <strong>1 punto</strong></p>
                      <p>🔒 Pronósticos se bloquean 30 min antes del partido</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* PRONÓSTICOS */}
                <TabsContent value="pronosticos" className="space-y-4 mt-4">
                  <p className="text-sm text-gray-500">Ingresa tu pronóstico para cada partido. Se bloquean 30 min antes del inicio.</p>
                  {partidos.slice(0, 8).map(partido => {
                    const pred = predictions[partido.id] || {};
                    const bloqueado = pred.bloqueada === true;
                    const tienePred = pred.local !== undefined;
                    return (
                        <Card key={partido.id} className={`border-0 shadow-sm ${bloqueado ? 'opacity-70' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                              <Clock className="size-3" />
                              {partido.fecha ? new Date(partido.fecha).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Fecha TBD'}
                              {partido.hora ? ` — ${partido.hora}` : ''}
                              <Badge variant="secondary" className="ml-1 text-xs">{partido.fase}</Badge>
                              {tienePred && !bloqueado && <Badge className="ml-1 bg-green-100 text-green-700 border-0 text-xs">Guardado</Badge>}
                              {bloqueado && <Badge className="ml-1 bg-gray-100 text-gray-500 border-0 text-xs">🔒 Bloqueado</Badge>}
                            </div>
                            <div className="grid grid-cols-7 gap-2 items-center">
                              <div className="col-span-2 text-center">
                                <div className="text-3xl mb-1">{partido.homeFlag}</div>
                                <div className="font-semibold text-xs">{partido.homeTeam}</div>
                              </div>
                              <div className="col-span-1">
                                <Input
                                    type="number" min="0" max="20" placeholder="0"
                                    disabled={bloqueado}
                                    className="text-center text-lg font-black border-2 border-[#8B000F]/30 focus:border-[#8B000F] h-10"
                                    value={pred.local ?? ''}
                                    onChange={e => handlePredChange(partido.id, 'local', e.target.value)}
                                />
                              </div>
                              <div className="col-span-1 text-center font-black text-gray-300 text-sm">VS</div>
                              <div className="col-span-1">
                                <Input
                                    type="number" min="0" max="20" placeholder="0"
                                    disabled={bloqueado}
                                    className="text-center text-lg font-black border-2 border-[#8B000F]/30 focus:border-[#8B000F] h-10"
                                    value={pred.visitante ?? ''}
                                    onChange={e => handlePredChange(partido.id, 'visitante', e.target.value)}
                                />
                              </div>
                              <div className="col-span-2 text-center">
                                <div className="text-3xl mb-1">{partido.awayFlag}</div>
                                <div className="font-semibold text-xs">{partido.awayTeam}</div>
                              </div>
                            </div>
                            {!bloqueado && (
                                <Button
                                    size="sm"
                                    className="w-full mt-3 bg-[#8B000F] hover:bg-[#6B0008] text-white"
                                    onClick={() => handleSavePred(partido.id)}
                                    disabled={savingPred}
                                >
                                  {savingPred ? <Loader2 className="size-3 animate-spin mr-1" /> : <Save className="size-3 mr-1" />}
                                  Guardar pronóstico
                                </Button>
                            )}
                          </CardContent>
                        </Card>
                    );
                  })}
                </TabsContent>

                {/* PARTICIPANTES */}
                <TabsContent value="participantes" className="space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">{participantes.length} participantes en esta polla</p>
                    <button
                        className="flex items-center gap-1 text-sm font-mono bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                        onClick={() => handleCopy(pollaActiva.codigoInvitacion)}
                    >
                      {copiedCode === pollaActiva.codigoInvitacion ? <Check className="size-3 text-green-600" /> : <Copy className="size-3" />}
                      Invitar: {pollaActiva.codigoInvitacion}
                    </button>
                  </div>
                  {participantes.map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                        <Avatar className="size-9">
                          <AvatarFallback className={AVATAR_COLORS[i % AVATAR_COLORS.length] + ' text-sm font-bold'}>
                            {String(p.usuarioId || '?').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{p.nombreUsuario || `Usuario #${p.usuarioId}`}</p>
                          <p className="text-xs text-gray-400">
                            {p.rolEnPolla === 'ADMIN' ? '👑 Admin' : 'Participante'} ·
                            Se unió {p.fechaUnion ? new Date(p.fechaUnion).toLocaleDateString('es-CO') : '—'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#8B000F] text-sm">{p.puntosAcumulados || 0} pts</p>
                          <p className="text-xs text-gray-400">#{p.posicionActual || '—'}</p>
                        </div>
                      </div>
                  ))}
                </TabsContent>
              </Tabs>
          )}
        </div>
    );
  }

  // ── Vista lista de pollas (= lista de grupos) ──────────────────────────────
  return (
      <div className="space-y-6 pb-20 lg:pb-8 px-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 mb-1">
              <Trophy className="size-7 text-[#8B000F]" /> Pollas Futboleras
            </h1>
            <p className="text-gray-500 text-sm">Crea un grupo, invita amigos y compite haciendo pronósticos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setShowJoin(true); setShowCreate(false); }}>
              <Hash className="size-4 mr-1" /> Unirse
            </Button>
            <Button className="bg-[#8B000F] hover:bg-[#6B0008] text-white"
                    onClick={() => { setShowCreate(true); setShowJoin(false); }}>
              <Plus className="size-4 mr-1" /> Crear
            </Button>
          </div>
        </div>

        {/* Stats globales */}
        {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Pollas', value: stats.pollas, icon: Users, color: 'text-blue-600' },
                { label: 'Pronósticos', value: stats.total, icon: Target, color: 'text-gray-700' },
                { label: 'Precisión', value: `${stats.accuracy}%`, icon: BarChart2, color: 'text-green-600' },
                { label: 'Mejor racha', value: stats.streak, icon: TrendingUp, color: 'text-[#8B000F]' },
              ].map(s => (
                  <Card key={s.label} className="border-0 shadow-sm">
                    <CardContent className="p-4 text-center">
                      <s.icon className={`size-5 mx-auto mb-1 ${s.color}`} />
                      <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                    </CardContent>
                  </Card>
              ))}
            </div>
        )}

        {/* Form crear */}
        {showCreate && (
            <Card className="border-2 border-[#8B000F]/20 bg-red-50/50">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-bold text-[#8B000F]">Nueva Polla / Grupo</h3>
                <div className="space-y-2">
                  <Label className="text-xs">Nombre del grupo</Label>
                  <Input placeholder="Ej: Amigos del Fútbol" value={newName}
                         onChange={e => setNewName(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && handleCreate()} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Descripción (opcional)</Label>
                  <Input placeholder="Ej: Grupo de la oficina para el Mundial" value={newDesc}
                         onChange={e => setNewDesc(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button className="bg-[#8B000F] hover:bg-[#6B0008] text-white" onClick={handleCreate} disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="size-4 animate-spin mr-1" /> : null} Crear
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                </div>
                <p className="text-xs text-gray-400">Se generará un código único para invitar amigos</p>
              </CardContent>
            </Card>
        )}

        {/* Form unirse */}
        {showJoin && (
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-bold text-blue-700">Unirse a una Polla</h3>
                <div className="space-y-2">
                  <Label className="text-xs">Código de invitación</Label>
                  <Input placeholder="Ej: AMI-X7K2" value={joinCode}
                         onChange={e => setJoinCode(e.target.value.toUpperCase())}
                         onKeyDown={e => e.key === 'Enter' && handleJoin()}
                         className="uppercase tracking-widest font-mono" />
                </div>
                <div className="flex gap-2">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleJoin} disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="size-4 animate-spin mr-1" /> : null} Unirse
                  </Button>
                  <Button variant="outline" onClick={() => setShowJoin(false)}>Cancelar</Button>
                </div>
              </CardContent>
            </Card>
        )}

        {/* Lista de pollas */}
        {pollas.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200">
              <CardContent className="p-12 text-center">
                <div className="text-5xl mb-4">🏆</div>
                <h3 className="font-bold text-lg mb-2">No estás en ninguna polla</h3>
                <p className="text-gray-500 text-sm mb-4">Crea un grupo o únete con el código de un amigo</p>
                <div className="flex gap-3 justify-center">
                  <Button className="bg-[#8B000F] hover:bg-[#6B0008] text-white" onClick={() => setShowCreate(true)}>
                    <Plus className="size-4 mr-1" /> Crear polla
                  </Button>
                  <Button variant="outline" onClick={() => setShowJoin(true)}>
                    <Hash className="size-4 mr-1" /> Unirse con código
                  </Button>
                </div>
              </CardContent>
            </Card>
        ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pollas.map((polla: any) => (
                  <Card key={polla.id}
                        className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => abrirDetalle(polla)}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base">{polla.nombre}</h3>
                            {polla.esAdmin && <Crown className="size-4 text-yellow-500" />}
                          </div>
                          {polla.descripcion && (
                              <p className="text-xs text-gray-400 mt-0.5">{polla.descripcion}</p>
                          )}
                        </div>
                        <button
                            className="flex items-center gap-1 text-xs font-mono bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors flex-shrink-0"
                            onClick={e => { e.stopPropagation(); handleCopy(polla.codigoInvitacion); }}
                        >
                          {copiedCode === polla.codigoInvitacion ? <Check className="size-3 text-green-600" /> : <Copy className="size-3" />}
                          {polla.codigoInvitacion}
                        </button>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                        <Users className="size-3" />
                        {polla.numParticipantes} participantes
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-black text-blue-600">
                              {polla.miPosicion ? `#${polla.miPosicion}` : '—'}
                            </div>
                            <div className="text-xs text-gray-400">Posición</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-black text-[#8B000F]">
                              {polla.misPuntos ?? 0}
                            </div>
                            <div className="text-xs text-gray-400">Puntos</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {posicionLabel(polla.miPosicion, polla.numParticipantes)}
                          <ChevronRight className="size-4 text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
        )}
      </div>
  );
}