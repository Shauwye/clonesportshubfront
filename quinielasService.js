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
    if (res.status === 204) return [];
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error de servidor" }));
        throw new Error(err.error || "Error de servidor");
    }
    return await res.json();
}

// ── Mis pollas (= mis grupos) ─────────────────────────────────────────────────
export async function getMyQuinielas(usuarioId) {
    if (!usuarioId) return [];
    return await fetchApi(`/polla/mis-pollas/${usuarioId}`);
}

// ── Crear polla ───────────────────────────────────────────────────────────────
export async function createQuiniela({ nombre, creadorId, descripcion, maxParticipantes }) {
    return await fetchApi("/polla/crear", {
        method: "POST",
        body: JSON.stringify({ nombre, creadorId, descripcion, maxParticipantes }),
    });
}

// ── Unirse con código ─────────────────────────────────────────────────────────
export async function joinQuiniela({ codigo, usuarioId }) {
    return await fetchApi("/polla/unirse", {
        method: "POST",
        body: JSON.stringify({ codigo, usuarioId }),
    });
}

// ── Ranking de una polla ──────────────────────────────────────────────────────
export async function getQuinielaRanking(pollaId) {
    if (!pollaId) return [];
    return await fetchApi(`/polla/${pollaId}/ranking`);
}

// ── Participantes de una polla ────────────────────────────────────────────────
export async function getParticipantes(pollaId) {
    if (!pollaId) return [];
    return await fetchApi(`/polla/${pollaId}/participantes`);
}

// ── Mis predicciones ──────────────────────────────────────────────────────────
export async function getMyPredictions(pollaId, usuarioId) {
    if (!pollaId || !usuarioId) return [];
    const list = await fetchApi(`/polla/${pollaId}/predicciones/${usuarioId}`);
    // Convertir a mapa {partidoId: {local, visitante}}
    const map = {};
    (Array.isArray(list) ? list : []).forEach(p => {
        map[p.partidoId] = {
            local: p.marcadorLocalPredicho,
            visitante: p.marcadorVisitantePredicho,
            bloqueada: p.bloqueada,
            puntaje: p.puntajeObtenido,
        };
    });
    return map;
}

// ── Guardar predicción ────────────────────────────────────────────────────────
export async function savePrediction({ pollaId, usuarioId, partidoId, marcadorLocal, marcadorVisitante }) {
    return await fetchApi(`/polla/${pollaId}/prediccion`, {
        method: "POST",
        body: JSON.stringify({ usuarioId, partidoId, marcadorLocal, marcadorVisitante }),
    });
}

// ── Stats del usuario ─────────────────────────────────────────────────────────
export async function getMyStats(usuarioId) {
    if (!usuarioId) return null;
    return await fetchApi(`/polla/stats/${usuarioId}`);
}