<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { checkAuth } from '$lib/api';

    onMount(async () => {
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) {
            goto('/auth/login');
            return;
        }
    });

    let nomeAluno = $state('');
    let mes = $state(new Date().getMonth());
    let ano = $state(new Date().getFullYear());

    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const nomesDiasSemana = [
        'DOMINGO', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'SÁBADO'
    ];

    let diasDoMes = $derived.by(() => {
        const data = new Date(ano, mes, 1);
        const dias = [];
        const targetMes = Number(mes);
        while (data.getMonth() === targetMes) {
            const dia = data.getDate();
            const diaSemana = data.getDay(); // 0 = Domingo, 6 = Sábado
            dias.push({
                dia,
                diaSemana,
                isDomingo: diaSemana === 0,
                isSabado: diaSemana === 6,
                nomeDia: nomesDiasSemana[diaSemana]
            });
            data.setDate(dia + 1);
        }
        return dias;
    });

    function handleImprimir(e: SubmitEvent) {
        e.preventDefault();
        window.print();
    }
</script>

<svelte:head>
    <title>Folha Ponto - CEDUP</title>
</svelte:head>

<div class="ponto-container">
    <!-- Form Section - Hidden during print -->
    <div class="dados no-print">
        <div class="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl mt-12 border border-gray-100">
            <div class="flex items-center gap-4 mb-8">
                <div class="p-3 bg-blue-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight">Gerador de Folha Ponto</h2>
            </div>

            <form onsubmit={handleImprimir} class="space-y-6">
                <div>
                    <label for="nomeAluno" class="block text-sm font-semibold text-gray-700 mb-1">Nome Completo do Aluno</label>
                    <input 
                        type="text" 
                        id="nomeAluno" 
                        bind:value={nomeAluno} 
                        required 
                        placeholder="Digite o nome completo"
                        class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                    />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="mes" class="block text-sm font-semibold text-gray-700 mb-1">Mês</label>
                        <select 
                            id="mes" 
                            bind:value={mes}
                            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                        >
                            {#each meses as m, i}
                                <option value={i}>{m}</option>
                            {/each}
                        </select>
                    </div>

                    <div>
                        <label for="ano" class="block text-sm font-semibold text-gray-700 mb-1">Ano</label>
                        <input 
                            type="number" 
                            id="ano" 
                            bind:value={ano} 
                            min="1900" 
                            max="2100" 
                            required
                            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Gerar e Imprimir
                </button>
            </form>
        </div>
    </div>

    <!-- Print Section - Visible only during print -->
    <div class="print-only">
        <div id="cabecalho">
            <img src="https://cedup.vercel.app/estagio/assets/img/brazao_sc_217x233.png" alt="brasao_sc" width="106" height="91" />
            <div id="cabecalho-text">
                ESTADO DE SANTA CATARINA<br />
                SECRETARIA DE ESTADO DA EDUCAÇÃO<br />
                COORDENADORIA REGIONAL DA EDUCAÇÃO - CRE<br />
                CENTRO DE EDUCAÇÃO PROFISSIONAL “DARIO GERALDO SALLES” - CEDUP<br />
                SETOR DE ESTÁGIO - JOINVILLE
            </div>
            <img src="https://cedup.vercel.app/estagio/assets/img/logo_cedup_242x242.png" alt="logo_cedup" width="91" height="91" />
        </div>

        <div id="titulo">
            <p>FOLHA PONTO – <span>{meses[mes]} / {ano}</span></p>
            <p>ESTAGIÁRIO – <span>{nomeAluno}</span></p>
        </div>

        <table id="dynamicTable">
            <thead>
                <tr>
                    <th style="width: 30px;"> Dia</th>
                    <th style="width: 270px;"> Dia da Semana</th>
                    <th style="width: 130px;"> Entrada</th>
                    <th style="width: 180px;"> Rubrica</th>
                    <th style="width: 130px;"> Saída</th>
                    <th style="width: 180px;"> Rubrica</th>
                </tr>
            </thead>
            <tbody>
                {#each diasDoMes as d}
                    <tr class:sabado={d.isSabado} class:domingo={d.isDomingo}>
                        <td class="bg-gray-dia">{d.dia}</td>
                        <td class:sabado={d.isSabado} class:domingo={d.isDomingo}>{d.nomeDia}</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                {/each}
            </tbody>
        </table>

        <div id="rodape">
            <p class="normal00">
                <span>Rua Monsenhor Gercino, 2071 – Bairro Itaum – CEP 89210-155 – Joinville – SC Telefone - 34812136</span><br />
                <span style="text-decoration:underline; color:#1155cc">www.cedup.com.br</span><span> - email - </span>
                <span style="text-decoration:underline; color:#1155cc">estagiocedupjlle@sed.sc.gov.br</span><br />
                <span>© {new Date().getFullYear()} LCO Systems</span>
            </p>
        </div>
    </div>
</div>

<style>
    :root {
        --minha-cor-de-fundo: #ddd;
    }

    /* Print settings */
    @media screen {
        .print-only {
            display: none;
        }
    }

    @media print {
        :global(header), :global(footer) {
            display: none !important;
        }

        .no-print {
            display: none !important;
        }

        .print-only {
            display: block !important;
            padding-top: 150px;
            width: 900px;
            margin: 0 auto;
        }

        :global(body) {
            padding: 0;
            margin: 0;
        }

        #cabecalho {
            display: flex;
            align-items: center;
            justify-content: space-between; /* Pushes images to the sides */
            padding: 0 40px; /* Adds lateral space from the page edges */
            text-align: center;
            background-color: #fff;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 90px;
        }

        #cabecalho img {
            height: 70px; /* Scaled down images */
            width: auto;
        }

        #cabecalho-text {
            margin: 0 10px;
            font-weight: bold;
            font-size: 10pt; /* Reduced font size */
        }

        #titulo {
            text-align: center;
            line-height: 1.2;
            font-size: 16pt; /* Reduced from 16pt */
            margin: 10px 10px; /* Reduced margin */
            font-weight: bold;
        }

        #titulo p {
            margin: 2px 0;
        }

        #dynamicTable {
            border-collapse: collapse;
            width: 100%;
            margin-top: 10px;
        }

        th, td {
            border: 1px solid #000;
            padding: 5px 10px; /* Reduced padding from 5px */
            text-align: center;
            line-height: 1.45; /* Reduced line-height from 1.45 */
            font-size: 9pt; /* Consistent smaller font */
        }

        th {
            background-color: var(--minha-cor-de-fundo) !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        tr.sabado, tr.domingo {
            background-color: var(--minha-cor-de-fundo) !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .bg-gray-dia {
            background-color: var(--minha-cor-de-fundo) !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        #rodape {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 100px;
            background-color: #fff;
            padding: 10px;
            text-align: center;
        }

        .normal00 {
            text-align: center;
            line-height: 130%;
            font-size: 10pt;
        }
    }

    /* Screen-only specific table styling if we wanted it visible, but we focus on print */
</style>
