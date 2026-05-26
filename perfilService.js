const API_URL = "http://localhost:8081";

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

async function getUsuarioIdByUsername(username) {
    const response = await fetch(`${API_URL}/user/getbyusername/${username}`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("No se pudo obtener el usuario");
    const data = await response.json();
    return data.id;
}

async function getPerfilByUsuarioId(usuarioId) {
    const response = await fetch(`${API_URL}/perfil/getbyusuarioid/${usuarioId}`, {
        headers: getAuthHeaders(),
    });
    if (response.status === 404 || response.status === 204) return null;
    if (!response.ok) throw new Error("Error al obtener el perfil");
    return await response.json();
}

async function createPerfil(perfilData) {
    const response = await fetch(`${API_URL}/perfil/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(perfilData),
    });
    if (!response.ok) throw new Error("Error al crear el perfil");
    return true;
}

async function updatePerfil(perfilId, perfilData) {
    const response = await fetch(`${API_URL}/perfil/update/${perfilId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(perfilData),
    });
    if (!response.ok) throw new Error("Error al actualizar el perfil");
    return true;
}

export async function guardarPerfil({
                                        username,
                                        avatarUrl,
                                        nombreCompleto,
                                        telefono,
                                        pais,
                                        ciudadResidencia,
                                        zonaHoraria,
                                        idioma,
                                        equipoFavorito,
                                    }) {
    const usuarioId = await getUsuarioIdByUsername(username);
    const perfilExistente = await getPerfilByUsuarioId(usuarioId);

    const perfilData = {
        usuarioId,
        avatarUrl,
        nombreCompleto,
        telefono: telefono || null,
        pais,
        ciudadResidencia,
        zonaHoraria,
        idioma,
        fechaActualizacion: new Date().toISOString(),
    };

    if (perfilExistente) {
        return await updatePerfil(perfilExistente.id, perfilData);
    } else {
        return await createPerfil(perfilData);
    }

}