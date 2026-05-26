const API_URL = "http://localhost:8081";

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

// ── LÍMITES RF-29 ─────────────────────────────────────────────
export const LIMITES = {
    maxOfertasActivas: 5,
    maxIntercambiosDia: 10,
    costoMonedasPorLaminaRara: 3,
    costoMonedasPorLaminaEpica: 7,
    costoMonedasPorLaminaComun: 1,
    monedasPorRepetida: 1,
};

// ── AUDITORÍA ─────────────────────────────────────────────────
async function registrarAuditoria({ transaccionId, tipo, usuarioId, resultado, detalle, nivelRiesgo = "BAJO" }) {
    const correlationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    try {
        await fetch(`${API_URL}/transaccionauditada/create`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                transaccionId,
                tipoTransaccion: tipo,
                usuarioId,
                fechaHora: new Date().toISOString(),
                resultado,
                detalle,
                correlationId,
                nivelRiesgo,
            }),
        });
    } catch (e) {
        console.error("Error registrando auditoría:", e);
    }
}

// ── MONEDAS ───────────────────────────────────────────────────
export async function getMonedas(usuarioId) {
    try {
        const res = await fetch(`${API_URL}/monedarepetidas/getbyusuarioid/${usuarioId}`, {
            headers: getAuthHeaders(),
        });
        if (res.status === 202) return await res.json();
        return null;
    } catch { return null; }
}

export async function getOrCreateMonedas(usuarioId) {
    const monedas = await getMonedas(usuarioId);
    if (monedas) return monedas;

    await fetch(`${API_URL}/monedarepetidas/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            usuarioId,
            saldoActual: 0,
            fechaUltimaActualizacion: new Date().toISOString(),
            origenUltimoMovimiento: "INICIO",
        }),
    });
    return await getMonedas(usuarioId);
}

export async function agregarMonedas(usuarioId, cantidad, origen) {
    const monedas = await getOrCreateMonedas(usuarioId);
    await fetch(`${API_URL}/monedarepetidas/update/${monedas.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            ...monedas,
            saldoActual: (monedas.saldoActual || 0) + cantidad,
            fechaUltimaActualizacion: new Date().toISOString(),
            origenUltimoMovimiento: origen,
        }),
    });
    await registrarAuditoria({
        transaccionId: monedas.id,
        tipo: "MONEDA_GANADA",
        usuarioId,
        resultado: "EXITOSO",
        detalle: `+${cantidad} monedas por ${origen}`,
        nivelRiesgo: "BAJO",
    });
}

