import { apiFetch } from '$lib/api';
import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { browser } from '$app/environment';

export const load: PageLoad = async ({ params, fetch, url }) => {
    if (!browser) {
        return {
            form: null,
            courses: [],
            teachers: [],
            modelId: params.modelId
        };
    }

    const { modelId } = params;

    // Checagem de segurança básica no client
    if (!localStorage.getItem('access_token')) {
        throw redirect(307, `/auth/login?redirectTo=${url.pathname}`);
    }

    try {
        // Chamada do formulário
        const formRes = await apiFetch(`/forms/${modelId}`, {}, fetch);

        if (!formRes.ok) {
            if (formRes.status === 401 || formRes.status === 403) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                throw redirect(307, '/auth/login');
            }
            throw error(formRes.status, 'Não foi possível carregar o modelo de formulário');
        }

        const formData = await formRes.json();

        // Chamadas paralelas para dados auxiliares (cursos e professores)
        const [coursesRes, teachersRes] = await Promise.all([
            apiFetch('/courses', {}, fetch),
            apiFetch('/teachers', {}, fetch)
        ]);

        const coursesList = coursesRes.ok ? await coursesRes.json() : [];
        const teachersList = teachersRes.ok ? await teachersRes.json() : [];

        return {
            form: {
                ...formData.config,
                googleDocsId: formData.googleDocsId,
                titulo: formData.title || formData.config?.titulo,
                description: formData.description || formData.config?.description,
                bgColor: formData.bgColor || formData.config?.bgColor,
                cardBgColor: formData.cardBgColor || formData.config?.cardBgColor,
                tituloColor: formData.titleColor || formData.config?.tituloColor,
                secoes: formData.config?.secoes || []
            },
            courses: coursesList,
            teachers: teachersList,
            modelId: modelId,
            mode: url.searchParams.get('mode')
        };
    } catch (err: any) {
        if (err.status) throw err;
        console.error('[LOAD ERR]', err);
        throw error(500, 'Erro ao carregar dados do formulário');
    }
};
