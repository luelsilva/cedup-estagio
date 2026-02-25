import { API_URL } from './constants';
import { user } from './stores/auth';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const DEFAULT_TIMEOUT = 10000; // 10 segundos

/**
 * Adiciona callback para ser executado quando o token for renovado
 */
function subscribeTokenRefresh(callback: (token: string) => void) {
    refreshSubscribers.push(callback);
}

/**
 * Notifica todos os callbacks quando o token for renovado
 */
function onTokenRefreshed(token: string) {
    refreshSubscribers.forEach(callback => callback(token));
    refreshSubscribers = [];
}

/**
 * Fetch com timeout para evitar que promessas fiquem "no limbo"
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = DEFAULT_TIMEOUT, customFetch = fetch): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await customFetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error: any) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error(`Timeout: A requisição para ${url} demorou mais de ${timeout}ms`);
        }
        throw error;
    }
}

/**
 * Renova o access token usando o refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
    if (!browser) return null;

    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
        return null;
    }

    try {
        // Usamos fetchWithTimeout com um tempo menor para a renovação (ex: 8s)
        const response = await fetchWithTimeout(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken })
        }, 8000);

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.accessToken);

            // Atualizar dados do usuário se retornados
            if (data.user) {
                user.set(data.user);
            }

            return data.accessToken;
        } else {
            // Refresh token inválido ou expirado
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            user.set(null);
            return null;
        }
    } catch (error) {
        console.error('Erro ao renovar token:', error);
        return null;
    }
}

/**
 * Wrapper para fetch que renova automaticamente o token se expirado
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}, timeoutOrFetch: number | typeof fetch = DEFAULT_TIMEOUT): Promise<Response> {
    let timeout = DEFAULT_TIMEOUT;
    let customFetch = fetch;

    if (typeof timeoutOrFetch === 'number') {
        timeout = timeoutOrFetch;
    } else if (typeof timeoutOrFetch === 'function') {
        customFetch = timeoutOrFetch as typeof fetch;
    }

    const accessToken = browser ? localStorage.getItem('access_token') : null;

    // Adicionar token de autenticação se existir
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const config: RequestInit = {
        ...options,
        headers
    };

    try {
        // Primeira tentativa
        let response = await fetchWithTimeout(`${API_URL}${endpoint}`, config, timeout, customFetch);

        // Se retornou 401 (token expirado) ou 403, tentar renovar
        const isAuthRoute = endpoint.includes('/auth/login') || endpoint.includes('/auth/refresh');

        if ((response.status === 401 || response.status === 403) && accessToken && browser && !isAuthRoute) {
            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    // Tenta renovar o token
                    const newToken = await refreshAccessToken();
                    isRefreshing = false;
                    onTokenRefreshed(newToken || '');

                    if (newToken) {
                        // Tentar novamente com o novo token
                        const newHeaders = { ...headers, 'Authorization': `Bearer ${newToken}` };
                        return await fetchWithTimeout(`${API_URL}${endpoint}`, { ...config, headers: newHeaders }, timeout, customFetch);
                    } else {
                        // Se não renovou, redireciona para login
                        goto('/auth/login');
                    }
                } catch (err) {
                    isRefreshing = false;
                    onTokenRefreshed('');
                    goto('/auth/login');
                    throw err;
                }
            } else {
                // Aguardar a renovação em andamento com timeout de segurança
                try {
                    const newToken = await Promise.race([
                        new Promise<string>((resolve) => {
                            subscribeTokenRefresh((token) => resolve(token));
                        }),
                        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Refresh token timeout')), 10000))
                    ]);

                    if (newToken) {
                        const newHeaders = { ...headers, 'Authorization': `Bearer ${newToken}` };
                        return await fetchWithTimeout(`${API_URL}${endpoint}`, { ...config, headers: newHeaders }, timeout, customFetch);
                    } else {
                        goto('/auth/login');
                    }
                } catch (raceError) {
                    goto('/auth/login');
                    throw raceError;
                }
            }
        }

        return response;
    } catch (error) {
        // Se der erro de timeout ou rede, podemos lidar aqui
        console.error(`Status API error at ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Faz logout revogando o refresh token
 */
export async function logout() {
    if (!browser) return;

    const refreshToken = localStorage.getItem('refresh_token');

    if (refreshToken) {
        try {
            await apiFetch('/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refreshToken })
            }, 5000); // Logout tem timeout curto
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    user.set(null);
    goto('/');
}

/**
 * Verifica se o usuário está autenticado e restaura a sessão
 */
export async function checkAuth(): Promise<boolean> {
    if (!browser) return false;

    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (!accessToken && !refreshToken) {
        return false;
    }

    try {
        const response = await apiFetch('/auth/me', {}, 7000); // Timeout menor para boot

        if (response.ok) {
            const userData = await response.json();
            user.set(userData);
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        return false;
    }
}

/**
 * Define os tokens de autenticação
 */
export function setAuthTokens(accessToken: string, refreshToken: string) {
    if (!browser) return;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
}