export async function gastarMonedas(usuarioId, cantidad, origen) {
    const monedas = await getOrCreateMonedas(usuarioId);
    if ((monedas.saldoActual || 0) < cantidad)
        throw new Error(`Saldo insuficiente. Tienes ${monedas.saldoActual} monedas`);

    await fetch(`${API_URL}/monedarepetidas/update/${monedas.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            ...monedas,
            saldoActual: monedas.saldoActual - cantidad,
            fechaUltimaActualizacion: new Date().toISOString(),
            origenUltimoMovimiento: origen,
        }),
    });
    await registrarAuditoria({
        transaccionId: monedas.id,
        tipo: "MONEDA_GASTADA",
        usuarioId,
        resultado: "EXITOSO",
        detalle: `-${cantidad} monedas por ${origen}`,
        nivelRiesgo: "MEDIO",
    });
}

// ── INTERCAMBIOS DIRECTOS ─────────────────────────────────────
export async function getIntercambios(usuarioId) {
    try {
        const res = await fetch(`${API_URL}/intercambio/getbyusuario/${usuarioId}`, {
            headers: getAuthHeaders(),
        });
        if (res.status === 202) return await res.json();
        return [];
    } catch { return []; }
}

export async function getIntercambiosPendientes(usuarioId) {
    try {
        const res = await fetch(`${API_URL}/intercambio/pendientes/${usuarioId}`, {
            headers: getAuthHeaders(),
        });
        if (res.status === 202) return await res.json();
        return [];
    } catch { return []; }
}

export async function contarActivos(usuarioId) {
    try {
        const res = await fetch(`${API_URL}/intercambio/countactivos/${usuarioId}`, {
            headers: getAuthHeaders(),
        });
        if (res.ok) return await res.json();
        return 0;
    } catch { return 0; }
}

// Verificar límite diario (usando auditoría local como proxy)
function contarIntercambiosHoy(usuarioId) {
    const key = `intercambiosHoy_${usuarioId}_${new Date().toDateString()}`;
    return parseInt(localStorage.getItem(key) || "0");
}

function incrementarIntercambiosHoy(usuarioId) {
    const key = `intercambiosHoy_${usuarioId}_${new Date().toDateString()}`;
    localStorage.setItem(key, String(contarIntercambiosHoy(usuarioId) + 1));
}

// RF-28: Proponer intercambio directo usuario a usuario
export async function proponerIntercambio({
                                              usuarioOrigenId,
                                              usuarioDestinoId,
                                              laminaOrigenId,
                                              laminaDestinoId,
                                              laminaOrigenNombre,
                                              laminaDestinoNombre,
                                          }) {
    // Verificar límite activo RF-29
    const activos = await contarActivos(usuarioOrigenId);
    if (activos >= LIMITES.maxOfertasActivas)
        throw new Error(`Límite de ${LIMITES.maxOfertasActivas} ofertas activas alcanzado`);

    // Verificar límite diario RF-29
    const hoy = contarIntercambiosHoy(usuarioOrigenId);
    if (hoy >= LIMITES.maxIntercambiosDia)
        throw new Error(`Límite de ${LIMITES.maxIntercambiosDia} intercambios por día alcanzado`);

    const correlationId = `IC-${Date.now()}`;
    const detalle = JSON.stringify({
        laminaOrigenId,
        laminaDestinoId,
        laminaOrigenNombre,
        laminaDestinoNombre,
    });

    const res = await fetch(`${API_URL}/intercambio/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            usuarioOrigenId,
            usuarioDestinoId,
            tipoIntercambio: "DIRECTO",
            estado: "PENDIENTE",
            fechaSolicitud: new Date().toISOString(),
            detalleIntercambio: detalle,
            correlationId,
        }),
    });

    if (!res.ok) throw new Error("Error al crear el intercambio");

    await registrarAuditoria({
        transaccionId: usuarioOrigenId,
        tipo: "INTERCAMBIO_PROPUESTO",
        usuarioId: usuarioOrigenId,
        resultado: "EXITOSO",
        detalle: `${laminaOrigenNombre} ↔ ${laminaDestinoNombre}`,
        nivelRiesgo: "BAJO",
    });

    return { correlationId };
}

