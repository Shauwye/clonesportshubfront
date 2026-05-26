const API_URL = "http://localhost:8081";

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export const TICKET_LIMITS = {
    maxPurchasesPerDay: 5,
    maxTransfersPerDay: 3,
    maxTicketsPerOrder: 6,
    reservationTTLSeconds: 600,
    refundWindowHours: 48,
};

export const TICKET_STATUS = {
    DISPONIBLE: "DISPONIBLE",
    RESERVADA: "RESERVADA",
    PAGADA: "PAGADA",
    TRANSFERIDA: "TRANSFERIDA",
    REEMBOLSO_PENDIENTE: "REEMBOLSO_PENDIENTE",
    EXPIRADA: "EXPIRADA",
};

export async function getMyTickets(usuarioId) {
    if (!usuarioId) return [];
    const res = await fetch(`${API_URL}/entrada/mis-entradas/${usuarioId}`, {
        headers: getAuthHeaders(),
    });
    if (res.status === 200 || res.status === 202) return await res.json();
    return [];
}

export async function getTicketStatus(entradaId) {
    const res = await fetch(`${API_URL}/entrada/estado/${entradaId}`, {
        headers: getAuthHeaders(),
    });
    if (res.ok || res.status === 202) return await res.json();
    throw new Error("No se pudo consultar el estado de la entrada");
}

export async function reserveTicket({ entradaId, usuarioId }) {
    const res = await fetch(`${API_URL}/entrada/reservar`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ entradaId, usuarioId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al reservar la entrada");
    return {
        reservaId: data.reservaId,
        entradaId: data.entradaId,
        expiresAt: data.expiracion,
        ttlSegundos: data.ttlSegundos,
        correlationId: data.correlationId,
        status: TICKET_STATUS.RESERVADA,
    };
}

export async function payReservation({ reservaId, usuarioId, metodoPago }) {
    const res = await fetch(`${API_URL}/entrada/pagar`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ reservaId, usuarioId, metodoPago: metodoPago || "TARJETA" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al procesar el pago");
    return {
        success: true,
        pagoId: data.pagoId,
        estado: data.estado,
        monto: data.monto,
        correlationId: data.correlationId,
        mensaje: data.mensaje,
        factura: data.factura || null,
    };
}

export async function transferTicket({ entradaId, usuarioOrigenId, usuarioDestinoId, motivo }) {
    if (!usuarioDestinoId) throw new Error("Ingresa el ID del usuario destino");
    const res = await fetch(`${API_URL}/entrada/transferir`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ entradaId, usuarioOrigenId, usuarioDestinoId, motivo }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al transferir la entrada");
    return {
        transferenciaId: data.transferenciaId,
        correlationId: data.correlationId,
        mensaje: data.mensaje,
    };
}

export async function requestRefund({ entradaId, usuarioId, motivo }) {
    const res = await fetch(`${API_URL}/entrada/reembolso`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ entradaId, usuarioId, motivo }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al solicitar el reembolso");
    return {
        reembolsoId: data.reembolsoId,
        estado: data.estado,
        monto: data.monto,
        correlationId: data.correlationId,
        estimatedDays: 5,
        mensaje: data.mensaje,
    };
}

export async function getUserDailyLimits() {
    return {
        maxPurchases: TICKET_LIMITS.maxPurchasesPerDay,
        maxTransfers: TICKET_LIMITS.maxTransfersPerDay,
    };
}

// ── Reembolsos ────────────────────────────────────────────────────────────────
export async function getMisReembolsos(usuarioId) {
    if (!usuarioId) return [];
    const res = await fetch(`${API_URL}/reembolso/mis-reembolsos/${usuarioId}`, {
        headers: getAuthHeaders(),
    });
    if (res.status === 204) return [];
    if (!res.ok) return [];
    return await res.json();
}

export async function cancelarReembolso(reembolsoId, usuarioId) {
    const res = await fetch(`${API_URL}/reembolso/cancelar/${reembolsoId}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ usuarioId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al cancelar el reembolso");
    return data;
}

export const REFUND_STATUS = {
    PENDIENTE:  { label: "⏳ Pendiente",   className: "bg-yellow-100 text-yellow-700" },
    PROCESANDO: { label: "🔄 Procesando",  className: "bg-blue-100 text-blue-700" },
    PROCESADO:  { label: "✅ Procesado",   className: "bg-green-100 text-green-700" },
    CANCELADO:  { label: "❌ Cancelado",   className: "bg-gray-100 text-gray-500" },
    VENCIDO:    { label: "⌛ Vencido",     className: "bg-red-100 text-red-600" },
};

export const TRANSFER_RULES = {
    maxPerDay: 3,
    allowedStates: ["PAGADA"],
};