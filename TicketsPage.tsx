import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import {
  Ticket, MapPin, Clock, ArrowRight, Shield, Check,
  Loader2, QrCode, ArrowLeftRight, RefreshCw, AlertCircle, Timer, Flag
} from 'lucide-react';
import {
  getMyTickets, reserveTicket, payReservation,
  transferTicket, requestRefund,
  getMisReembolsos, cancelarReembolso,
  TICKET_LIMITS, TICKET_STATUS, REFUND_STATUS,
} from '../../services/ticketsService';
import { getPartidosConInfo, getTicketTypesParaPartido } from '../../services/partidoService';

const QRVisual = ({ code }: { code: string }) => {
  const hash = code.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const grid = Array.from({ length: 11 }, (_, row) =>
      Array.from({ length: 11 }, (_, col) => {
        if ((row < 3 && col < 3) || (row < 3 && col > 7) || (row > 7 && col < 3)) return true;
        return ((hash * (row + 1) * (col + 1)) % 3) === 0;
      })
  );
  return (
      <div className="bg-white p-3 rounded-xl inline-block shadow-inner border border-gray-100">
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(11, 1fr)` }}>
          {grid.flat().map((filled, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${filled ? 'bg-gray-900' : 'bg-white'}`} />
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-2 font-mono">{code.slice(0, 16)}</p>
      </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; className: string }> = {
    [TICKET_STATUS.PAGADA]:              { label: '✅ Pagada',            className: 'bg-green-100 text-green-700' },
    [TICKET_STATUS.RESERVADA]:           { label: '⏳ Reservada',         className: 'bg-yellow-100 text-yellow-700' },
    [TICKET_STATUS.TRANSFERIDA]:         { label: '↗️ Transferida',       className: 'bg-blue-100 text-blue-700' },
    [TICKET_STATUS.REEMBOLSO_PENDIENTE]: { label: '↩️ Reembolso pendiente', className: 'bg-orange-100 text-orange-700' },
    [TICKET_STATUS.EXPIRADA]:            { label: '❌ Expirada',          className: 'bg-red-100 text-red-600' },
  };
  const s = map[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  return <Badge className={`${s.className} border-0 text-xs`}>{s.label}</Badge>;
};