// RF-28: Aceptar intercambio directo — transfiere las láminas
export async function aceptarIntercambio(intercambioId, intercambio, inventarioOrigen, inventarioDestino) {
    const detalle = JSON.parse(intercambio.detalleIntercambio || "{}");

    // Verificar límite diario del que acepta
    const hoy = contarIntercambiosHoy(intercambio.usuarioDestinoId);
    if (hoy >= LIMITES.maxIntercambiosDia)
        throw new Error("Límite diario de intercambios alcanzado");

    // 1. Marcar intercambio como COMPLETADO
    await fetch(`${API_URL}/intercambio/update/${intercambioId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            ...intercambio,
            estado: "COMPLETADO",
            fechaConfirmacionDestino: new Date().toISOString(),
            fechaCierre: new Date().toISOString(),
        }),
    });

    // 2. Transferir lámina origen → destino
    // Reducir cantidad en inventario origen
    const invOrigen = inventarioOrigen.find(i => String(i.laminaId) === String(detalle.laminaOrigenId));
    if (invOrigen) {
        if (invOrigen.cantidad <= 1) {
            await fetch(`${API_URL}/inventariousuario/deletebyid/${invOrigen.id}`, {
                method: "DELETE", headers: getAuthHeaders(),
            });
        } else {
            await fetch(`${API_URL}/inventariousuario/update/${invOrigen.id}`, {
                method: "PUT", headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...invOrigen,
                    cantidad: invOrigen.cantidad - 1,
                    esRepetida: (invOrigen.cantidad - 1) > 1,
                    ultimoMovimiento: new Date().toISOString(),
                }),
            });
        }
    }

    // Agregar lámina al inventario destino
    const invDestinoTieneOrigen = inventarioDestino.find(i => String(i.laminaId) === String(detalle.laminaOrigenId));
    if (invDestinoTieneOrigen) {
        await fetch(`${API_URL}/inventariousuario/update/${invDestinoTieneOrigen.id}`, {
            method: "PUT", headers: getAuthHeaders(),
            body: JSON.stringify({
                ...invDestinoTieneOrigen,
                cantidad: invDestinoTieneOrigen.cantidad + 1,
                esRepetida: true,
                ultimoMovimiento: new Date().toISOString(),
            }),
        });
    } else {
        await fetch(`${API_URL}/inventariousuario/create`, {
            method: "POST", headers: getAuthHeaders(),
            body: JSON.stringify({
                usuarioId: intercambio.usuarioDestinoId,
                laminaId: detalle.laminaOrigenId,
                cantidad: 1, esRepetida: false,
                fechaObtencion: new Date().toISOString(),
                ultimoMovimiento: new Date().toISOString(),
            }),
        });
    }

    // 3. Transferir lámina destino → origen (mismo proceso inverso)
    const invDestino = inventarioDestino.find(i => String(i.laminaId) === String(detalle.laminaDestinoId));
    if (invDestino) {
        if (invDestino.cantidad <= 1) {
            await fetch(`${API_URL}/inventariousuario/deletebyid/${invDestino.id}`, {
                method: "DELETE", headers: getAuthHeaders(),
            });
        } else {
            await fetch(`${API_URL}/inventariousuario/update/${invDestino.id}`, {
                method: "PUT", headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...invDestino,
                    cantidad: invDestino.cantidad - 1,
                    esRepetida: (invDestino.cantidad - 1) > 1,
                    ultimoMovimiento: new Date().toISOString(),
                }),
            });
        }
    }

    const invOrigenTieneDestino = inventarioOrigen.find(i => String(i.laminaId) === String(detalle.laminaDestinoId));
    if (invOrigenTieneDestino) {
        await fetch(`${API_URL}/inventariousuario/update/${invOrigenTieneDestino.id}`, {
            method: "PUT", headers: getAuthHeaders(),
            body: JSON.stringify({
                ...invOrigenTieneDestino,
                cantidad: invOrigenTieneDestino.cantidad + 1,
                esRepetida: true,
                ultimoMovimiento: new Date().toISOString(),
            }),
        });
    } else {
        await fetch(`${API_URL}/inventariousuario/create`, {
            method: "POST", headers: getAuthHeaders(),
            body: JSON.stringify({
                usuarioId: intercambio.usuarioOrigenId,
                laminaId: detalle.laminaDestinoId,
                cantidad: 1, esRepetida: false,
                fechaObtencion: new Date().toISOString(),
                ultimoMovimiento: new Date().toISOString(),
            }),
        });
    }

    // 4. Incrementar contador diario ambos usuarios
    incrementarIntercambiosHoy(intercambio.usuarioOrigenId);
    incrementarIntercambiosHoy(intercambio.usuarioDestinoId);

    // 5. Auditoría
    await registrarAuditoria({
        transaccionId: intercambioId,
        tipo: "INTERCAMBIO_COMPLETADO",
        usuarioId: intercambio.usuarioDestinoId,
        resultado: "EXITOSO",
        detalle: `Intercambio directo completado. Láminas: ${detalle.laminaOrigenNombre} ↔ ${detalle.laminaDestinoNombre}`,
        nivelRiesgo: "BAJO",
    });
}

// RF-28: Rechazar intercambio
export async function rechazarIntercambio(intercambioId, intercambio, usuarioId) {
    await fetch(`${API_URL}/intercambio/update/${intercambioId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            ...intercambio,
            estado: "RECHAZADO",
            fechaCierre: new Date().toISOString(),
        }),
    });
    await registrarAuditoria({
        transaccionId: intercambioId,
        tipo: "INTERCAMBIO_RECHAZADO",
        usuarioId,
        resultado: "RECHAZADO",
        detalle: "El usuario rechazó el intercambio",
        nivelRiesgo: "BAJO",
    });
}

