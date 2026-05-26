const API_URL = "http://localhost:8081";

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

async function fetchApi(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        headers: getAuthHeaders(),
        ...options,
    });
    if (res.status === 204 || res.status === 204) return [];
    if (!res.ok) {
        const text = await res.text().catch(() => "Error de servidor");
        throw new Error(text || "Error de servidor");
    }
    const text = await res.text();
    try { return text ? JSON.parse(text) : null; }
    catch { return text; }
}

// ── CASOS DE SOPORTE ──────────────────────────────────────────
export async function getCasosSinAsignar() {
    return await fetchApi("/casosoporte/sin-asignar") || [];
}

export async function getCasosPorAgente(agenteId) {
    return await fetchApi(`/casosoporte/por-agente/${agenteId}`) || [];
}

export async function getCasosPorUsuario(usuarioId) {
    return await fetchApi(`/casosoporte/por-usuario/${usuarioId}`) || [];
}

export async function getCasosPorEstado(estado) {
    return await fetchApi(`/casosoporte/por-estado?estado=${estado}`) || [];
}

export async function getCasoById(id) {
    return await fetchApi(`/casosoporte/getbyid/${id}`);
}

export async function crearCaso(data) {
    return await fetchApi("/casosoporte/create", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function asignarCaso(id, agenteSoporteId) {
    return await fetchApi(`/casosoporte/${id}/asignar?agenteSoporteId=${agenteSoporteId}`, {
        method: "PATCH",
    });
}

export async function resolverCaso(id, resolucion) {
    return await fetchApi(`/casosoporte/${id}/resolver?resolucion=${encodeURIComponent(resolucion)}`, {
        method: "PATCH",
    });
}

export async function cerrarCaso(id, motivo = "") {
    return await fetchApi(`/casosoporte/${id}/cerrar?motivo=${encodeURIComponent(motivo)}`, {
        method: "PATCH",
    });
}

export async function escalarCaso(id) {
    return await fetchApi(`/casosoporte/${id}/escalar`, { method: "PATCH" });
}

export async function cambiarPrioridad(id, prioridad) {
    return await fetchApi(`/casosoporte/${id}/prioridad?prioridad=${prioridad}`, {
        method: "PATCH",
    });
}

export async function contarCasos(estado) {
    return await fetchApi(`/casosoporte/contar?estado=${estado}`);
}

// ── LOGS ──────────────────────────────────────────────────────
export async function getLogsRecientes() {
    return await fetchApi("/log/recientes") || [];
}

export async function getLogsPorUsuario(usuarioId) {
    return await fetchApi(`/log/por-usuario/${usuarioId}`) || [];
}

export async function getLogsPorNivel(nivel) {
    return await fetchApi(`/log/por-nivel?nivel=${nivel}`) || [];
}

export async function getLogsPorResultado(resultado) {
    return await fetchApi(`/log/por-resultado?resultado=${resultado}`) || [];
}

export async function getLogsPorTipo(tipoEvento) {
    return await fetchApi(`/log/por-tipo?tipoEvento=${encodeURIComponent(tipoEvento)}`) || [];
}

// ── TRANSACCIONES AUDITADAS ───────────────────────────────────
export async function getTransaccionesPorUsuario(usuarioId) {
    return await fetchApi(`/transaccionauditada/por-usuario/${usuarioId}`) || [];
}

export async function getAnomalias() {
    return await fetchApi("/transaccionauditada/anomalias") || [];
}

// ── INVESTIGACIONES ───────────────────────────────────────────
export async function getInvestigacionesPorAgente(agenteId) {
    return await fetchApi(`/investigacion/por-agente/${agenteId}`) || [];
}

export async function getInvestigacionesPorUsuario(usuarioId) {
    return await fetchApi(`/investigacion/por-usuario/${usuarioId}`) || [];
}

export async function getInvestigacionesPorCaso(casoId) {
    return await fetchApi(`/investigacion/por-caso/${casoId}`) || [];
}

export async function abrirInvestigacion(casoSoporteId, agenteId, motivo) {
    return await fetchApi(
        `/investigacion/abrir-desde-caso?casoSoporteId=${casoSoporteId}&agenteId=${agenteId}&motivo=${encodeURIComponent(motivo)}`,
        { method: "POST" }
    );
}

export async function agregarHallazgos(id, hallazgos) {
    return await fetchApi(
        `/investigacion/${id}/hallazgos?hallazgos=${encodeURIComponent(hallazgos)}`,
        { method: "PUT" }
    );
}

export async function cerrarInvestigacion(id, hallazgos, accionesTomadas) {
    return await fetchApi(
        `/investigacion/${id}/cerrar?hallazgos=${encodeURIComponent(hallazgos)}&accionesTomadas=${encodeURIComponent(accionesTomadas)}`,
        { method: "PUT" }
    );
}

// ── BUSCAR USUARIO ────────────────────────────────────────────
export async function buscarUsuarioPorUsername(username) {
    try {
        const res = await fetch(`${API_URL}/user/getbyusername/${username}`, {
            headers: getAuthHeaders(),
        });
        if (res.ok || res.status === 202) return await res.json();
        return null;
    } catch { return null; }
}



// ── ENTRADAS DEL USUARIO ──────────────────────────────────────
export async function getEntradasUsuario(usuarioId) {
    try {
        const res = await fetch(`${API_URL}/entrada/mis-entradas/${usuarioId}`, {
            headers: getAuthHeaders(),
        });
        if (res.status === 202) return await res.json();
        return [];
    } catch { return []; }
}

// ── RESERVAS DEL USUARIO ──────────────────────────────────────
export async function getReservasUsuario(usuarioId) {
    try {
        const res = await fetch(`${API_URL}/reserva/por-usuario/${usuarioId}`, {
            headers: getAuthHeaders(),
        });
        if (res.ok || res.status === 202) return await res.json();
        return [];
    } catch { return []; }
}




// ── INVENTARIO ÁLBUM DEL USUARIO ──────────────────────────────
export async function getInventarioUsuario(usuarioId) {
    try {
        const res = await fetch(`${API_URL}/inventariousuario/getbyusuarioid/${usuarioId}`, {
            headers: getAuthHeaders(),
        });
        if (res.status === 202) return await res.json();
        return [];
    } catch { return []; }
}

// ── INTERCAMBIOS DEL USUARIO ──────────────────────────────────
export async function getIntercambiosUsuario(usuarioId) {
    try {
        const res = await fetch(`${API_URL}/intercambio/getbyusuario/${usuarioId}`, {
            headers: getAuthHeaders(),
        });
        if (res.status === 202) return await res.json();
        return [];
    } catch { return []; }
}