const ReservationTimer = ({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) => {
  const [secs, setSecs] = useState(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)));
  useEffect(() => {
    if (secs <= 0) { onExpire(); return; }
    const t = setInterval(() => setSecs(s => { if (s <= 1) { onExpire(); clearInterval(t); return 0; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(secs / 60), s = secs % 60;
  return (
      <div className={`flex items-center gap-1 text-sm font-mono font-bold ${secs < 60 ? 'text-red-600' : 'text-amber-600'}`}>
        <Timer className="size-4" /> {m}:{s.toString().padStart(2, '0')}
      </div>
  );
};

const TeamFlag = ({ banderaUrl, emoji, nombre }: { banderaUrl?: string; emoji: string; nombre: string }) => {
  if (banderaUrl) {
    return <img src={banderaUrl} alt={nombre} className="w-8 h-6 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />;
  }
  return <span className="text-2xl">{emoji}</span>;
};

export function TicketsPage() {
  const { user } = useAuth();

  const [partidos, setPartidos] = useState<any[]>([]);
  const [selectedPartido, setSelectedPartido] = useState<any>(null);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [misReembolsos, setMisReembolsos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTicketTypes, setLoadingTicketTypes] = useState(false);

  const [buyStep, setBuyStep] = useState(1);
  const [selectedTicketType, setSelectedTicketType] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [bankPse, setBankPse] = useState('');
  const [reservation, setReservation] = useState<any>(null);
  const [factura, setFactura] = useState<any>(null);
  const [buying, setBuying] = useState(false);
  const [showBuyDialog, setShowBuyDialog] = useState(false);

  const [transferTarget, setTransferTarget] = useState<any>(null);
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferRecipientUser, setTransferRecipientUser] = useState<any>(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  const [refundTarget, setRefundTarget] = useState<any>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  const [qrTicket, setQrTicket] = useState<any>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ps, mis, reembolsos] = await Promise.all([
          getPartidosConInfo(),
          getMyTickets(user?.usuarioId),
          getMisReembolsos(user?.usuarioId),
        ]);
        setPartidos(ps);
        setMyTickets(mis);
        setMisReembolsos(reembolsos);
      } catch (e: any) {
        toast.error('Error cargando datos: ' + e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.usuarioId]);

  const handleSelectPartido = async (partido: any) => {
    setSelectedPartido(partido);
    setTicketTypes([]);
    setLoadingTicketTypes(true);
    try {
      const types = await getTicketTypesParaPartido(partido);
      setTicketTypes(types);
    } catch (e: any) {
      toast.error('Error cargando entradas: ' + e.message);
    } finally {
      setLoadingTicketTypes(false);
    }
  };

  const openBuy = (ticketType: any) => {
    if (ticketType.disponibles === 0) return toast.error('No hay entradas disponibles en esta categoría');
    setSelectedTicketType(ticketType);
    setBuyStep(1);
    setQuantity(1);
    setCardNumber(''); setCardName(''); setCardExpiry(''); setCardCvv('');
    setReservation(null);
    setShowBuyDialog(true);
  };

  const handleNextStep = async () => {
    if (buyStep === 1) {
      setBuying(true);
      try {
        const entradaId = selectedTicketType.entradasIds[0];
        if (!entradaId) throw new Error('No hay entrada disponible para reservar');
        const res = await reserveTicket({ entradaId, usuarioId: user?.usuarioId });
        setReservation(res);
        setBuyStep(2);
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setBuying(false);
      }
    } else if (buyStep === 2) {
      if (paymentMethod === 'card' && !cardNumber) return toast.error('Completa los datos de la tarjeta');
      if (paymentMethod === 'pse' && !bankPse) return toast.error('Selecciona tu banco');
      setBuyStep(3);
    } else if (buyStep === 3) {
      setBuying(true);
      try {
        const metodo = paymentMethod === 'card' ? cardNumber : `PSE-${bankPse}`;
        const resultado = await payReservation({
          reservaId: reservation?.reservaId,
          usuarioId: user?.usuarioId,
          metodoPago: metodo,
        });
        if (resultado.factura) setFactura(resultado.factura);
        const mis = await getMyTickets(user?.usuarioId);
        setMyTickets(mis);
        const types = await getTicketTypesParaPartido(selectedPartido);
        setTicketTypes(types);
        setBuyStep(4);
        toast.success('🎉 ¡Compra exitosa! Tus entradas están listas');
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setBuying(false);
      }
    }
  };

  const handleBuscarUsuario = async () => {
    if (!transferRecipient.trim()) return toast.error('Ingresa el nombre de usuario');
    setSearchingUser(true);
    setTransferRecipientUser(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8081/user/getbyusername/${transferRecipient.trim()}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Usuario no encontrado');
      const data = await res.json();
      if (data.id === user?.usuarioId) throw new Error('No puedes transferirte la entrada a ti mismo');
      setTransferRecipientUser(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSearchingUser(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferRecipientUser) return toast.error('Busca primero al usuario destinatario');
    setTransferring(true);
    try {
      await transferTicket({
        entradaId: transferTarget.id,
        usuarioOrigenId: user?.usuarioId,
        usuarioDestinoId: transferRecipientUser.id,
        motivo: 'Transferencia voluntaria',
      });
      const mis = await getMyTickets(user?.usuarioId);
      setMyTickets(mis);
      setShowTransferDialog(false);
      setTransferRecipient('');
      setTransferRecipientUser(null);
      toast.success('✅ Entrada transferida correctamente');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTransferring(false);
    }
  };

  const handleRefund = async () => {
    if (!refundReason.trim()) return toast.error('Indica el motivo del reembolso');
    setRefunding(true);
    try {
      await requestRefund({
        entradaId: refundTarget.id,
        usuarioId: user?.usuarioId,
        motivo: refundReason,
      });
      const mis = await getMyTickets(user?.usuarioId);
      const reembolsos = await getMisReembolsos(user?.usuarioId);
      setMyTickets(mis);
      setMisReembolsos(reembolsos);
      setShowRefundDialog(false);
      setRefundReason('');
      toast.success('↩️ Solicitud de reembolso enviada. Se procesará en 5 días hábiles.');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRefunding(false);
    }
  };

  const totalPrice = selectedTicketType ? selectedTicketType.precio * quantity : 0;
  const serviceFee = totalPrice * 0.1;
  const finalTotal = totalPrice + serviceFee;

  const PSE_BANKS = ['Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA Colombia', 'Nequi', 'Daviplata'];

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 className="size-8 animate-spin text-[#8B000F]" />
          <p className="text-sm text-gray-400">Cargando partidos del Mundial...</p>
        </div>
    );
  }

  return (
      <div className="space-y-6 pb-20 lg:pb-8 px-6">

        <div>
          <h1 className="text-3xl font-bold mb-1"> Entradas</h1>
          <p className="text-gray-500 text-sm">Compra y gestiona tus entradas del Mundial 2026</p>
        </div>

        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="buy">Comprar entradas</TabsTrigger>
            <TabsTrigger value="my-tickets">Mis entradas ({myTickets.length})</TabsTrigger>
            <TabsTrigger value="reembolsos">Reembolsos ({misReembolsos.length})</TabsTrigger>
          </TabsList>

          {/* ── TAB COMPRAR ── */}
          <TabsContent value="buy" className="space-y-4 mt-4">

            {/* Selector de partido */}
            <div className="space-y-2">
              <Label>Selecciona un partido</Label>
              <Select
                  value={selectedPartido?.id?.toString() || ''}
                  onValueChange={val => {
                    const p = partidos.find(p => p.id.toString() === val);
                    if (p) handleSelectPartido(p);
                  }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elige un partido para ver entradas disponibles..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {partidos.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.homeFlag} {p.homeTeam} vs {p.awayTeam} {p.awayFlag}
                        {p.fecha ? ` — ${p.fecha}` : ''}
                        {p.estadioNombre ? ` · ${p.estadioNombre}` : ''}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info del partido seleccionado */}
            {selectedPartido && (
                <Card className="border-0 bg-gradient-to-r from-blue-50 to-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <TeamFlag banderaUrl={selectedPartido.homeBanderaUrl} emoji={selectedPartido.homeFlag} nombre={selectedPartido.homeTeam} />
                        <div className="text-center">
                          <p className="font-bold text-sm">{selectedPartido.homeTeam}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-400">VS</p>
                        {selectedPartido.fase && <Badge variant="outline" className="text-xs mt-1">{selectedPartido.fase}</Badge>}
                      </div>
                      <div className="flex items-center gap-3 flex-row-reverse">
                        <TeamFlag banderaUrl={selectedPartido.awayBanderaUrl} emoji={selectedPartido.awayFlag} nombre={selectedPartido.awayTeam} />
                        <div className="text-center">
                          <p className="font-bold text-sm">{selectedPartido.awayTeam}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                      {selectedPartido.fecha && (
                          <span className="flex items-center gap-1">
                                            <Clock className="size-3" />
                            {new Date(selectedPartido.fecha).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                            {selectedPartido.hora ? ` — ${selectedPartido.hora}` : ''}
                                        </span>
                      )}
                      <span className="flex items-center gap-1">
                                        <MapPin className="size-3" />
                        {selectedPartido.estadioNombre}, {selectedPartido.ciudad}
                                    </span>
                      {selectedPartido.capacidad > 0 && (
                          <span className="flex items-center gap-1">
                                            <Flag className="size-3" />
                                            Capacidad: {selectedPartido.capacidad.toLocaleString()}
                                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
            )}

            {/* Entradas por categoría */}
            {loadingTicketTypes && (
                <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                  <Loader2 className="size-5 animate-spin" />
                  <span className="text-sm">Cargando disponibilidad...</span>
                </div>
            )}

            {!loadingTicketTypes && ticketTypes.map((tt) => (
                <Card key={tt.categoria} className="border-0 shadow-md hover:shadow-lg transition-all">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row gap-5">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="text-sm font-bold">{tt.categoria}</Badge>
                          <Badge className={tt.disponibles > 20
                              ? 'bg-green-100 text-green-700 border-0'
                              : tt.disponibles > 0
                                  ? 'bg-yellow-100 text-yellow-700 border-0'
                                  : 'bg-red-100 text-red-700 border-0'}>
                            {tt.disponibles > 0 ? `${tt.disponibles} disponibles` : 'Agotadas'}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-500">
                          {tt.fecha && (
                              <div className="flex items-center gap-2">
                                <Clock className="size-3.5" />
                                {new Date(tt.fecha).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                                {tt.hora ? ` — ${tt.hora}` : ''}
                              </div>
                          )}
                          <div className="flex items-center gap-2">
                            <MapPin className="size-3.5" />
                            {tt.estadioNombre}, {tt.ciudad}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between gap-3">
                        <div className="text-right">
                          <div className="text-3xl font-black text-[#8B000F]">${tt.precio}</div>
                          <div className="text-xs text-gray-400">USD por entrada</div>
                        </div>
                        <Button
                            className="bg-[#8B000F] hover:bg-[#6B0008] text-white"
                            disabled={tt.disponibles === 0}
                            onClick={() => openBuy(tt)}
                        >
                          Comprar <ArrowRight className="size-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            ))}

            {!selectedPartido && !loadingTicketTypes && (
                <div className="text-center py-12 text-gray-400">
                  <Ticket className="size-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Selecciona un partido para ver las entradas disponibles</p>
                </div>
            )}
          </TabsContent>

          {/* ── TAB MIS ENTRADAS ── */}
          <TabsContent value="my-tickets" className="space-y-4 mt-4">
            {myTickets.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-200">
                  <CardContent className="p-12 text-center">
                    <div className="text-5xl mb-3">🎟️</div>
                    <p className="text-gray-400">No tienes entradas aún</p>
                  </CardContent>
                </Card>
            ) : myTickets.map(ticket => {
              const partido = partidos.find(p => Number(p.id) === Number(ticket.partidoId));
              return (
                  <Card key={ticket.id} className="border-0 shadow-md">
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row gap-5">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {partido ? (
                                <h3 className="font-bold text-base flex items-center gap-2">
                                  <span>{partido.homeFlag}</span>
                                  <span>{partido.homeTeam}</span>
                                  <span className="text-gray-400 font-normal text-sm">vs</span>
                                  <span>{partido.awayTeam}</span>
                                  <span>{partido.awayFlag}</span>
                                </h3>
                            ) : (
                                <h3 className="font-bold text-base">Partido #{ticket.partidoId}</h3>
                            )}
                            <StatusBadge status={ticket.estado} />
                            {ticket.categoria && <Badge variant="outline" className="text-xs">{ticket.categoria}</Badge>}
                          </div>
                          <div className="space-y-1 text-sm text-gray-500">
                            {partido?.fecha && (
                                <div className="flex items-center gap-2">
                                  <Clock className="size-3.5" />
                                  {new Date(partido.fecha).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                  {partido.hora ? ` — ${partido.hora}` : ''}
                                </div>
                            )}
                            {partido?.estadioNombre && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="size-3.5" />
                                  {partido.estadioNombre}, {partido.ciudad}
                                </div>
                            )}
                            {ticket.ubicacionSilla && (
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <Ticket className="size-3.5" />
                                  {ticket.ubicacionSilla}
                                </div>
                            )}
                            {partido?.fase && (
                                <Badge variant="outline" className="text-xs w-fit">{partido.fase}</Badge>
                            )}
                            <div className="text-xs text-gray-400 font-mono">
                              ID: {ticket.id}
                              {ticket.correlationId ? ` · Correlación: ${ticket.correlationId}` : ''}
                            </div>
                            {ticket.precioSimulado && (
                                <div className="text-sm font-semibold text-[#8B000F]">
                                  ${ticket.precioSimulado} USD
                                </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                          <button
                              onClick={() => setQrTicket(ticket)}
                              className="hover:opacity-80 transition-opacity"
                          >
                            {ticket.codigoEntrada
                                ? <QRVisual code={ticket.codigoEntrada} />
                                : <div className="flex items-center gap-1 text-gray-300 border border-dashed rounded-xl p-6"><QrCode className="size-8" /></div>
                            }
                          </button>
                          {ticket.estado === TICKET_STATUS.PAGADA && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline"
                                        onClick={() => { setTransferTarget(ticket); setShowTransferDialog(true); }}>
                                  <ArrowLeftRight className="size-3 mr-1" /> Transferir
                                </Button>
                                <Button size="sm" variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => { setRefundTarget(ticket); setShowRefundDialog(true); }}>
                                  <RefreshCw className="size-3 mr-1" /> Reembolso
                                </Button>
                              </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              );
            })}

            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4 text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-amber-800 flex items-center gap-1">
                  <AlertCircle className="size-4" /> Reglas importantes
                </p>
                <p>• Reembolsos disponibles hasta {TICKET_LIMITS.refundWindowHours}h después de la compra</p>
                <p>• Máximo {TICKET_LIMITS.maxTransfersPerDay} transferencias por día</p>
                <p>• El código QR es único — no lo compartas públicamente</p>
                <p>• Las reservas expiran en {TICKET_LIMITS.reservationTTLSeconds / 60} minutos sin pago</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB REEMBOLSOS ── */}
          <TabsContent value="reembolsos" className="space-y-4 mt-4">
            {misReembolsos.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-200">
                  <CardContent className="p-12 text-center">
                    <div className="text-4xl mb-3">↩️</div>
                    <p className="text-gray-400 text-sm">No tienes solicitudes de reembolso</p>
                  </CardContent>
                </Card>
            ) : misReembolsos.map((r: any) => {
              const partido = partidos.find(p => {
                const ticket = myTickets.find(t => t.id === r.entradaId);
                return ticket && p.id === ticket.partidoId;
              });
              const statusInfo = REFUND_STATUS[r.estado as keyof typeof REFUND_STATUS]
                  || { label: r.estado, className: "bg-gray-100 text-gray-500" };
              const puedeCancel = r.estado === "PENDIENTE";
              return (
                  <Card key={r.id} className="border-0 shadow-md">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm">Reembolso #{r.id}</span>
                            <Badge className={`${statusInfo.className} border-0 text-xs`}>{statusInfo.label}</Badge>
                          </div>
                          {partido && (
                              <p className="text-sm text-gray-500">
                                {partido.homeFlag} {partido.homeTeam} vs {partido.awayTeam} {partido.awayFlag}
                              </p>
                          )}
                          <p className="text-xs text-gray-400">Entrada #{r.entradaId} · {r.motivo}</p>
                          <p className="text-xs text-gray-400 font-mono">Correlación: {r.correlationId}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-lg text-[#8B000F]">${r.monto} USD</p>
                          <p className="text-xs text-gray-400">
                            Solicitado: {r.fechaSolicitud
                              ? new Date(r.fechaSolicitud).toLocaleDateString('es-CO')
                              : '—'}
                          </p>
                          {r.fechaProcesamiento && (
                              <p className="text-xs text-gray-400">
                                Procesado: {new Date(r.fechaProcesamiento).toLocaleDateString('es-CO')}
                              </p>
                          )}
                        </div>
                      </div>
                      {r.evidencia && (
                          <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-500">
                            📋 {r.evidencia}
                          </div>
                      )}
                      {puedeCancel && (
                          <Button size="sm" variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={async () => {
                                    try {
                                      await cancelarReembolso(r.id, user?.usuarioId);
                                      const reembolsos = await getMisReembolsos(user?.usuarioId);
                                      const mis = await getMyTickets(user?.usuarioId);
                                      setMisReembolsos(reembolsos);
                                      setMyTickets(mis);
                                      toast.success('Reembolso cancelado. Tu entrada vuelve a estado PAGADA.');
                                    } catch (e: any) {
                                      toast.error(e.message);
                                    }
                                  }}>
                            Cancelar solicitud
                          </Button>
                      )}
                    </CardContent>
                  </Card>
              );
            })}

          </TabsContent>

        </Tabs>

        {/* ── DIALOG COMPRA ── */}
        <Dialog open={showBuyDialog} onOpenChange={(o) => { if (!o) { setShowBuyDialog(false); setReservation(null); setFactura(null); } }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {buyStep === 1 && '🎟️ Confirmar reserva'}
                {buyStep === 2 && '💳 Método de pago'}
                {buyStep === 3 && '✅ Confirmar compra'}
                {buyStep === 4 && '🎉 ¡Compra exitosa!'}
              </DialogTitle>
            </DialogHeader>

            {buyStep < 4 && (
                <div className="flex items-center justify-center gap-2 my-2">
                  {[1, 2, 3].map(step => (
                      <div key={step} className="flex items-center">
                        <div className={`size-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${buyStep >= step ? 'bg-[#8B000F] text-white' : 'bg-gray-100 text-gray-400'}`}>
                          {buyStep > step ? <Check className="size-4" /> : step}
                        </div>
                        {step < 3 && <div className={`w-10 h-1 ${buyStep > step ? 'bg-[#8B000F]' : 'bg-gray-100'}`} />}
                      </div>
                  ))}
                </div>
            )}

            {reservation && buyStep > 1 && buyStep < 4 && (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <span className="text-xs text-amber-700">Reserva expira en:</span>
                  <ReservationTimer
                      expiresAt={reservation.expiresAt}
                      onExpire={() => { setShowBuyDialog(false); setReservation(null); toast.error('⏰ Reserva expirada. Inténtalo de nuevo.'); }}
                  />
                </div>
            )}

            <div className="space-y-4 mt-2">
              {buyStep === 1 && selectedTicketType && (
                  <>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="font-semibold">{selectedTicketType.match}</p>
                      <p className="text-sm text-gray-500">{selectedTicketType.categoria} — ${selectedTicketType.precio} USD</p>
                      {selectedTicketType.estadioNombre && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <MapPin className="size-3" /> {selectedTicketType.estadioNombre}, {selectedTicketType.ciudad}
                          </p>
                      )}
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                      Se reservará 1 entrada. Tienes {TICKET_LIMITS.reservationTTLSeconds / 60} minutos para completar el pago.
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
                      <div className="flex justify-between font-black text-base">
                        <span>Total</span>
                        <span className="text-[#8B000F]">${selectedTicketType.precio} USD</span>
                      </div>
                    </div>
                  </>
              )}

              {buyStep === 2 && (
                  <>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                      <div className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-[#8B000F] bg-red-50' : 'border-gray-200'}`}
                           onClick={() => setPaymentMethod('card')}>
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="cursor-pointer flex-1">
                          <div className="font-semibold">💳 Tarjeta de Crédito / Débito</div>
                          <div className="text-xs text-gray-400">Visa, Mastercard, Amex</div>
                        </Label>
                      </div>
                      <div className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === 'pse' ? 'border-[#8B000F] bg-red-50' : 'border-gray-200'}`}
                           onClick={() => setPaymentMethod('pse')}>
                        <RadioGroupItem value="pse" id="pse" />
                        <Label htmlFor="pse" className="cursor-pointer flex-1">
                          <div className="font-semibold">🏦 PSE — Débito bancario</div>
                          <div className="text-xs text-gray-400">Bancolombia, Davivienda, BBVA y más</div>
                        </Label>
                      </div>
                    </RadioGroup>

                    {paymentMethod === 'card' && (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs mb-1 block">Número de tarjeta</Label>
                            <Input placeholder="1234 5678 9012 3456" value={cardNumber}
                                   onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))} />
                            <p className="text-xs text-gray-400 mt-1">Inicia con 0000 para simular rechazo</p>
                          </div>
                          <div>
                            <Label className="text-xs mb-1 block">Nombre en la tarjeta</Label>
                            <Input placeholder="Juan Pérez" value={cardName} onChange={e => setCardName(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs mb-1 block">Expiración</Label>
                              <Input placeholder="MM/AA" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} />
                            </div>
                            <div>
                              <Label className="text-xs mb-1 block">CVV</Label>
                              <Input type="password" placeholder="•••" value={cardCvv} onChange={e => setCardCvv(e.target.value.slice(0, 4))} />
                            </div>
                          </div>
                        </div>
                    )}

                    {paymentMethod === 'pse' && (
                        <div>
                          <Label className="text-xs mb-1 block">Selecciona tu banco</Label>
                          <Select value={bankPse} onValueChange={setBankPse}>
                            <SelectTrigger><SelectValue placeholder="Banco..." /></SelectTrigger>
                            <SelectContent>
                              {PSE_BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                    )}
                  </>
              )}

              {buyStep === 3 && selectedTicketType && (
                  <>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span>Partido</span><span className="font-semibold text-right">{selectedTicketType.match}</span></div>
                      <div className="flex justify-between"><span>Categoría</span><span className="font-semibold">{selectedTicketType.categoria}</span></div>
                      <div className="flex justify-between"><span>Estadio</span><span className="font-semibold">{selectedTicketType.estadioNombre}</span></div>
                      <div className="flex justify-between"><span>Método de pago</span><span className="font-semibold">{paymentMethod === 'card' ? '💳 Tarjeta' : `🏦 PSE - ${bankPse}`}</span></div>
                      <Separator />
                      <div className="flex justify-between"><span>Precio</span><span>${selectedTicketType.precio}</span></div>
                      <div className="flex justify-between text-gray-400"><span>Cargo de servicio (10%)</span><span>${serviceFee.toFixed(2)}</span></div>
                      <Separator />
                      <div className="flex justify-between font-black text-base"><span>Total</span><span className="text-[#8B000F]">${finalTotal.toFixed(2)} USD</span></div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                      <Shield className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-green-700">
                        Compra segura en modo simulado. ID de correlación: <span className="font-mono">{reservation?.correlationId}</span>
                      </p>
                    </div>
                  </>
              )}

              {buyStep === 4 && (
                  <div className="space-y-4 py-2">
                    <div className="text-center">
                      <div className="text-5xl mb-2">🎉</div>
                      <h3 className="font-black text-xl">¡Entrada confirmada!</h3>
                      <p className="text-gray-500 text-sm mt-1">Tu compra fue procesada exitosamente</p>
                    </div>

                    {factura && (
                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                            <span className="font-bold text-sm">🧾 Factura</span>
                            <span className="font-mono text-xs text-gray-500">{factura.numeroFactura}</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Partido</span>
                              <span className="font-medium text-right max-w-[60%]">{selectedTicketType?.match}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Categoría</span>
                              <span className="font-medium">{selectedTicketType?.categoria}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Estadio</span>
                              <span className="font-medium">{selectedTicketType?.estadioNombre}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Fecha emisión</span>
                              <span className="font-medium">
                                                    {factura.fechaEmision
                                                        ? new Date(factura.fechaEmision).toLocaleString('es-CO')
                                                        : new Date().toLocaleString('es-CO')}
                                                </span>
                            </div>
                          </div>
                          <Separator />
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Subtotal</span>
                              <span>${factura.subtotal} USD</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                              <span>Cargo de servicio (10%)</span>
                              <span>${(factura.total - factura.subtotal).toFixed(2)} USD</span>
                            </div>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-black text-base">
                            <span>Total pagado</span>
                            <span className="text-[#8B000F]">${factura.total} USD</span>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2 text-xs text-green-700 flex items-center gap-1">
                            <Check className="size-3 flex-shrink-0" />
                            Estado: {factura.estado} · Correlación: {reservation?.correlationId}
                          </div>
                        </div>
                    )}

                    <Button className="bg-[#8B000F] hover:bg-[#6B0008] text-white w-full" onClick={() => setShowBuyDialog(false)}>
                      Ver mis entradas
                    </Button>
                  </div>
              )}

              {buyStep < 4 && (
                  <div className="flex gap-2 pt-2">
                    {buyStep > 1 && (
                        <Button variant="outline" className="flex-1" onClick={() => setBuyStep(s => s - 1)} disabled={buying}>
                          Atrás
                        </Button>
                    )}
                    <Button className="flex-1 bg-[#8B000F] hover:bg-[#6B0008] text-white" onClick={handleNextStep} disabled={buying}>
                      {buying ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                      {buyStep === 3 ? 'Confirmar y pagar' : 'Continuar'} <ArrowRight className="size-4 ml-1" />
                    </Button>
                  </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── DIALOG TRANSFERENCIA ── */}
        <Dialog open={showTransferDialog} onOpenChange={(o) => {
          if (!o) { setShowTransferDialog(false); setTransferRecipient(''); setTransferRecipientUser(null); }
        }}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>↗️ Transferir entrada</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">

              {/* Info entrada */}
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <p className="font-semibold">
                  {(() => {
                    const ticket = myTickets.find(t => t.id === transferTarget?.id);
                    const p = partidos.find(x => x.id === ticket?.partidoId);
                    return p ? `${p.homeFlag} ${p.homeTeam} vs ${p.awayTeam} ${p.awayFlag}` : `Entrada #${transferTarget?.id}`;
                  })()}
                </p>
                <p className="text-gray-500 text-xs">{transferTarget?.categoria} · {transferTarget?.ubicacionSilla}</p>
              </div>

              {/* Buscador de usuario */}
              <div className="space-y-2">
                <Label className="text-xs">Nombre de usuario del destinatario</Label>
                <div className="flex gap-2">
                  <Input
                      placeholder="Ej: juanperez"
                      value={transferRecipient}
                      onChange={e => { setTransferRecipient(e.target.value); setTransferRecipientUser(null); }}
                      onKeyDown={e => e.key === 'Enter' && handleBuscarUsuario()}
                  />
                  <Button variant="outline" onClick={handleBuscarUsuario} disabled={searchingUser} className="flex-shrink-0">
                    {searchingUser ? <Loader2 className="size-4 animate-spin" /> : 'Buscar'}
                  </Button>
                </div>
              </div>

              {/* Usuario encontrado */}
              {transferRecipientUser && (
                  <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                    <div className="size-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                      {transferRecipientUser.nombreUsuario?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-green-800">@{transferRecipientUser.nombreUsuario}</p>
                      <p className="text-xs text-green-600">{transferRecipientUser.correo}</p>
                    </div>
                    <Check className="size-4 text-green-600 flex-shrink-0" />
                  </div>
              )}

              {/* Advertencia */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                ⚠️ Esta acción es permanente y queda registrada. Máximo {TICKET_LIMITS.maxTransfersPerDay} transferencias por día.
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowTransferDialog(false)}>Cancelar</Button>
                <Button
                    className="flex-1 bg-[#8B000F] hover:bg-[#6B0008] text-white"
                    onClick={handleTransfer}
                    disabled={transferring || !transferRecipientUser}
                >
                  {transferring ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                  Confirmar transferencia
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── DIALOG REEMBOLSO ── */}
        <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>↩️ Solicitar reembolso</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <p className="font-semibold">
                  {(() => { const p = partidos.find(x => Number(x.id) === Number(refundTarget?.partidoId)); return p ? `${p.homeFlag} ${p.homeTeam} vs ${p.awayTeam} ${p.awayFlag}` : `Entrada #${refundTarget?.id}`; })()}
                </p>
                <p className="text-gray-500">{refundTarget?.categoria} · ${refundTarget?.precioSimulado} USD</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                ⚠️ Los reembolsos aplican dentro de las {TICKET_LIMITS.refundWindowHours}h posteriores a la compra y se procesan en 5 días hábiles.
              </div>
              <div>
                <Label className="text-xs mb-1 block">Motivo del reembolso</Label>
                <Input placeholder="No puedo asistir al partido..." value={refundReason} onChange={e => setRefundReason(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowRefundDialog(false)}>Cancelar</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleRefund} disabled={refunding}>
                  {refunding ? <Loader2 className="size-4 animate-spin mr-2" /> : null} Solicitar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── DIALOG QR ── */}
        <Dialog open={!!qrTicket} onOpenChange={() => setQrTicket(null)}>
          <DialogContent className="max-w-xs text-center">
            <DialogHeader><DialogTitle>Código QR — {(() => { const p = partidos.find(x => Number(x.id) === Number(qrTicket?.partidoId)); return p ? `${p.homeTeam} vs ${p.awayTeam}` : `Entrada #${qrTicket?.id}`; })()}</DialogTitle></DialogHeader>
            <div className="flex justify-center my-4">
              {qrTicket?.codigoEntrada && <QRVisual code={qrTicket.codigoEntrada} />}
            </div>
            {qrTicket?.ubicacionSilla && <p className="text-xs text-gray-400">{qrTicket.ubicacionSilla}</p>}
            <p className="text-xs text-gray-300 font-mono mt-1">{qrTicket?.codigoEntrada}</p>
          </DialogContent>
        </Dialog>
      </div>
  );
}