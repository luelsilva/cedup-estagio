import { API_URL } from './constants';
import { user } from './stores/auth';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

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
 * Renova o access token usando o refresh token
 */
async function refreshAccessToken(customFetch?: typeof fetch): Promise<string | null> {
    if (!browser) return null;

    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
        return null;
    }

    const fetcher = customFetch || fetch;

    try {
        const response = await fetcher(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken })
        });

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
            goto('/auth/login');
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
export async function apiFetch(endpoint: string, options: RequestInit = {}, customFetch?: typeof fetch): Promise<Response> {
    const accessToken = browser ? localStorage.getItem('access_token') : null;
    const fetcher = customFetch || fetch;

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

    // Primeira tentativa
    let response = await fetcher(`${API_URL}${endpoint}`, config);

    // Se retornou 401 (token expirado) ou 403 (também usado às vezes pelo backend), tentar renovar
    const isAuthRoute = endpoint.includes('/auth/login') || endpoint.includes('/auth/refresh');

    if ((response.status === 401 || response.status === 403) && accessToken && browser && !isAuthRoute) {
        if (!isRefreshing) {
            isRefreshing = true;
            // Tenta renovar o token
            const newToken = await refreshAccessToken(fetcher);
            isRefreshing = false;

            // Importante: Resolve promises pendentes (destrava a fila) mesmo em caso de erro 
            // passando string vazia se falhar
            onTokenRefreshed(newToken || '');

            if (newToken) {
                // Tentar novamente com o novo token
                const newHeaders = { ...headers, 'Authorization': `Bearer ${newToken}` };
                response = await fetcher(`${API_URL}${endpoint}`, { ...config, headers: newHeaders });
            }
        } else {
            // Aguardar a renovação em andamento
            const newToken = await new Promise<string>((resolve) => {
                subscribeTokenRefresh((token) => {
                    resolve(token);
                });
            });

            // Só tenta novamente se o token for válido e não vazio
            if (newToken) {
                const newHeaders = { ...headers, 'Authorization': `Bearer ${newToken}` };
                response = await fetcher(`${API_URL}${endpoint}`, { ...config, headers: newHeaders });
            }
        }
    }

    return response;
}

/**
 * Faz logout revogando o refresh token
 */
export async function logout(customFetch?: typeof fetch) {
    if (!browser) return;

    const refreshToken = localStorage.getItem('refresh_token');
    const fetcher = customFetch || fetch;

    if (refreshToken) {
        try {
            await apiFetch('/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refreshToken })
            }, fetcher);
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
        const response = await apiFetch('/auth/me');

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
