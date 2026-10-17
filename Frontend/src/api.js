const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const TOKEN_KEY = "sigmagpt_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/**
 * Single place where every request is built, so the JWT is always attached
 * and errors always come back as a real Error with the server's message.
 */
export const apiFetch = async (path, {method = "GET", body, auth = true} = {}) => {
    //FormData sets its own multipart boundary, so never force a Content-Type on it
    const isFormData = body instanceof FormData;
    const headers = isFormData ? {} : {"Content-Type": "application/json"};

    if(auth) {
        const token = getToken();
        if(token) headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined
    });

    let data = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if(!response.ok) {
        if(response.status === 401) clearToken();
        throw new Error(data?.error || `Request failed (${response.status})`);
    }

    return data;
};

export default API_URL;