// RF-28: Cancelar intercambio propio
export async function cancelarIntercambio(intercambioId, intercambio, usuarioId) {
    await fetch(`${API_URL}/intercambio/update/${intercambioId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            ...intercambio,
            estado: "CANCELADO",
            fechaCierre: new Date().toISOString(),
        }),
    });
    await registrarAuditoria({
        transaccionId: intercambioId,
        tipo: "INTERCAMBIO_CANCELADO",
        usuarioId,
        resultado: "CANCELADO",
        detalle: "El usuario canceló su oferta",
        nivelRiesgo: "BAJO",
    });
}

// RF-28: Intercambio mediado por monedas
export async function intercambiarConMonedas({
                                                 usuarioId, laminaDeseadaId, laminaDeseadaNombre, rareza, inventarioOrigen,
                                             }) {
    const costo = {
        COMUN: LIMITES.costoMonedasPorLaminaComun,
        RARA: LIMITES.costoMonedasPorLaminaRara,
        EPICA: LIMITES.costoMonedasPorLaminaEpica,
    }[rareza] || 1;

    // Verificar límite diario
    const hoy = contarIntercambiosHoy(usuarioId);
    if (hoy >= LIMITES.maxIntercambiosDia)
        throw new Error("Límite diario de intercambios alcanzado");

    // Gastar monedas
    await gastarMonedas(usuarioId, costo, `Compra lámina: ${laminaDeseadaNombre}`);

    // Agregar lámina al inventario
    const yaLaTiene = inventarioOrigen.find(i => String(i.laminaId) === String(laminaDeseadaId));
    if (yaLaTiene) {
        await fetch(`${API_URL}/inventariousuario/update/${yaLaTiene.id}`, {
            method: "PUT", headers: getAuthHeaders(),
            body: JSON.stringify({
                ...yaLaTiene,
                cantidad: yaLaTiene.cantidad + 1,
                esRepetida: true,
                ultimoMovimiento: new Date().toISOString(),
            }),
        });
    } else {
        await fetch(`${API_URL}/inventariousuario/create`, {
            method: "POST", headers: getAuthHeaders(),
            body: JSON.stringify({
                usuarioId, laminaId: laminaDeseadaId,
                cantidad: 1, esRepetida: false,
                fechaObtencion: new Date().toISOString(),
                ultimoMovimiento: new Date().toISOString(),
            }),
        });
    }

    incrementarIntercambiosHoy(usuarioId);

    await registrarAuditoria({
        transaccionId: usuarioId,
        tipo: "INTERCAMBIO_MONEDAS",
        usuarioId,
        resultado: "EXITOSO",
        detalle: `Compra con ${costo} monedas: ${laminaDeseadaNombre}`,
        nivelRiesgo: "MEDIO",
    });

    return { costo };
}

// Convertir repetidas en monedas
export async function convertirRepetidas(usuarioId, inventarioItem) {
    const monedas = LIMITES.monedasPorRepetida;
    if ((inventarioItem.cantidad || 1) <= 1)
        throw new Error("Solo puedes convertir láminas repetidas");

    // Reducir cantidad en 1
    await fetch(`${API_URL}/inventariousuario/update/${inventarioItem.id}`, {
        method: "PUT", headers: getAuthHeaders(),
        body: JSON.stringify({
            ...inventarioItem,
            cantidad: inventarioItem.cantidad - 1,
            esRepetida: (inventarioItem.cantidad - 1) > 1,
            ultimoMovimiento: new Date().toISOString(),
        }),
    });

    // Agregar monedas
    await agregarMonedas(usuarioId, monedas, "CONVERSION_REPETIDA");
    return { monedas };
}
export async function buscarUsuarioPorUsername(username) {
    try {
        const res = await fetch(`${API_URL}/user/getbyusername/${username}`, {
            headers: getAuthHeaders(),
        });
        if (res.status === 202) {
            const data = await res.json();
            return { id: data.id, username: data.nombreUsuario || username };
        }
        return null;
    } catch { return null; }
}