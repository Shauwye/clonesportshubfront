import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import {
    AlertTriangle, Search, User, FileText, Shield,
    Clock, CheckCircle2, XCircle, Loader2, ChevronRight,
    ArrowLeft, Eye, AlertCircle, TrendingUp, Inbox,
    Activity, Flag, Microscope,
} from 'lucide-react';
import {
    getCasosSinAsignar, getCasosPorAgente, getCasosPorUsuario,
    asignarCaso, resolverCaso, cerrarCaso, escalarCaso, cambiarPrioridad,
    crearCaso, getLogsRecientes, getLogsPorUsuario,
    getTransaccionesPorUsuario, getAnomalias,
    getInvestigacionesPorAgente, getInvestigacionesPorCaso,
    abrirInvestigacion, agregarHallazgos, cerrarInvestigacion,
    buscarUsuarioPorUsername, contarCasos, getEntradasUsuario,
    getReservasUsuario,
    getInventarioUsuario,
    getIntercambiosUsuario,
} from '../../services/soporteService';

// ── HELPERS ───────────────────────────────────────────────────
const ESTADO_COLOR: Record<string, string> = {
    ABIERTO:    'bg-blue-100 text-blue-700',
    EN_PROCESO: 'bg-yellow-100 text-yellow-700',
    ESCALADO:   'bg-orange-100 text-orange-700',
    RESUELTO:   'bg-green-100 text-green-700',
    CERRADO:    'bg-gray-100 text-gray-500',
};

const PRIORIDAD_COLOR: Record<string, string> = {
    BAJA:    'bg-gray-100 text-gray-600',
    MEDIA:   'bg-blue-100 text-blue-700',
    ALTA:    'bg-orange-100 text-orange-700',
    CRITICA: 'bg-red-100 text-red-700',
};

const RIESGO_COLOR: Record<string, string> = {
    BAJO:  'bg-green-100 text-green-700',
    MEDIO: 'bg-yellow-100 text-yellow-700',
    ALTO:  'bg-red-100 text-red-700',
};

const NIVEL_COLOR: Record<string, string> = {
    INFO:  'bg-blue-50 text-blue-600',
    WARN:  'bg-yellow-50 text-yellow-700',
    ERROR: 'bg-red-50 text-red-600',
};

function fmt(dt: any) {
    if (!dt) return '—';
    try { return new Date(dt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }); }
    catch { return String(dt); }
}

function StatCard({ label, value, icon: Icon, color, bg }: any) {
    return (
        <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
                <div className={`${bg} p-2.5 rounded-xl`}>
                    <Icon className={`size-5 ${color}`} />
                </div>
                <div>
                    <div className={`text-2xl font-black ${color}`}>{value}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                </div>
            </CardContent>
        </Card>
    );
}

