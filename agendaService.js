const API_URL = "http://localhost:8081";

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

// Banderas emoji por equipo (para los que no tienen imagen)
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

// Estadios y ciudades sede reales Mundial 2026
const venues = [
    { stadium: 'Estadio Azteca',    city: 'Ciudad de México' },
    { stadium: 'Estadio BBVA',      city: 'Monterrey' },
    { stadium: 'AT&T Stadium',      city: 'Dallas' },
    { stadium: 'SoFi Stadium',      city: 'Los Ángeles' },
    { stadium: 'MetLife Stadium',   city: 'Nueva York' },
    { stadium: 'BC Place',          city: 'Vancouver' },
    { stadium: 'Arrowhead Stadium', city: 'Kansas City' },
];

// Genera los 6 partidos de cada grupo (round-robin)
function generateGroupMatches(group, teams, startDate, startId) {
    const pairs = [];
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            pairs.push([teams[i], teams[j]]);
        }
    }
    return pairs.map((pair, index) => {
        const venueIndex = (startId + index) % venues.length;
        const venue = venues[venueIndex];
        const date = new Date(startDate);
        date.setDate(date.getDate() + Math.floor(index / 2));
        const dateStr = date.toISOString().split('T')[0];
        const times = ['12:00', '15:00', '18:00', '21:00'];
        const time = times[(startId + index) % times.length];

        return {
            id: `m${startId + index}`,
            homeTeam: pair[0],
            awayTeam: pair[1],
            homeFlag: teamEmojiFlags[pair[0]] || '🏳️',
            awayFlag: teamEmojiFlags[pair[1]] || '🏳️',
            date: dateStr,
            time,
            stadium: venue.stadium,
            city: venue.city,
            group,
            status: 'upcoming',
        };
    });
}

// 48 partidos reales fase de grupos Mundial 2026
const worldCupGroups = [
    { group: 'A', teams: ['México', 'Corea', 'Sudáfrica', 'Chequia'],           startDate: '2026-06-11' },
    { group: 'B', teams: ['Canadá', 'Suiza', 'Catar', 'Bosnia'],                startDate: '2026-06-12' },
    { group: 'C', teams: ['Brasil', 'Marruecos', 'Escocia', 'Haití'],           startDate: '2026-06-13' },
    { group: 'D', teams: ['USA', 'Australia', 'Paraguay', 'Turquía'],           startDate: '2026-06-14' },
    { group: 'E', teams: ['Alemania', 'Ecuador', 'Costa de Marfil', 'Curazao'], startDate: '2026-06-14' },
    { group: 'F', teams: ['Holanda', 'Japón', 'Túnez', 'Suecia'],               startDate: '2026-06-15' },
    { group: 'G', teams: ['Bélgica', 'Irán', 'Egipto', 'Nueva Zelanda'],        startDate: '2026-06-15' },
    { group: 'H', teams: ['España', 'Uruguay', 'Cabo Verde', 'Arabia Saudita'], startDate: '2026-06-16' },
    { group: 'I', teams: ['Francia', 'Senegal', 'Noruega', 'Irak'],             startDate: '2026-06-16' },
    { group: 'J', teams: ['Argentina', 'Argelia', 'Austria', 'Jordania'],       startDate: '2026-06-17' },
    { group: 'K', teams: ['Portugal', 'Colombia', 'Uzbekistán', 'Congo'],       startDate: '2026-06-17' },
    { group: 'L', teams: ['Inglaterra', 'Croacia', 'Panamá', 'Ghana'],          startDate: '2026-06-18' },
];

let matchId = 1;
export const matches = worldCupGroups.flatMap(({ group, teams, startDate }) => {
    const groupMatches = generateGroupMatches(group, teams, startDate, matchId);
    matchId += groupMatches.length;
    return groupMatches;
});

// --- ESTADIOS ---
export const STADIUM_COORDS = {
    'MetLife Stadium':    { lat: 40.8135, lon: -74.0744, city: 'Nueva York',       country: 'USA',    capacity: 82500 },
    'Estadio Azteca':     { lat: 19.3029, lon: -99.1505, city: 'Ciudad de México', country: 'México', capacity: 87523 },
    'AT&T Stadium':       { lat: 32.7480, lon: -97.0930, city: 'Dallas',           country: 'USA',    capacity: 80000 },
    'SoFi Stadium':       { lat: 33.9535, lon: -118.3392, city: 'Los Ángeles',     country: 'USA',    capacity: 70240 },
    'BC Place':           { lat: 49.2767, lon: -123.1116, city: 'Vancouver',       country: 'Canadá', capacity: 54500 },
    'Estadio BBVA':       { lat: 25.6694, lon: -100.2438, city: 'Monterrey',       country: 'México', capacity: 53500 },
    'Arrowhead Stadium':  { lat: 39.0489, lon: -94.4839,  city: 'Kansas City',     country: 'USA',    capacity: 76416 },
};

export const CITY_TIMEZONES = {
    'Nueva York':        'America/New_York',
    'Ciudad de México':  'America/Mexico_City',
    'Dallas':            'America/Chicago',
    'Los Ángeles':       'America/Los_Angeles',
    'Vancouver':         'America/Vancouver',
    'Monterrey':         'America/Monterrey',
    'Kansas City':       'America/Chicago',
};

export const USER_TIMEZONE = 'America/Bogota';

