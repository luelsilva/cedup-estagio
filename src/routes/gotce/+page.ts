import { apiFetch } from '$lib/api';
import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { browser } from '$app/environment';

export const load: PageLoad = async ({ fetch, url }) => {
    if (!browser) {
        return {
            form: null,
            courses: [],
            teachers: [],
            internship: null,
            mode: 'new'
        };
    }

    const internshipId = url.searchParams.get('id');
    const mode = internshipId ? 'edit' : 'new';

    // Checagem de segurança básica no client
    if (!localStorage.getItem('access_token')) {
        throw redirect(307, `/company/login?returnTo=${url.pathname}${url.search}`);
    }

    try {
        // Sempre carrega o modelo 1501
        const MODEL_ID = '1501';
        const formRes = await apiFetch(`/forms/${MODEL_ID}`, {}, fetch);

        if (!formRes.ok) {
            if (formRes.status === 401 || formRes.status === 403) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                throw redirect(307, '/auth/login');
            }
            throw error(formRes.status, 'Não foi possível carregar o formulário de estágio');
        }

        const formData = await formRes.json();

        // Chamadas paralelas para dados auxiliares
        const [coursesRes, teachersRes] = await Promise.all([
            apiFetch('/courses', {}, fetch),
            apiFetch('/teachers', {}, fetch)
        ]);

        const coursesList = coursesRes.ok ? await coursesRes.json() : [];
        const teachersList = teachersRes.ok ? await teachersRes.json() : [];

        // Carregar dados do estágio se estiver em modo de edição
        let internshipData = null;
        if (internshipId) {
            const internshipRes = await apiFetch(`/internships/${internshipId}`, {}, fetch);
            if (internshipRes.ok) {
                internshipData = await internshipRes.json();
            } else {
                throw error(404, 'Estágio não encontrado');
            }
        }

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
            internship: internshipData,
            mode: mode
        };
    } catch (err: any) {
        if (err.status) throw err;
        console.error('[GOTCE LOAD ERR]', err);
        throw error(500, 'Erro ao carregar dados do formulário de estágio');
    }
};
