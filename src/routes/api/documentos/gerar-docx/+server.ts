import { json } from '@sveltejs/kit';
import path from 'path';
import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        if (!locals.user) {
            return json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { template_id, nome_documento, data } = await request.json();

        if (!template_id || !nome_documento || !data) {
            return json({
                error: 'Parâmetros ausentes: template_id, nome_documento ou data',
            }, { status: 400 });
        }

        // Caminho dos templates no SvelteKit
        // Nota: Em produção, o SvelteKit pode rodar de lugares diferentes. 
        // Usar process.cwd() ou caminhos baseados em import.meta.url é mais seguro.
        const templatePath = path.resolve(process.cwd(), 'src/lib/server/templates', `${template_id}.docx`);

        if (!fs.existsSync(templatePath)) {
            return json({
                error: `O modelo '${template_id}.docx' não foi encontrado no servidor.`
            }, { status: 404 });
        }

        // Ler o conteúdo do arquivo
        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: '[[', end: ']]' }
        });

        // Injetar os dados do formulário no template
        doc.render(data);

        // Gerar o buffer final do Word
        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        return new Response(buf, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(nome_documento)}.docx`
            }
        });

    } catch (error) {
        console.error('Erro ao gerar DOCX:', error);
        return json({ error: 'Erro interno ao processar o documento Word' }, { status: 500 });
    }
};
