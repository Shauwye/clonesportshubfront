const API_URL = "http://localhost:8081";

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export const TRADE_LIMITS = {
    maxTradesPerDay: 10,
    maxOffersActive: 5,
};

function pickRareza() {
    const roll = Math.random() * 100;
    if (roll < 60) return "COMUN";
    if (roll < 90) return "RARA";
    return "EPICA";
}

// ── CATÁLOGO ──────────────────────────────────────────────────
export async function getLaminasCatalog() {
    try {
        const res = await fetch(`${API_URL}/lamina/getall`, { headers: getAuthHeaders() });
        if (res.status === 202) return await res.json();
        return [];
    } catch { return []; }
}

// ── ÁLBUM ─────────────────────────────────────────────────────
export async function getOrCreateAlbum(usuarioId) {
    // Buscar álbum existente
    try {
        const res = await fetch(`${API_URL}/album/getbyusuarioid/${usuarioId}`, {
            headers: getAuthHeaders(),
        });
        if (res.status === 202) return await res.json();
    } catch {}

    // Crear álbum si no existe
    const res = await fetch(`${API_URL}/album/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            usuarioId,
            nombre: "Álbum Mundial 2026",
            porcentajeCompletitud: 0.0,
            fechaCreacion: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString(),
            estado: "ACTIVO",
        }),
    });
    if (!res.ok) throw new Error("No se pudo crear el álbum");

    // Buscar de nuevo
    const res2 = await fetch(`${API_URL}/album/getbyusuarioid/${usuarioId}`, {
        headers: getAuthHeaders(),
    });
    if (res2.status === 202) return await res2.json();
    return null;
}

async function actualizarPorcentajeAlbum(albumId, usuarioId, totalLaminas) {
    const inventario = await getInventario(usuarioId);
    const unicas = new Set(inventario.map(i => i.laminaId)).size;
    const porcentaje = totalLaminas > 0 ? (unicas / totalLaminas) * 100 : 0;

    await fetch(`${API_URL}/album/update/${albumId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            usuarioId,
            nombre: "Álbum Mundial 2026",
            porcentajeCompletitud: Math.round(porcentaje * 100) / 100,
            fechaActualizacion: new Date().toISOString(),
            estado: "ACTIVO",
        }),
    });
}

// ── INVENTARIO ────────────────────────────────────────────────
export async function getInventario(usuarioId) {
    try {
        const res = await fetch(`${API_URL}/inventariousuario/getbyusuarioid/${usuarioId}`, {
            headers: getAuthHeaders(),
        });
        if (res.status === 202) return await res.json();
        return [];
    } catch { return []; }
}

// Agrega láminas al inventario — crea o incrementa cantidad
async function agregarLaminaInventario(usuarioId, laminaId) {
    // Verificar si ya la tiene
    try {
        const res = await fetch(
            `${API_URL}/inventariousuario/getbyusuarioidandlaminaid/${usuarioId}/${laminaId}`,
            { headers: getAuthHeaders() }
        );
        if (res.status === 202) {
            const existente = await res.json();
            const nuevaCantidad = (existente.cantidad || 1) + 1;
            await fetch(`${API_URL}/inventariousuario/update/${existente.id}`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...existente,
                    cantidad: nuevaCantidad,
                    esRepetida: nuevaCantidad > 1,
                    ultimoMovimiento: new Date().toISOString(),
                }),
            });
            return { ...existente, cantidad: nuevaCantidad };
        }
    } catch {}

    // No la tiene — crear
    await fetch(`${API_URL}/inventariousuario/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            usuarioId,
            laminaId,
            cantidad: 1,
            esRepetida: false,
            fechaObtencion: new Date().toISOString(),
            ultimoMovimiento: new Date().toISOString(),
        }),
    });
    return { laminaId, cantidad: 1 };
}

// ── PAQUETES ──────────────────────────────────────────────────
export async function getPaquetesPendientes(usuarioId) {
    try {
        const res = await fetch(`${API_URL}/paquetelaminas/pendientes/${usuarioId}`, {
            headers: getAuthHeaders(),
        });
        if (res.status === 202) return await res.json();
        return [];
    } catch { return []; }
}

export async function claimDailyPack(usuarioId) {
    const key = `dailyPack_${usuarioId}`;
    const last = localStorage.getItem(key);
    const now = new Date();
    if (last) {
        const diffHours = (now - new Date(last)) / (1000 * 60 * 60);
        if (diffHours < 24) throw new Error(`Vuelve en ${Math.ceil(24 - diffHours)}h`);
    }
    const res = await fetch(`${API_URL}/paquetelaminas/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            usuarioId,
            nombre: "Sobre Diario",
            tipoOrigen: "DIARIO",
            cantidadLaminas: 5,
            costoPuntos: 0,
            estado: "DISPONIBLE",
            fechaObtencion: new Date().toISOString(),
            abierto: false,
        }),
    });
    if (!res.ok) throw new Error("Error al crear sobre diario");
    localStorage.setItem(key, now.toISOString());
    return { claimed: true };
}

const CODIGOS_VALIDOS = ["MUNDIAL2026", "COLOMBIA26", "FIFAWC26", "LANZAMIENTO", "PROMO100"];