// ── DETALLE DE UN CASO ────────────────────────────────────────
function DetalleCaso({ caso, agenteId, onBack, onRefresh }: any) {
    const [logs, setLogs] = useState<any[]>([]);
    const [transacciones, setTransacciones] = useState<any[]>([]);
    const [investigaciones, setInvestigaciones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showResolver, setShowResolver] = useState(false);
    const [showCerrar, setShowCerrar] = useState(false);
    const [showInvestigar, setShowInvestigar] = useState(false);
    const [showHallazgos, setShowHallazgos] = useState<any>(null);
    const [showCerrarInv, setShowCerrarInv] = useState<any>(null);

    const [resolucion, setResolucion] = useState('');
    const [motivoCierre, setMotivoCierre] = useState('');
    const [motivoInv, setMotivoInv] = useState('');
    const [hallazgosText, setHallazgosText] = useState('');
    const [accionesText, setAccionesText] = useState('');
    const [hallazgosAdd, setHallazgosAdd] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function cargar() {
            setLoading(true);
            try {
                const [l, t, inv] = await Promise.all([
                    getLogsPorUsuario(caso.usuarioId),
                    getTransaccionesPorUsuario(caso.usuarioId),
                    getInvestigacionesPorCaso(caso.id),
                ]);
                setLogs(Array.isArray(l) ? l.slice(0, 20) : []);
                setTransacciones(Array.isArray(t) ? t.slice(0, 20) : []);
                setInvestigaciones(Array.isArray(inv) ? inv : []);
            } finally { setLoading(false); }
        }
        cargar();
    }, [caso.id, caso.usuarioId]);

    const handleAsignar = async () => {
        try {
            await asignarCaso(caso.id, agenteId);
            toast.success('Caso asignado a ti');
            onRefresh();
        } catch (e: any) { toast.error(e.message); }
    };

    const handleEscalar = async () => {
        try {
            await escalarCaso(caso.id);
            toast.success('Caso escalado');
            onRefresh();
        } catch (e: any) { toast.error(e.message); }
    };

    const handleResolver = async () => {
        if (!resolucion.trim()) return toast.error('Escribe la resolución');
        setSaving(true);
        try {
            await resolverCaso(caso.id, resolucion);
            toast.success('Caso marcado como resuelto');
            setShowResolver(false);
            onRefresh();
        } catch (e: any) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    const handleCerrar = async () => {
        setSaving(true);
        try {
            await cerrarCaso(caso.id, motivoCierre);
            toast.success('Caso cerrado');
            setShowCerrar(false);
            onRefresh();
        } catch (e: any) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    const handleAbrirInvestigacion = async () => {
        if (!motivoInv.trim()) return toast.error('Escribe el motivo');
        setSaving(true);
        try {
            await abrirInvestigacion(caso.id, agenteId, motivoInv);
            toast.success('Investigación abierta');
            setShowInvestigar(false);
            const inv = await getInvestigacionesPorCaso(caso.id);
            setInvestigaciones(Array.isArray(inv) ? inv : []);
        } catch (e: any) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    const handleAgregarHallazgos = async () => {
        if (!hallazgosAdd.trim() || !showHallazgos) return;
        setSaving(true);
        try {
            await agregarHallazgos(showHallazgos.id, hallazgosAdd);
            toast.success('Hallazgos registrados');
            setShowHallazgos(null);
            const inv = await getInvestigacionesPorCaso(caso.id);
            setInvestigaciones(Array.isArray(inv) ? inv : []);
        } catch (e: any) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    const handleCerrarInvestigacion = async () => {
        if (!hallazgosText.trim() || !accionesText.trim()) return toast.error('Completa todos los campos');
        setSaving(true);
        try {
            await cerrarInvestigacion(showCerrarInv.id, hallazgosText, accionesText);
            toast.success('Investigación cerrada');
            setShowCerrarInv(null);
            const inv = await getInvestigacionesPorCaso(caso.id);
            setInvestigaciones(Array.isArray(inv) ? inv : []);
        } catch (e: any) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    const cerrado = caso.estado === 'CERRADO' || caso.estado === 'RESUELTO';

    return (
        <div className="space-y-6 pb-20 lg:pb-8">
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
                <Button variant="ghost" size="sm" onClick={onBack}>
                    <ArrowLeft className="size-4 mr-1" /> Casos
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold">Caso #{caso.id}</h2>
                        <Badge className={ESTADO_COLOR[caso.estado] || 'bg-gray-100 text-gray-500'}>{caso.estado}</Badge>
                        <Badge className={PRIORIDAD_COLOR[caso.prioridad] || 'bg-gray-100 text-gray-500'}>{caso.prioridad}</Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Usuario #{caso.usuarioId} · {caso.tipoCaso} · Creado {fmt(caso.fechaCreacion)}
                    </p>
                </div>
                {/* Acciones */}
                <div className="flex gap-2 flex-wrap">
                    {!caso.agenteSoporteId && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAsignar}>
                            Asignarme
                        </Button>
                    )}
                    {!cerrado && (
                        <>
                            <Button size="sm" variant="outline" onClick={handleEscalar}>
                                <Flag className="size-3 mr-1" /> Escalar
                            </Button>
                            <Button size="sm" variant="outline" className="text-green-600"
                                    onClick={() => setShowResolver(true)}>
                                <CheckCircle2 className="size-3 mr-1" /> Resolver
                            </Button>
                            <Button size="sm" variant="outline" className="text-gray-500"
                                    onClick={() => setShowCerrar(true)}>
                                <XCircle className="size-3 mr-1" /> Cerrar
                            </Button>
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white"
                                    onClick={() => setShowInvestigar(true)}>
                                <Microscope className="size-3 mr-1" /> Investigar
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Descripción */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                    <p className="text-sm font-semibold text-gray-500 mb-1">Descripción del caso</p>
                    <p className="text-sm text-gray-800">{caso.descripcion || '—'}</p>
                    {caso.motivo && <p className="text-xs text-gray-400 mt-2">Motivo de cierre: {caso.motivo}</p>}
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-gray-400" /></div>
            ) : (
                <Tabs defaultValue="actividad" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="actividad">📋 Actividad</TabsTrigger>
                        <TabsTrigger value="transacciones">💳 Transacciones</TabsTrigger>
                        <TabsTrigger value="investigaciones">🔍 Investigaciones</TabsTrigger>
                    </TabsList>

                    {/* LOGS DE ACTIVIDAD */}
                    <TabsContent value="actividad" className="mt-4 space-y-2">
                        <p className="text-xs text-gray-400 mb-2">Últimos 20 eventos del usuario #{caso.usuarioId}</p>
                        {logs.length === 0 ? (
                            <Card className="border-dashed border-2 border-gray-200">
                                <CardContent className="p-8 text-center text-gray-400 text-sm">Sin eventos registrados</CardContent>
                            </Card>
                        ) : logs.map((log, i) => (
                            <div key={log.id || i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${NIVEL_COLOR[log.nivel] || 'bg-gray-50 text-gray-500'}`}>
                                    {log.nivel || 'INFO'}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-800">{log.tipoEvento}</p>
                                    <p className="text-xs text-gray-500 truncate">{log.descripcion}</p>
                                    {log.entidadAfectada && (
                                        <p className="text-[10px] text-gray-400">{log.entidadAfectada} #{log.entidadId}</p>
                                    )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-[10px] text-gray-400">{fmt(log.fechaHora)}</p>
                                    <span className={`text-[9px] px-1 rounded ${log.resultado === 'EXITOSO' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                        {log.resultado}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </TabsContent>

                    {/* TRANSACCIONES */}
                    <TabsContent value="transacciones" className="mt-4 space-y-2">
                        <p className="text-xs text-gray-400 mb-2">Transacciones auditadas del usuario #{caso.usuarioId} </p>
                        {transacciones.length === 0 ? (
                            <Card className="border-dashed border-2 border-gray-200">
                                <CardContent className="p-8 text-center text-gray-400 text-sm">Sin transacciones registradas</CardContent>
                            </Card>
                        ) : transacciones.map((t, i) => (
                            <div key={t.id || i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${RIESGO_COLOR[t.nivelRiesgo] || 'bg-gray-50 text-gray-500'}`}>
                                    {t.nivelRiesgo}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-800">{t.tipoTransaccion}</p>
                                    <p className="text-xs text-gray-500 truncate">{t.detalle}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-[10px] text-gray-400">{fmt(t.fechaHora)}</p>
                                    <span className={`text-[9px] px-1 rounded ${t.resultado === 'EXITOSO' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                        {t.resultado}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </TabsContent>

                    {/* INVESTIGACIONES */}
                    <TabsContent value="investigaciones" className="mt-4 space-y-3">
                        {investigaciones.length === 0 ? (
                            <Card className="border-dashed border-2 border-gray-200">
                                <CardContent className="p-8 text-center text-gray-400 text-sm">
                                    Sin investigaciones. Usa el botón "Investigar" para abrir una.
                                </CardContent>
                            </Card>
                        ) : investigaciones.map((inv, i) => (
                            <Card key={inv.id || i} className="border-0 shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge className={inv.estado === 'CERRADA' ? 'bg-gray-100 text-gray-500' : 'bg-purple-100 text-purple-700'}>
                                                    {inv.estado}
                                                </Badge>
                                                <span className="text-xs text-gray-400">Abierta {fmt(inv.fechaApertura)}</span>
                                            </div>
                                            <p className="text-sm font-medium">{inv.motivo}</p>
                                            {inv.hallazgos && (
                                                <div className="mt-2 bg-yellow-50 rounded-lg p-2">
                                                    <p className="text-xs font-semibold text-yellow-700">Hallazgos:</p>
                                                    <p className="text-xs text-yellow-800">{inv.hallazgos}</p>
                                                </div>
                                            )}
                                            {inv.accionesTomadas && (
                                                <div className="mt-1 bg-green-50 rounded-lg p-2">
                                                    <p className="text-xs font-semibold text-green-700">Acciones tomadas:</p>
                                                    <p className="text-xs text-green-800">{inv.accionesTomadas}</p>
                                                </div>
                                            )}
                                        </div>
                                        {inv.estado !== 'CERRADA' && (
                                            <div className="flex gap-1.5 flex-shrink-0">
                                                <Button size="sm" variant="outline" className="text-xs"
                                                        onClick={() => { setShowHallazgos(inv); setHallazgosAdd(''); }}>
                                                    + Hallazgos
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-xs text-red-500"
                                                        onClick={() => { setShowCerrarInv(inv); setHallazgosText(''); setAccionesText(''); }}>
                                                    Cerrar
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>
                </Tabs>
            )}

            {/* Dialogs */}
            <Dialog open={showResolver} onOpenChange={setShowResolver}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Resolver caso #{caso.id}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <Label className="text-sm">Resolución aplicada</Label>
                        <Textarea placeholder="Describe cómo se resolvió el problema..."
                                  value={resolucion} onChange={e => setResolucion(e.target.value)} rows={4} />
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowResolver(false)}>Cancelar</Button>
                            <Button className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={handleResolver} disabled={saving}>
                                {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : null} Marcar resuelto
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showCerrar} onOpenChange={setShowCerrar}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Cerrar caso #{caso.id}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <Label className="text-sm">Motivo de cierre (opcional)</Label>
                        <Textarea placeholder="Motivo..." value={motivoCierre}
                                  onChange={e => setMotivoCierre(e.target.value)} rows={3} />
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowCerrar(false)}>Cancelar</Button>
                            <Button variant="outline" className="text-red-500 border-red-200"
                                    onClick={handleCerrar} disabled={saving}>
                                {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : null} Cerrar caso
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showInvestigar} onOpenChange={setShowInvestigar}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Abrir investigación — Caso #{caso.id}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <Label className="text-sm">Motivo de la investigación</Label>
                        <Textarea placeholder="Describe por qué se abre esta investigación..."
                                  value={motivoInv} onChange={e => setMotivoInv(e.target.value)} rows={3} />
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowInvestigar(false)}>Cancelar</Button>
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white"
                                    onClick={handleAbrirInvestigacion} disabled={saving}>
                                {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : null} Abrir investigación
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!showHallazgos} onOpenChange={() => setShowHallazgos(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Agregar hallazgos</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <Textarea placeholder="Describe los hallazgos encontrados..."
                                  value={hallazgosAdd} onChange={e => setHallazgosAdd(e.target.value)} rows={4} />
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowHallazgos(null)}>Cancelar</Button>
                            <Button className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                    onClick={handleAgregarHallazgos} disabled={saving}>
                                {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : null} Guardar hallazgos
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!showCerrarInv} onOpenChange={() => setShowCerrarInv(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Cerrar investigación</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-sm">Hallazgos finales</Label>
                            <Textarea className="mt-1" placeholder="Hallazgos conclusivos..."
                                      value={hallazgosText} onChange={e => setHallazgosText(e.target.value)} rows={3} />
                        </div>
                        <div>
                            <Label className="text-sm">Acciones tomadas</Label>
                            <Textarea className="mt-1" placeholder="Acciones correctivas aplicadas..."
                                      value={accionesText} onChange={e => setAccionesText(e.target.value)} rows={3} />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowCerrarInv(null)}>Cancelar</Button>
                            <Button className="bg-gray-700 hover:bg-gray-800 text-white"
                                    onClick={handleCerrarInvestigacion} disabled={saving}>
                                {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : null} Cerrar investigación
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ── PÁGINA PRINCIPAL SOPORTE ──────────────────────────────────
export function SoportePage() {
    const { user } = useAuth();
    const agenteId = user?.role === 'SOPORTE' ? user?.operadorId : user?.usuarioId;

    const [loading, setLoading] = useState(true);
    const [casoActivo, setCasoActivo] = useState<any>(null);

    // Datos
    const [misCasos, setMisCasos] = useState<any[]>([]);
    const [sinAsignar, setSinAsignar] = useState<any[]>([]);
    const [anomalias, setAnomalias] = useState<any[]>([]);
    const [logsRecientes, setLogsRecientes] = useState<any[]>([]);
    const [contadores, setContadores] = useState({ abiertos: 0, enProceso: 0, escalados: 0, resueltos: 0 });

    // Búsqueda usuario
    const [busquedaUsername, setBusquedaUsername] = useState('');
    const [usuarioBuscado, setUsuarioBuscado] = useState<any>(null);
    const [casosUsuario, setCasosUsuario] = useState<any[]>([]);
    const [buscando, setBuscando] = useState(false);

    // Nuevo caso
    const [showNuevoCaso, setShowNuevoCaso] = useState(false);
    const [nuevoCaso, setNuevoCaso] = useState({ usuarioId: '', tipoCaso: '', descripcion: '', prioridad: 'MEDIA' });
    const [creando, setCreando] = useState(false);

    const [detalleUsuario, setDetalleUsuario] = useState<any>(null); // logs, entradas, etc.
    const [loadingDetalle, setLoadingDetalle] = useState(false);

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const [mis, sin, anom, logs, contA, contP, contE, contR] = await Promise.all([
                agenteId ? getCasosPorAgente(agenteId) : Promise.resolve([]),
                getCasosSinAsignar(),
                getAnomalias(),
                getLogsRecientes(),
                contarCasos('ABIERTO'),
                contarCasos('EN_PROCESO'),
                contarCasos('ESCALADO'),
                contarCasos('RESUELTO'),
            ]);
            setMisCasos(Array.isArray(mis) ? mis : []);
            setSinAsignar(Array.isArray(sin) ? sin : []);
            setAnomalias(Array.isArray(anom) ? anom : []);
            setLogsRecientes(Array.isArray(logs) ? logs.slice(0, 15) : []);
            setContadores({
                abiertos: Number(contA) || 0,
                enProceso: Number(contP) || 0,
                escalados: Number(contE) || 0,
                resueltos: Number(contR) || 0,
            });
        } catch (e) {
            console.error(e);
        } finally { setLoading(false); }
    }, [agenteId]);

    useEffect(() => { cargar(); }, [cargar]);

    const handleBuscarUsuario = async () => {
        if (!busquedaUsername.trim()) return;
        setBuscando(true);
        setUsuarioBuscado(null);
        setDetalleUsuario(null);
        try {
            const u = await buscarUsuarioPorUsername(busquedaUsername.trim());
            if (!u) return toast.error('Usuario no encontrado');
            setUsuarioBuscado(u);

            // Cargar todo sobre el usuario en paralelo
            setLoadingDetalle(true);
            const [casos, logs, transacc, entradas, reservas, inventario, intercambios] = await Promise.all([
                getCasosPorUsuario(u.id),
                getLogsPorUsuario(u.id),
                getTransaccionesPorUsuario(u.id),
                getEntradasUsuario(u.id),
                getReservasUsuario(u.id),
                getInventarioUsuario(u.id),
                getIntercambiosUsuario(u.id),
            ]);
            setCasosUsuario(Array.isArray(casos) ? casos : []);
            setDetalleUsuario({
                logs: Array.isArray(logs) ? logs : [],
                transacciones: Array.isArray(transacc) ? transacc : [],
                entradas: Array.isArray(entradas) ? entradas : [],
                reservas: Array.isArray(reservas) ? reservas : [],
                inventario: Array.isArray(inventario) ? inventario : [],
                intercambios: Array.isArray(intercambios) ? intercambios : [],
            });
        } catch (e: any) { toast.error(e.message); }
        finally { setBuscando(false); setLoadingDetalle(false); }
    };
    const handleCrearCaso = async () => {
        if (!nuevoCaso.usuarioId || !nuevoCaso.tipoCaso || !nuevoCaso.descripcion)
            return toast.error('Completa todos los campos obligatorios');
        setCreando(true);
        try {
            await crearCaso({
                usuarioId: Number(nuevoCaso.usuarioId),
                agenteSoporteId: agenteId,
                tipoCaso: nuevoCaso.tipoCaso,
                descripcion: nuevoCaso.descripcion,
                prioridad: nuevoCaso.prioridad,
                estado: 'ABIERTO',
                fechaCreacion: new Date().toISOString(),
            });
            toast.success('✅ Caso creado');
            setShowNuevoCaso(false);
            setNuevoCaso({ usuarioId: '', tipoCaso: '', descripcion: '', prioridad: 'MEDIA' });
            await cargar();
        } catch (e: any) { toast.error(e.message); }
        finally { setCreando(false); }
    };

    // Vista detalle de caso
    if (casoActivo) {
        return (
            <div className="px-4 md:px-6 pt-4">
                <DetalleCaso
                    caso={casoActivo}
                    agenteId={agenteId}
                    onBack={() => { setCasoActivo(null); cargar(); }}
                    onRefresh={() => {
                        const id = casoActivo.id;
                        cargar().then(() => {
                            // Refrescar el caso activo
                        });
                    }}
                />
            </div>
        );
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="size-8 animate-spin text-[#8B000F]" />
        </div>
    );

    return (
        <div className="space-y-6 pb-20 lg:pb-8 px-4 md:px-6">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2 mb-1">
                        <Shield className="size-7 text-[#8B000F]" /> Panel de Soporte
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Agente: <span className="font-semibold">{user?.nombreCompleto || user?.username}</span>{agenteId}
                    </p>
                </div>
                <Button className="bg-[#8B000F] hover:bg-[#6B0008] text-white"
                        onClick={() => setShowNuevoCaso(true)}>
                    <FileText className="size-4 mr-2" /> Nuevo caso
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Abiertos" value={contadores.abiertos} icon={Inbox} color="text-blue-600" bg="bg-blue-50" />
                <StatCard label="En proceso" value={contadores.enProceso} icon={Activity} color="text-yellow-600" bg="bg-yellow-50" />
                <StatCard label="Escalados" value={contadores.escalados} icon={TrendingUp} color="text-orange-600" bg="bg-orange-50" />
                <StatCard label="Resueltos" value={contadores.resueltos} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
            </div>

            {/* Alertas de anomalías RF-18 */}
            {anomalias.length > 0 && (
                <Card className="border-red-200 bg-red-50 border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-red-700">
                            <AlertTriangle className="size-5" /> {anomalias.length} Anomalía(s) detectada(s) — RF-18
                        </CardTitle>
                        <CardDescription className="text-red-600">Transacciones con comportamiento anómalo que requieren revisión</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {anomalias.slice(0, 5).map((a, i) => (
                            <div key={a.id || i} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-red-100">
                                <AlertCircle className="size-4 text-red-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold">{a.tipoTransaccion}</p>
                                    <p className="text-xs text-gray-500 truncate">{a.detalle}</p>
                                    <p className="text-[10px] text-gray-400">Usuario #{a.usuarioId} · {fmt(a.fechaHora)}</p>
                                </div>
                                <Badge className={RIESGO_COLOR[a.nivelRiesgo] || 'bg-gray-100 text-gray-500'}>
                                    {a.nivelRiesgo}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="mis-casos" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="mis-casos">📋 Mis casos ({misCasos.length})</TabsTrigger>
                    <TabsTrigger value="sin-asignar">📥 Sin asignar ({sinAsignar.length})</TabsTrigger>
                    <TabsTrigger value="buscar">🔍 Buscar usuario</TabsTrigger>
                    <TabsTrigger value="logs">📊 Actividad reciente</TabsTrigger>
                </TabsList>

                {/* MIS CASOS */}
                <TabsContent value="mis-casos" className="mt-4 space-y-3">
                    {misCasos.length === 0 ? (
                        <Card className="border-dashed border-2 border-gray-200">
                            <CardContent className="p-10 text-center text-gray-400">
                                <Inbox className="size-10 mx-auto mb-3 opacity-40" />
                                <p className="text-sm">No tienes casos asignados</p>
                            </CardContent>
                        </Card>
                    ) : misCasos.map(caso => (
                        <Card key={caso.id} className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                              onClick={() => setCasoActivo(caso)}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="text-sm font-bold">#{caso.id}</span>
                                            <Badge className={`text-[10px] ${ESTADO_COLOR[caso.estado] || 'bg-gray-100 text-gray-500'}`}>{caso.estado}</Badge>
                                            <Badge className={`text-[10px] ${PRIORIDAD_COLOR[caso.prioridad] || 'bg-gray-100 text-gray-500'}`}>{caso.prioridad}</Badge>
                                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{caso.tipoCaso}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 truncate">{caso.descripcion}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            Usuario #{caso.usuarioId} · {fmt(caso.fechaCreacion)}
                                        </p>
                                    </div>
                                    <ChevronRight className="size-4 text-gray-400 flex-shrink-0" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                {/* SIN ASIGNAR */}
                <TabsContent value="sin-asignar" className="mt-4 space-y-3">
                    {sinAsignar.length === 0 ? (
                        <Card className="border-dashed border-2 border-gray-200">
                            <CardContent className="p-10 text-center text-gray-400">
                                <CheckCircle2 className="size-10 mx-auto mb-3 opacity-40" />
                                <p className="text-sm">No hay casos sin asignar</p>
                            </CardContent>
                        </Card>
                    ) : sinAsignar.map(caso => (
                        <Card key={caso.id} className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                              onClick={() => setCasoActivo(caso)}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="text-sm font-bold">#{caso.id}</span>
                                            <Badge className={`text-[10px] ${ESTADO_COLOR[caso.estado] || 'bg-gray-100 text-gray-500'}`}>{caso.estado}</Badge>
                                            <Badge className={`text-[10px] ${PRIORIDAD_COLOR[caso.prioridad] || 'bg-gray-100 text-gray-500'}`}>{caso.prioridad}</Badge>
                                        </div>
                                        <p className="text-xs text-gray-500">{caso.tipoCaso} · {caso.descripcion?.substring(0, 80)}...</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">Usuario #{caso.usuarioId} · {fmt(caso.fechaCreacion)}</p>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                                onClick={async e => {
                                                    e.stopPropagation();
                                                    try {
                                                        await asignarCaso(caso.id, agenteId);
                                                        toast.success('Caso asignado');
                                                        cargar();
                                                    } catch (err: any) { toast.error(err.message); }
                                                }}>
                                            Asignarme
                                        </Button>
                                        <ChevronRight className="size-4 text-gray-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                {/* BUSCAR USUARIO — RF-19 */}
                <TabsContent value="buscar" className="mt-4 space-y-4">
                    {/* Búsqueda */}
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                            <p className="text-sm font-semibold text-gray-700 mb-3">
                                Consultar acciones de un usuario
                            </p>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                                    <Input placeholder="Username del usuario..."
                                           value={busquedaUsername}
                                           onChange={e => setBusquedaUsername(e.target.value)}
                                           onKeyDown={e => e.key === 'Enter' && handleBuscarUsuario()}
                                           className="pl-9" />
                                </div>
                                <Button className="bg-[#8B000F] hover:bg-[#6B0008] text-white"
                                        onClick={handleBuscarUsuario} disabled={buscando}>
                                    {buscando ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Resultado */}
                    {usuarioBuscado && (
                        <>
                            {/* Tarjeta info usuario */}
                            <Card className="border-0 shadow-sm bg-blue-50 border border-blue-100">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="size-12 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                                            <User className="size-6 text-blue-700" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-blue-800 text-lg">@{usuarioBuscado.nombreUsuario}</p>
                                            <div className="flex gap-3 flex-wrap text-xs text-blue-600 mt-0.5">
                                                <span>ID #{usuarioBuscado.id}</span>
                                                <span>·</span>
                                                <span>{usuarioBuscado.correo}</span>
                                                <span>·</span>
                                                <span className={`font-semibold ${usuarioBuscado.estadoCuenta === 'ACTIVA' ? 'text-green-600' : 'text-red-600'}`}>
                                    {usuarioBuscado.estadoCuenta}
                                </span>
                                            </div>
                                        </div>
                                        <Button size="sm" className="bg-[#8B000F] hover:bg-[#6B0008] text-white flex-shrink-0"
                                                onClick={() => {
                                                    setShowNuevoCaso(true);
                                                    setNuevoCaso(p => ({ ...p, usuarioId: String(usuarioBuscado.id) }));
                                                }}>
                                            <FileText className="size-3 mr-1" /> Crear caso
                                        </Button>
                                    </div>

                                    {/* Mini stats */}
                                    {detalleUsuario && (
                                        <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-blue-200">
                                            {[
                                                { label: 'Entradas', value: detalleUsuario.entradas.length, color: 'text-blue-700' },
                                                { label: 'Intercambios', value: detalleUsuario.intercambios.length, color: 'text-purple-700' },
                                                { label: 'Láminas', value: detalleUsuario.inventario.length, color: 'text-green-700' },
                                                { label: 'Eventos log', value: detalleUsuario.logs.length, color: 'text-gray-700' },
                                            ].map(s => (
                                                <div key={s.label} className="text-center">
                                                    <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                                                    <div className="text-[10px] text-gray-500">{s.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {loadingDetalle ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="size-6 animate-spin text-gray-400" />
                                </div>
                            ) : detalleUsuario && (
                                <Tabs defaultValue="actividad" className="w-full">
                                    <TabsList className="grid w-full grid-cols-5">
                                        <TabsTrigger value="actividad">📋 Actividad</TabsTrigger>
                                        <TabsTrigger value="entradas">🎫 Entradas</TabsTrigger>
                                        <TabsTrigger value="transacciones">💳 Transacciones</TabsTrigger>
                                        <TabsTrigger value="album">📖 Álbum</TabsTrigger>
                                        <TabsTrigger value="casos">🗂️ Casos</TabsTrigger>
                                    </TabsList>

                                    {/* ACTIVIDAD / LOGS */}
                                    <TabsContent value="actividad" className="mt-3 space-y-2">
                                        <p className="text-xs text-gray-400">
                                            {detalleUsuario.logs.length} eventos registrados — RF-19
                                        </p>
                                        {detalleUsuario.logs.length === 0 ? (
                                            <Card className="border-dashed border-2 border-gray-200">
                                                <CardContent className="p-6 text-center text-gray-400 text-sm">Sin eventos</CardContent>
                                            </Card>
                                        ) : detalleUsuario.logs.map((log: any, i: number) => (
                                            <div key={log.id || i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${NIVEL_COLOR[log.nivel] || 'bg-gray-50 text-gray-500'}`}>
                                    {log.nivel || 'INFO'}
                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold">{log.tipoEvento}</p>
                                                    <p className="text-xs text-gray-500 truncate">{log.descripcion}</p>
                                                    {log.entidadAfectada && (
                                                        <p className="text-[10px] text-gray-400">{log.entidadAfectada} #{log.entidadId}</p>
                                                    )}
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-[10px] text-gray-400">{fmt(log.fechaHora)}</p>
                                                    <span className={`text-[9px] px-1 rounded ${log.resultado === 'EXITOSO' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                        {log.resultado}
                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </TabsContent>

                                    {/* ENTRADAS */}
                                    <TabsContent value="entradas" className="mt-3 space-y-2">
                                        <p className="text-xs text-gray-400">{detalleUsuario.entradas.length} entradas · {detalleUsuario.reservas.length} reservas</p>
                                        {detalleUsuario.entradas.length === 0 ? (
                                            <Card className="border-dashed border-2 border-gray-200">
                                                <CardContent className="p-6 text-center text-gray-400 text-sm">Sin entradas</CardContent>
                                            </Card>
                                        ) : detalleUsuario.entradas.map((e: any, i: number) => (
                                            <div key={e.id || i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-xs font-semibold">Entrada #{e.id}</p>
                                                        <Badge className={`text-[9px] ${
                                                            e.estado === 'PAGADA' ? 'bg-green-100 text-green-700' :
                                                                e.estado === 'RESERVADA' ? 'bg-yellow-100 text-yellow-700' :
                                                                    e.estado === 'DISPONIBLE' ? 'bg-blue-100 text-blue-700' :
                                                                        'bg-gray-100 text-gray-500'
                                                        }`}>{e.estado}</Badge>
                                                        {e.categoria && <span className="text-[10px] text-gray-400">{e.categoria}</span>}
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        Partido #{e.partidoId}
                                                        {e.monto && ` · $${e.monto}`}
                                                        {e.correlationId && ` · ${e.correlationId}`}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-[10px] text-gray-400">{fmt(e.fechaCompra || e.fechaReserva)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </TabsContent>

                                    {/* TRANSACCIONES — RF-20 sin exponer info sensible */}
                                    <TabsContent value="transacciones" className="mt-3 space-y-2">
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2">
                                            <p className="text-[10px] text-amber-700 font-semibold">
                                                RF-20 — Auditoría sin información sensible. No se muestran números de tarjeta ni datos bancarios.
                                            </p>
                                        </div>
                                        {detalleUsuario.transacciones.length === 0 ? (
                                            <Card className="border-dashed border-2 border-gray-200">
                                                <CardContent className="p-6 text-center text-gray-400 text-sm">Sin transacciones auditadas</CardContent>
                                            </Card>
                                        ) : detalleUsuario.transacciones.map((t: any, i: number) => (
                                            <div key={t.id || i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${RIESGO_COLOR[t.nivelRiesgo] || 'bg-gray-50 text-gray-500'}`}>
                                    {t.nivelRiesgo || 'BAJO'}
                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold">{t.tipoTransaccion}</p>
                                                    {/* RF-20: mostrar detalle pero sin datos sensibles */}
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {t.detalle?.replace(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, '****-****-****-****')}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">ID #{t.transaccionId} · {t.correlationId}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-[10px] text-gray-400">{fmt(t.fechaHora)}</p>
                                                    <span className={`text-[9px] px-1 rounded ${t.resultado === 'EXITOSO' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                        {t.resultado}
                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </TabsContent>

                                    {/* ÁLBUM */}
                                    <TabsContent value="album" className="mt-3 space-y-2">
                                        <p className="text-xs text-gray-400">
                                            {detalleUsuario.inventario.length} láminas · {detalleUsuario.intercambios.length} intercambios
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Card className="border-0 shadow-sm">
                                                <CardContent className="p-3">
                                                    <p className="text-xs font-semibold text-gray-600 mb-2">Resumen álbum</p>
                                                    <div className="space-y-1">
                                                        {[
                                                            { label: 'Total láminas', value: detalleUsuario.inventario.length },
                                                            { label: 'Repetidas', value: detalleUsuario.inventario.filter((i: any) => i.esRepetida).length },
                                                            { label: 'Pegadas', value: detalleUsuario.inventario.filter((i: any) => i.pegada).length },
                                                        ].map(s => (
                                                            <div key={s.label} className="flex justify-between text-xs">
                                                                <span className="text-gray-500">{s.label}</span>
                                                                <span className="font-bold">{s.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card className="border-0 shadow-sm">
                                                <CardContent className="p-3">
                                                    <p className="text-xs font-semibold text-gray-600 mb-2">Intercambios</p>
                                                    <div className="space-y-1">
                                                        {[
                                                            { label: 'Total', value: detalleUsuario.intercambios.length },
                                                            { label: 'Completados', value: detalleUsuario.intercambios.filter((i: any) => i.estado === 'COMPLETADO').length },
                                                            { label: 'Pendientes', value: detalleUsuario.intercambios.filter((i: any) => i.estado === 'PENDIENTE').length },
                                                        ].map(s => (
                                                            <div key={s.label} className="flex justify-between text-xs">
                                                                <span className="text-gray-500">{s.label}</span>
                                                                <span className="font-bold">{s.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </TabsContent>

                                    {/* CASOS */}
                                    <TabsContent value="casos" className="mt-3 space-y-2">
                                        <p className="text-xs text-gray-400">{casosUsuario.length} casos de soporte</p>
                                        {casosUsuario.length === 0 ? (
                                            <Card className="border-dashed border-2 border-gray-200">
                                                <CardContent className="p-6 text-center text-gray-400 text-sm">Sin casos de soporte</CardContent>
                                            </Card>
                                        ) : casosUsuario.map(caso => (
                                            <Card key={caso.id} className="border-0 shadow-sm cursor-pointer hover:shadow-md"
                                                  onClick={() => setCasoActivo(caso)}>
                                                <CardContent className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold">#{caso.id}</span>
                                                        <Badge className={`text-[10px] ${ESTADO_COLOR[caso.estado] || 'bg-gray-100 text-gray-500'}`}>{caso.estado}</Badge>
                                                        <Badge className={`text-[10px] ${PRIORIDAD_COLOR[caso.prioridad] || 'bg-gray-100 text-gray-500'}`}>{caso.prioridad}</Badge>
                                                        <span className="text-xs text-gray-500 flex-1 truncate">{caso.tipoCaso}</span>
                                                        <span className="text-[10px] text-gray-400">{fmt(caso.fechaCreacion)}</span>
                                                        <ChevronRight className="size-4 text-gray-400" />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </TabsContent>
                                </Tabs>
                            )}
                        </>
                    )}
                </TabsContent>

                {/* ACTIVIDAD RECIENTE */}
                <TabsContent value="logs" className="mt-4 space-y-2">
                    <p className="text-xs text-gray-400 mb-2">Últimos 15 eventos del sistema</p>
                    {logsRecientes.length === 0 ? (
                        <Card className="border-dashed border-2 border-gray-200">
                            <CardContent className="p-8 text-center text-gray-400 text-sm">Sin eventos recientes</CardContent>
                        </Card>
                    ) : logsRecientes.map((log, i) => (
                        <div key={log.id || i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 mt-0.5 ${NIVEL_COLOR[log.nivel] || 'bg-gray-50 text-gray-500'}`}>
                                {log.nivel || 'INFO'}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold">{log.tipoEvento}</p>
                                    {log.usuarioId && (
                                        <span className="text-[10px] text-gray-400">Usuario #{log.usuarioId}</span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">{log.descripcion}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-[10px] text-gray-400">{fmt(log.fechaHora)}</p>
                                <span className={`text-[9px] px-1 rounded ${log.resultado === 'EXITOSO' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                    {log.resultado}
                                </span>
                            </div>
                        </div>
                    ))}
                </TabsContent>
            </Tabs>

            {/* Dialog nuevo caso */}
            <Dialog open={showNuevoCaso} onOpenChange={setShowNuevoCaso}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Crear nuevo caso de soporte</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-sm">ID del usuario *</Label>
                            <Input className="mt-1" placeholder="ID numérico del usuario"
                                   value={nuevoCaso.usuarioId}
                                   onChange={e => setNuevoCaso(p => ({ ...p, usuarioId: e.target.value }))} />
                        </div>
                        <div>
                            <Label className="text-sm">Tipo de caso *</Label>
                            <Select value={nuevoCaso.tipoCaso}
                                    onValueChange={v => setNuevoCaso(p => ({ ...p, tipoCaso: v }))}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Selecciona el tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {['FRAUDE', 'ACCESO', 'PAGO', 'INTERCAMBIO', 'ALBUM', 'CUENTA', 'OTRO'].map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-sm">Prioridad</Label>
                            <Select value={nuevoCaso.prioridad}
                                    onValueChange={v => setNuevoCaso(p => ({ ...p, prioridad: v }))}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {['BAJA', 'MEDIA', 'ALTA', 'CRITICA'].map(p => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-sm">Descripción *</Label>
                            <Textarea className="mt-1" placeholder="Describe el problema del usuario..."
                                      value={nuevoCaso.descripcion}
                                      onChange={e => setNuevoCaso(p => ({ ...p, descripcion: e.target.value }))}
                                      rows={3} />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowNuevoCaso(false)}>Cancelar</Button>
                            <Button className="bg-[#8B000F] hover:bg-[#6B0008] text-white"
                                    onClick={handleCrearCaso} disabled={creando}>
                                {creando ? <Loader2 className="size-4 animate-spin mr-1" /> : null} Crear caso
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}