// --- AGENDA PERSONAL EN BD ---
export async function guardarAgendaPersonal({ usuarioId, favoriteTeam, pais }) {
    const ciudadPorPais = {
        "Colombia": "Bogotá", "México": "Ciudad de México",
        "Argentina": "Buenos Aires", "Brasil": "São Paulo",
        "USA": "Nueva York", "Canadá": "Vancouver",
    };

    const partidosFavorito = matches
        .filter(m => m.homeTeam === favoriteTeam || m.awayTeam === favoriteTeam)
        .map(m => m.city);
    const ciudadesEquipo = [...new Set(partidosFavorito)].join(",");

    const agendaData = {
        usuarioId,
        nombre: `Agenda de ${favoriteTeam || "Mundial 2026"}`,
        fechaGeneracion: new Date().toISOString(),
        ultimaActualizacion: new Date().toISOString(),
        filtroEquipos: favoriteTeam || "",
        filtroCiudades: ciudadesEquipo || ciudadPorPais[pais] || "",
        filtroEstadios: "",
        soloFavoritos: false,
    };

    const headers = getAuthHeaders();

    try {
        const existsRes = await fetch(
            `${API_URL}/agendapersonal/getbyusuarioid/${usuarioId}`,
            { headers }
        );
        if (existsRes.status === 202) {
            const existing = await existsRes.json();
            await fetch(`${API_URL}/agendapersonal/update/${existing.id}`, {
                method: "PUT", headers,
                body: JSON.stringify(agendaData),
            });
        } else {
            await fetch(`${API_URL}/agendapersonal/create`, {
                method: "POST", headers,
                body: JSON.stringify(agendaData),
            });
        }
    } catch (error) {
        console.error("Error guardando agenda:", error);
    }
}

export async function getAgendaPersonal(usuarioId) {
    try {
        const res = await fetch(
            `${API_URL}/agendapersonal/getbyusuarioid/${usuarioId}`,
            { headers: getAuthHeaders() }
        );
        if (res.status === 202) return await res.json();
        return null;
    } catch {
        return null;
    }
}

export function getMatchesByAgenda(agenda) {
    if (!agenda) return matches;
    return matches.filter(m => {
        const equipoMatch = !agenda.filtroEquipos ||
            m.homeTeam === agenda.filtroEquipos ||
            m.awayTeam === agenda.filtroEquipos;
        const ciudadMatch = !agenda.filtroCiudades ||
            agenda.filtroCiudades.split(",").includes(m.city);
        return equipoMatch || ciudadMatch;
    });
}

// --- RECORDATORIOS ---
export async function getMyReminders(userId) {
    return JSON.parse(localStorage.getItem(`reminders_${userId}`) || '[]');
}

export async function toggleReminder({ userId, matchId, matchName, matchDate }) {
    const key = `reminders_${userId}`;
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const exists = current.find((r) => r.matchId === matchId);
    let updated;
    if (exists) {
        updated = current.filter((r) => r.matchId !== matchId);
    } else {
        updated = [...current, {
            matchId, matchName, matchDate,
            createdAt: new Date().toISOString(),
            id: `REM-${Date.now()}`,
        }];
    }
    localStorage.setItem(key, JSON.stringify(updated));
    return { active: !exists, reminders: updated };
}

// --- TIMEZONE ---
export function convertToUserTimezone(dateStr, timeStr, stadiumCity) {
    const stadiumTz = CITY_TIMEZONES[stadiumCity] || 'UTC';
    const dateTimeStr = `${dateStr}T${timeStr}:00`;
    try {
        const userTime = new Intl.DateTimeFormat('es-CO', {
            timeZone: USER_TIMEZONE,
            hour: '2-digit', minute: '2-digit', hour12: false,
        }).format(new Date(dateTimeStr));

        const stadiumOffset = getTimezoneOffset(stadiumTz);
        const userOffset = getTimezoneOffset(USER_TIMEZONE);
        const diffHours = (stadiumOffset - userOffset) / 60;
        const diffLabel = diffHours === 0 ? 'Misma hora'
            : diffHours > 0 ? `+${diffHours}h vs Colombia`
                : `${diffHours}h vs Colombia`;

        return { userTime, diffLabel, stadiumTz, userTz: USER_TIMEZONE };
    } catch {
        return { userTime: timeStr, diffLabel: '', stadiumTz, userTz: USER_TIMEZONE };
    }
}

function getTimezoneOffset(tz) {
    const date = new Date();
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
    return (tzDate - utcDate) / 60000;
}

export function getMatchAlerts(matchDate, matchTime, stadiumCity) {
    const alerts = [];
    const matchDateTime = new Date(`${matchDate}T${matchTime}:00`);
    const now = new Date();
    const hoursUntil = (matchDateTime - now) / (1000 * 60 * 60);

    if (hoursUntil < 0) alerts.push({ type: 'past', message: 'Este partido ya se jugó', icon: '✅' });
    else if (hoursUntil < 2) alerts.push({ type: 'urgent', message: '¡El partido empieza pronto!', icon: '🚨' });
    else if (hoursUntil < 24) alerts.push({ type: 'today', message: 'Partido hoy — llega 2h antes', icon: '⚽' });
    else if (hoursUntil < 72) alerts.push({ type: 'soon', message: 'Partido en los próximos días', icon: '📅' });

    if (stadiumCity && hoursUntil > 0 && hoursUntil < 48)
        alerts.push({ type: 'travel', message: `Sede: ${stadiumCity} — Verifica tu transporte`, icon: '✈️' });

    return alerts;
}