export async function redeemPromoCode(usuarioId, code) {
    const usedKey = `usedCodes_${usuarioId}`;
    const used = JSON.parse(localStorage.getItem(usedKey) || "[]");
    if (!CODIGOS_VALIDOS.includes(code)) throw new Error("Código inválido");
    if (used.includes(code)) throw new Error("Ya usaste este código");
    const packs = code === "PROMO100" ? 3 : 1;
    for (let i = 0; i < packs; i++) {
        await fetch(`${API_URL}/paquetelaminas/create`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                usuarioId,
                nombre: `Sobre Promocional — ${code}`,
                tipoOrigen: "CODIGO_PROMO",
                cantidadLaminas: 5,
                costoPuntos: 0,
                codigoPromocional: code,
                estado: "DISPONIBLE",
                fechaObtencion: new Date().toISOString(),
                abierto: false,
            }),
        });
    }
    localStorage.setItem(usedKey, JSON.stringify([...used, code]));
    return { packs };
}

// ── ABRIR SOBRE — guarda en BD ────────────────────────────────
export async function openPack(paqueteId, usuarioId, albumId, todasLasLaminas) {
    // 1. Marcar paquete como abierto
    const paqRes = await fetch(`${API_URL}/paquetelaminas/getbyid/${paqueteId}`, {
        headers: getAuthHeaders(),
    });
    if (!paqRes.ok) throw new Error("Paquete no encontrado");
    const paquete = await paqRes.json();

    await fetch(`${API_URL}/paquetelaminas/update/${paqueteId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            ...paquete,
            abierto: true,
            fechaApertura: new Date().toISOString(),
            estado: "ABIERTO",
        }),
    });

    // 2. Seleccionar 5 láminas al azar por rareza
    const porRareza = {
        COMUN: todasLasLaminas.filter(l => l.rareza === "COMUN"),
        RARA:  todasLasLaminas.filter(l => l.rareza === "RARA"),
        EPICA: todasLasLaminas.filter(l => l.rareza === "EPICA"),
    };

    const resultado = [];
    for (let i = 0; i < 5; i++) {
        let rareza = pickRareza();
        let pool = porRareza[rareza];
        if (!pool || pool.length === 0) pool = porRareza["COMUN"];
        resultado.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    // 3. Guardar cada lámina en InventarioUsuario
    for (const lamina of resultado) {
        await agregarLaminaInventario(usuarioId, lamina.id);
    }

    // 4. Actualizar porcentaje del álbum
    await actualizarPorcentajeAlbum(albumId, usuarioId, todasLasLaminas.length);

    return resultado;
}

// ── COLECCIÓN desde BD ────────────────────────────────────────
// Combina inventario (BD) con catálogo de láminas para tener datos completos
export async function getColeccionCompleta(usuarioId, todasLasLaminas) {
    const inventario = await getInventario(usuarioId);
    return inventario.map(inv => {
        const lamina = todasLasLaminas.find(l => String(l.id) === String(inv.laminaId));
        if (!lamina) return null;
        return {
            ...lamina,
            inventarioId: inv.id,
            cantidad: inv.cantidad || 1,
            esRepetida: inv.esRepetida || false,
            pegada: inv.pegada || false,
        };
    }).filter(Boolean);
}

// ── PEGAR LÁMINA en álbum ─────────────────────────────────────
export async function pegarLamina(inventarioId, laminaId, usuarioId) {
    // Actualizar el registro de inventario marcando como pegada
    const res = await fetch(`${API_URL}/inventariousuario/getbyid/${inventarioId}`, {
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("No se encontró la lámina en el inventario");
    const inv = await res.json();

    await fetch(`${API_URL}/inventariousuario/update/${inventarioId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            ...inv,
            pegada: true,
            ultimoMovimiento: new Date().toISOString(),
        }),
    });
}

// ── INTERCAMBIOS (localStorage hasta implementar en BD) ────────
export function getIntercambiosLocales(usuarioId) {
    return JSON.parse(localStorage.getItem(`intercambios_${usuarioId}`) || "[]");
}

export function crearIntercambioLocal(usuarioId, laminaOfrecida, laminaBuscada) {
    const key = `intercambios_${usuarioId}`;
    const intercambios = JSON.parse(localStorage.getItem(key) || "[]");
    if (intercambios.length >= TRADE_LIMITS.maxOffersActive)
        throw new Error(`Límite de ${TRADE_LIMITS.maxOffersActive} ofertas activas`);
    const nueva = {
        id: `trade-${Date.now()}`, usuarioId, laminaOfrecida, laminaBuscada,
        estado: "PENDIENTE", fechaCreacion: new Date().toISOString(),
    };
    intercambios.push(nueva);
    localStorage.setItem(key, JSON.stringify(intercambios));
    return nueva;
}

export function cancelarIntercambioLocal(usuarioId, intercambioId) {
    const key = `intercambios_${usuarioId}`;
    const updated = getIntercambiosLocales(usuarioId).filter(i => i.id !== intercambioId);
    localStorage.setItem(key, JSON.stringify(updated));
}
export async function darSobrePorLogin(usuarioId) {
    const key = `loginPack_${usuarioId}_${new Date().toDateString()}`;
    if (localStorage.getItem(key)) return false; // Ya recibió hoy

    await fetch(`${API_URL}/paquetelaminas/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            usuarioId,
            nombre: "Sobre de Bienvenida Diaria",
            tipoOrigen: "LOGIN_DIARIO",
            cantidadLaminas: 5,
            costoPuntos: 0,
            estado: "DISPONIBLE",
            fechaObtencion: new Date().toISOString(),
            abierto: false,
        }),
    });

    localStorage.setItem(key, "true");
    return true;
}