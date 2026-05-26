const API_URL = "http://localhost:8081";

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

const PRECIO_POR_CATEGORIA = { VIP: 450, Preferente: 220, General: 95 };
const STOCK_POR_CATEGORIA  = { VIP: 20,  Preferente: 60,  General: 200 };
const CATEGORIAS = ["VIP", "Preferente", "General"];

const teamEmojiFlags = {
    'México': '🇲🇽', 'Corea': '🇰🇷', 'Sudáfrica': '🇿🇦', 'Chequia': '🇨🇿',
    'Canadá': '🇨🇦', 'Suiza': '🇨🇭', 'Catar': '🇶🇦', 'Bosnia': '🇧🇦',
    'Brasil': '🇧🇷', 'Marruecos': '🇲🇦', 'Escocia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Haití': '🇭🇹',
    'USA': '🇺🇸', 'Australia': '🇦🇺', 'Paraguay': '🇵🇾', 'Turquía': '🇹🇷',
    'Alemania': '🇩🇪', 'Ecuador': '🇪🇨', 'Costa de Marfil': '🇨🇮', 'Curazao': '🇨🇼',
    'Holanda': '🇳🇱', 'Japón': '🇯🇵', 'Túnez': '🇹🇳', 'Suecia': '🇸🇪',
    'Bélgica': '🇧🇪', 'Irán': '🇮🇷', 'Egipto': '🇪🇬', 'Nueva Zelanda': '🇳🇿',
    'España': '🇪🇸', 'Uruguay': '🇺🇾', 'Cabo Verde': '🇨🇻', 'Arabia Saudita': '🇸🇦',
    'Francia': '🇫🇷', 'Senegal': '🇸🇳', 'Noruega': '🇳🇴', 'Irak': '🇮🇶',
    'Argentina': '🇦🇷', 'Argelia': '🇩🇿', 'Austria': '🇦🇹', 'Jordania': '🇯🇴',
    'Portugal': '🇵🇹', 'Colombia': '🇨🇴', 'Uzbekistán': '🇺🇿', 'Congo': '🇨🇬',
    'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croacia': '🇭🇷', 'Panamá': '🇵🇦', 'Ghana': '🇬🇭',
};

// Spring serializa LocalDateTime como array [year, month, day, hour, min, sec, nano]
// Esta función lo convierte a Date correctamente
function parseFechaSpring(valor) {
    if (!valor) return null;

    // Si ya es string ISO ("2026-06-11T19:00:00") lo parsea directo
    if (typeof valor === "string") {
        const d = new Date(valor);
        return isNaN(d.getTime()) ? null : d;
    }

    // Si es array [2026, 6, 11, 19, 0, 0, 0]
    if (Array.isArray(valor) && valor.length >= 5) {
        const [year, month, day, hour, min] = valor;
        // month en Java es 1-based, en JS Date es 0-based
        return new Date(year, month - 1, day, hour, min);
    }

    return null;
}

async function fetchAll(path) {
    const res = await fetch(`${API_URL}${path}`, { headers: getAuthHeaders() });
    // Spring devuelve 202 ACCEPTED para listas, 204 NO_CONTENT si está vacío
    if (res.status === 204) return [];
    if (!res.ok) throw new Error(`Error ${res.status} cargando ${path}`);
    return await res.json();
}

export async function getPartidosConInfo() {
    const [partidos, equipos, estadios] = await Promise.all([
        fetchAll("/partido/getall"),
        fetchAll("/equipo/getall"),
        fetchAll("/estadio/getall"),
    ]);

    const equipoMap = {};
    equipos.forEach(e => { equipoMap[e.id] = e; });

    const estadioMap = {};
    estadios.forEach(e => { estadioMap[e.id] = e; });

    return partidos.map(p => {
        const local     = equipoMap[p.equipoLocalId];
        const visitante = equipoMap[p.equipoVisitanteId];
        const estadio   = estadioMap[p.estadioId];

        const fechaHora = parseFechaSpring(p.fechaHoraInicio);

        return {
            id: p.id,
            equipoLocalId: p.equipoLocalId,
            equipoVisitanteId: p.equipoVisitanteId,
            estadioId: p.estadioId,
            fase: p.fase,
            estado: p.estado || "programado",
            marcadorLocal: p.marcadorLocal,
            marcadorVisitante: p.marcadorVisitante,
            fechaHoraInicio: p.fechaHoraInicio,
            fecha: fechaHora ? fechaHora.toISOString().split("T")[0] : null,
            hora: fechaHora
                ? fechaHora.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false })
                : null,
            homeTeam: local?.nombre || "Equipo Local",
            awayTeam: visitante?.nombre || "Equipo Visitante",
            homeFlag: local ? (teamEmojiFlags[local.nombre] || "🏳️") : "🏳️",
            awayFlag: visitante ? (teamEmojiFlags[visitante.nombre] || "🏳️") : "🏳️",
            homeBanderaUrl: local?.banderaUrl || null,
            awayBanderaUrl: visitante?.banderaUrl || null,
            grupo: local?.grupo || null,
            estadioNombre: estadio?.nombre || "Estadio",
            ciudad: estadio?.ciudad || "",
            pais: estadio?.pais || "",
            capacidad: estadio?.capacidad || 0,
            zonaHoraria: estadio?.zonaHoraria || "UTC",
            label: `${local?.nombre || "Local"} vs ${visitante?.nombre || "Visitante"}`,
        };
    });
}

async function getEntradasPorPartidoYCategoria(partidoId, categoria) {
    const res = await fetch(
        `${API_URL}/entrada/disponibles/${partidoId}?categoria=${categoria}`,
        { headers: getAuthHeaders() }
    );
    if (res.status === 204 || res.status === 404) return [];
    if (!res.ok) return [];
    return await res.json();
}

async function generarEntradasEnBack(partido, categoria) {
    // Usa el endpoint de generación en lote — 1 request en vez de 280
    await fetch(`${API_URL}/entrada/generar/${partido.id}`, {
        method: "POST",
        headers: getAuthHeaders(),
    });
}

export async function getTicketTypesParaPartido(partido) {
    const result = [];

    // Primero verificar si ya hay entradas para cualquier categoría
    const primeraCategoria = await getEntradasPorPartidoYCategoria(partido.id, "General");

    // Si no hay entradas para ninguna categoría, generar todo en 1 request
    if (primeraCategoria.length === 0) {
        await generarEntradasEnBack(partido, null);
    }

    // Consultar disponibilidad por categoría
    for (const categoria of CATEGORIAS) {
        const entradas = await getEntradasPorPartidoYCategoria(partido.id, categoria);

        result.push({
            partidoId: partido.id,
            categoria,
            precio: PRECIO_POR_CATEGORIA[categoria],
            disponibles: entradas.length,
            entradasIds: entradas.map(e => e.id),
            match: partido.label,
            homeTeam: partido.homeTeam,
            awayTeam: partido.awayTeam,
            homeFlag: partido.homeFlag,
            awayFlag: partido.awayFlag,
            fecha: partido.fecha,
            hora: partido.hora,
            estadioNombre: partido.estadioNombre,
            ciudad: partido.ciudad,
        });
    }

    return result;
}