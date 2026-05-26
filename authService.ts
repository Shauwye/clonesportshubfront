const API_URL = "http://localhost:8081";

export async function loginRequest(username: string, password: string) {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username,
            password,
        }),
    });

    if (!response.ok) {
        throw new Error("Usuario o contraseña incorrectos");
    }

    return response.json();
}

export async function registerRequest(username: string, password: string) {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username,
            password,
            role: "USER",
        }),
    });

    if (!response.ok) {
        throw new Error("No se pudo crear el usuario");
    }

    return response.text();
}