<script lang="ts">
	import { onMount } from 'svelte';
	import { apiFetch } from '$lib/api';
	import { fade } from 'svelte/transition';
	import { devNotes } from '$lib/stores/devNotes.svelte';

	interface Props {
		data: {
			form: any;
			courses: any[];
			teachers: any[];
			modelId: string;
			mode: string | null;
		};
	}

	let { data: pageData }: Props = $props();
	let form = $derived(pageData.form);
	let formValues = $state<Record<string, any>>({});
	let submitting = $state(false);
	let successLink = $state('');
	let successLinkDocx = $state('');
	let lastGeneratedName = $state('');

	onMount(() => {
		// Documentação para Desenvolvedores (F2)
		devNotes.setNotes([
			'<strong>Responsabilidade:</strong> Renderizador GENÉRICO de formulários. Ao contrário do `gotce`, esta página **NÃO salva os dados** no banco. Ela serve apenas para preencher, validar e gerar o PDF.',
			'<strong>Gerador Dinâmico:</strong> Renderiza inputs baseados no JSON do `modelId` vindo da URL.',
			'<strong>Sufixos de Endereço:</strong> Possui a mesma lógica inteligente do `gotce` para agrupar campos de endereço (`EnderCompleto...`).',
			'<strong>Parse de Opções:</strong> O `getOptions` tenta parsear strings JSON ou CSV para popular selects.',
			'<strong>Debug:</strong> Os dados enviados para a geração do PDF são logados no console como `[DEBUG PDF PAYLOAD]`.'
		]);

		// Inicializar campos especiais
		formValues['modelo_id'] = pageData.modelId;
		formValues['copyright'] = `© ${new Date().getFullYear()} LCO Systems`;
		formValues['data_atual'] = new Date().toLocaleDateString('pt-BR');
	});

	// Lógica para preencher Email e Matrícula quando o Professor é selecionado
	$effect(() => {
		// Suporta tanto NomeProfessor quanto nome_professor
		const selectedTeacherName = formValues['nome_professor'] || formValues['NomeProfessor'];
		if (selectedTeacherName) {
			const teacher = pageData.teachers.find((t: any) => t.name == selectedTeacherName);
			if (teacher) {
				// Preenche apenas em snake_case
				formValues['email_professor'] = teacher.email;
				formValues['matricula_professor'] = teacher.registration;
			}
		}
	});

	function getOptions(id: string) {
		// Normalizar ID para comparação
		const normalizedId = (id || '').toLowerCase().trim();

		// Buscar a coluna no formulário para verificar o label como fallback
		let colLabel = '';
		if (form?.secoes) {
			for (const secao of form.secoes) {
				for (const row of secao.rows) {
					const col = row.cols.find((c: any) => c.id === id);
					if (col) {
						colLabel = (col.label || '').toLowerCase();
						break;
					}
				}
				if (colLabel) break;
			}
		}

		// IDs Especiais (Dinâmicos) - Suporta várias nomenclaturas comuns e labels fallback
		const isCourseField =
			normalizedId === 'sigla_curso' || normalizedId === 'nome_curso' || colLabel.includes('curso');

		const isTeacherField = normalizedId === 'nome_professor' || colLabel.includes('professor');

		if (isCourseField && pageData.courses && pageData.courses.length > 0) {
			return pageData.courses.map((c: any) => ({ value: c.name, label: c.name }));
		}

		if (isTeacherField && pageData.teachers && pageData.teachers.length > 0) {
			return pageData.teachers.map((t: any) => ({ value: t.name, label: t.name }));
		}

		// Busca no Modelo do Formulário
		if (!form?.secoes) return [];
		for (const secao of form.secoes) {
			for (const row of secao.rows) {
				const foundCol = row.cols.find((c: any) => c.id === id);
				if (foundCol && foundCol.options) {
					if (Array.isArray(foundCol.options)) return foundCol.options;
					// Se for string JSON (legado) ou separada por vírgula
					if (typeof foundCol.options === 'string') {
						try {
							const parsed = JSON.parse(foundCol.options);
							if (Array.isArray(parsed)) return parsed;
						} catch (e) {
							return foundCol.options
								.split(',')
								.map((o: string) => ({ value: o.trim(), label: o.trim() }));
						}
					}
				}
			}
		}
		return [];
	}

	// Função para prevenir entrada de caracteres não numéricos em campos numéricos
	function handleNumericKeydown(event: KeyboardEvent) {
		const key = event.key;

		// Permite: backspace, delete, tab, escape, enter, home, end, setas
		const allowedKeys = [
			'Backspace',
			'Delete',
			'Tab',
			'Escape',
			'Enter',
			'Home',
			'End',
			'ArrowLeft',
			'ArrowRight',
			'ArrowUp',
			'ArrowDown'
		];

		if (allowedKeys.includes(key)) {
			return; // Permite essas teclas
		}

		// Permite Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
		if (event.ctrlKey || event.metaKey) {
			return;
		}

		// Bloqueia se não for um dígito (0-9)
		if (!/^\d$/.test(key)) {
			event.preventDefault();
		}
	}

	async function handleCepLookup(inputId: string, cepValue: string) {
		const cep = cepValue.replace(/\D/g, '');

		let suffix = '';

		// Detectar convenção de nomenclatura e extrair sufixo
		if (inputId.startsWith('Cep')) {
			suffix = inputId.substring(3); // Ex: CepAluno -> Aluno
		} else if (inputId.startsWith('cep_')) {
			suffix = inputId.substring(4); // Ex: cep_aluno -> aluno
		} else if (inputId === 'cep') {
			suffix = '';
		}

		const snakeSuffix = suffix ? `_${suffix.toLowerCase()}` : '';

		// Função auxiliar para atualizar campos
		const setAddressFields = (valueOrData: any) => {
			const isData = typeof valueOrData === 'object' && valueOrData !== null;
			const logradouro = isData ? valueOrData.logradouro : valueOrData;
			const bairro = isData ? valueOrData.bairro : valueOrData;
			const localidade = isData ? valueOrData.localidade : valueOrData;
			const uf = isData ? valueOrData.uf : valueOrData;

			// Define chaves apenas em snake_case
			const targets = [
				{ key: `rua${snakeSuffix}`, val: logradouro },
				{ key: `bairro${snakeSuffix}`, val: bairro },
				{ key: `cidade${snakeSuffix}`, val: localidade },
				{ key: `estado${snakeSuffix}`, val: uf }
			];

			targets.forEach(({ key, val }) => {
				formValues[key] = val;
			});

			// Tratamento especial para campos raiz (sem sufixo) - apenas snake_case
			if (!suffix) {
				formValues['rua'] = logradouro;
				formValues['bairro'] = bairro;
				formValues['cidade'] = localidade;
				formValues['estado'] = uf;
			}
		};

		// Se o usuário apagou o CEP, limpa os campos
		if (cep.length === 0) {
			setAddressFields('');
			return;
		}

		if (cep.length !== 8) return;

		// Mostrar carregando
		setAddressFields('...');

		try {
			const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
			const data = await res.json();

			if (!data.erro) {
				setAddressFields(data);
			} else {
				throw new Error('CEP não encontrado');
			}
		} catch (error) {
			console.error('Erro ao buscar CEP:', error);
			setAddressFields(''); // Limpa campos em erro
		}
	}

	async function handleSubmit(type = 'pdf') {
		if (type === 'pdf' && !form.googleDocsId) {
			alert('Este formulário não possui um Google Docs ID configurado para gerar PDF via Google.');
			return;
		}

		submitting = true;
		// Limpa links anteriores ao iniciar nova geração
		if (type === 'pdf') {
			if (successLink) URL.revokeObjectURL(successLink);
			successLink = '';
		} else {
			if (successLinkDocx) URL.revokeObjectURL(successLinkDocx);
			successLinkDocx = '';
		}

		try {
			// Formatar datas para o padrão brasileiro DD/MM/YYYY se necessário
			const dataToSubmit = { ...formValues };

			// Percorrer os valores do formulário para descobrir sufixos de endereço dinamicamente
			const allKeys = Object.keys(formValues);
			const suffixes = new Set<string>();

			allKeys.forEach((key: string) => {
				// Detecta apenas snake_case (ex: rua_aluno -> aluno)
				const snakeMatch = key.match(/^(rua|cep|bairro|cidade|estado|uf|num_ender)_(.+)$/i);

				if (snakeMatch && snakeMatch[2]) {
					suffixes.add(snakeMatch[2]); // Mantém lowercase: aluno, empresa
				}
			});

			// Manter varredura de secoes para compatibilidade
			if (form?.secoes) {
				form.secoes.forEach((secao: any) => {
					secao.rows.forEach((row: any) => {
						row.cols.forEach((col: any) => {
							const inputId = col.id;
							if (!inputId) return;

							// Lógica para duplicar campos xx + dígito
							const xxMatch = inputId.match(/^xx\d(.+)$/);
							if (xxMatch) {
								const sourceId = xxMatch[1];
								if (formValues[sourceId] !== undefined) {
									dataToSubmit[inputId] = formValues[sourceId];
								}
							}

							let val = dataToSubmit[inputId];

							if (val === undefined || val === null || val === '') {
								dataToSubmit[inputId] = ' '.repeat(inputId.length);
								return;
							}

							if (col.type === 'date' && typeof val === 'string' && val.includes('-')) {
								const parts = val.split('-');
								if (parts.length === 3 && parts[0].length === 4) {
									dataToSubmit[inputId] = `${parts[2]}/${parts[1]}/${parts[0]}`;
								}
							}
						});
					});
				});
			}

			// Gerar EnderCompleto para cada grupo de endereço encontrado
			suffixes.forEach((suffix) => {
				const suffixLower = suffix.toLowerCase();
				const suffixCap = suffix.charAt(0).toUpperCase() + suffix.slice(1);

				const getVal = (prefix: string, snakePrefix: string) => {
					return (
						formValues[`${prefix}${suffix}`] ||
						formValues[`${prefix}${suffixCap}`] ||
						formValues[`${prefix}${suffixLower}`] ||
						formValues[`${snakePrefix}_${suffixLower}`] ||
						''
					);
				};

				const rua = getVal('Rua', 'rua');
				const numero = getVal('Numero', 'num_ender');
				const bairro = getVal('Bairro', 'bairro');
				const cidade = getVal('Cidade', 'cidade');
				const uf = getVal('Estado', 'estado') || getVal('Uf', 'uf');
				const cep = getVal('Cep', 'cep');

				if (rua || numero || bairro || cidade || uf || cep) {
					const value = `${rua}, ${numero} ${bairro} - ${cidade}/${uf}${cep ? ` - CEP: ${cep}` : ''}`;

					// Injeta apenas em snake_case
					dataToSubmit[`ender_completo_${suffixLower}`] = value;
				}
			});
			// Gerar o nome do documento (suporta nome_aluno e NomeAluno)
			const nomeAluno = formValues['nome_aluno'] || formValues['NomeAluno'] || 'Novo_Documento';
			const nomeDocumento = `${pageData.modelId} - ${nomeAluno}`;
			lastGeneratedName = nomeAluno;

			const endpoint = type === 'pdf' ? '/documentos/gerar-pdf' : '/documentos/gerar-docx';

			console.log(`[DEBUG PAYLOAD] Enviando para ${endpoint}:`, {
				template_id: pageData.modelId,
				nome_documento: nomeDocumento,
				data: dataToSubmit
			});

			const res = await apiFetch(endpoint, {
				method: 'POST',
				body: JSON.stringify({
					template_id: pageData.modelId,
					nome_documento: nomeDocumento,
					data: dataToSubmit
				})
			});

			if (res.ok) {
				const blob = await res.blob();
				if (type === 'pdf') {
					successLink = URL.createObjectURL(blob);
				} else {
					successLinkDocx = URL.createObjectURL(blob);
				}
			} else {
				const err = await res.json();
				alert(`Erro ao gerar ${type.toUpperCase()}: ` + (err.error || 'Erro desconhecido'));
			}
		} catch (error) {
			console.error(error);
			alert('Erro de conexão ao gerar o documento');
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{form?.titulo || 'Carregando...'} | Cedup</title>
</svelte:head>

{#if form && form.secoes}
	<div class="myform-container" style="background-color: {form.bgColor}">
		<div class="myform-card" style="background-color: {form.cardBgColor}">
			<h4 class="myform-titulo" style="color: {form.tituloColor}">
				{form.titulo}
			</h4>

			{#if form.description}
				<p class="myform-description" style="color: {form.tituloColor}; opacity: 0.8;">
					{@html form.description}
				</p>
			{/if}

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit('docx');
				}}
				class="myform-form"
			>
				<div class="secoes-container">
					{#each form.secoes as secao}
						<div
							class="secao-card"
							style={secao.active ? `border-left: 8px solid ${secao.color}` : ''}
						>
							<h5 class="secao-titulo" style="color: {secao.color}">
								{secao.titulo}
							</h5>
							<div class="secao-body">
								{#each secao.rows as row}
									<div class="row-container">
										<div class="row-cols">
											{#each row.cols as col, colIdx}
												{@const inputId = col.id || `in-${secao.titulo}-${row.id}-${colIdx}`}
												{@const inputType = col.type || 'text'}
												{#if inputType === 'hidden'}
													<input id={inputId} type="hidden" bind:value={formValues[inputId]} />
												{:else}
													<div
														class="col-item {pageData.mode === 'view'
															? 'pointer-events-none opacity-80 select-none'
															: ''}"
														style={col.width ? `width: ${col.width}; flex: none;` : ''}
													>
														<label for={inputId} class="col-label" style="color: {secao.color}"
															>{col.label}</label
														>
														{#if inputType === 'textarea'}
															<textarea
																id={inputId}
																class="col-input min-h-[100px]"
																bind:value={formValues[inputId]}
																required={col.required !== false}
																disabled={pageData.mode === 'view'}
															></textarea>
														{:else if inputType === 'select'}
															<select
																id={inputId}
																class="col-input"
																bind:value={formValues[inputId]}
																required={col.required !== false}
																disabled={pageData.mode === 'view'}
															>
																<option value="" disabled selected>Selecione...</option>
																{#each getOptions(inputId) as opt}
																	<option value={opt.value}>{opt.label}</option>
																{/each}
															</select>
														{:else if inputType === 'readonly'}
															<input
																id={inputId}
																type="text"
																class="col-input cursor-not-allowed bg-gray-50"
																readonly
																bind:value={formValues[inputId]}
																required={col.required !== false}
															/>
														{:else if inputType === 'cep'}
															<input
																id={inputId}
																type="text"
																class="col-input"
																bind:value={formValues[inputId]}
																required={col.required !== false}
																maxlength="9"
																placeholder="00000-000"
																disabled={pageData.mode === 'view'}
																onblur={(e) => handleCepLookup(inputId, e.currentTarget.value)}
															/>
														{:else}
															<input
																id={inputId}
																type={inputType}
																class="col-input"
																bind:value={formValues[inputId]}
																required={col.required !== false}
																disabled={pageData.mode === 'view'}
																onkeydown={inputType === 'number'
																	? handleNumericKeydown
																	: undefined}
															/>
														{/if}
													</div>
												{/if}
											{/each}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>

				<div class="mt-8 flex w-full flex-col items-center gap-4">
					{#if pageData.mode !== 'view'}
						<div class="flex w-full max-w-md justify-center">
							<button
								type="submit"
								disabled={submitting}
								class="btn-submit w-full"
								style="background-color: #2b579a"
							>
								{#if submitting}
									<span class="mr-2 animate-spin">🌀</span> Processando...
								{:else}
									📄 Gerar Documento (Word)
								{/if}
							</button>
						</div>
					{/if}

					{#if successLinkDocx}
						<div
							class="w-full max-w-md rounded-2xl border-2 border-blue-500 bg-white p-6 text-center shadow-xl"
							in:fade
						>
							<p class="mb-4 font-bold text-blue-700">✨ Arquivo pronto!</p>
							<div class="flex justify-center gap-2">
								<a
									href={successLinkDocx}
									download={`${pageData.modelId} - ${lastGeneratedName}.docx`}
									class="btn-action bg-blue-600 hover:bg-blue-700"
								>
									📥 Baixar Word (.docx)
								</a>
							</div>
						</div>
					{/if}
				</div>
			</form>
		</div>
	</div>
{:else}
	<div class="flex min-h-[70vh] items-center justify-center">
		<p class="animate-pulse text-gray-500">Carregando formulário...</p>
	</div>
{/if}

<style>
	.row-container {
		display: flex;
		flex-direction: column;
	}

	.row-cols {
		display: flex;
		gap: 0.75rem;
		width: 100%;
		flex-wrap: wrap; /* Permite que os campos pulem para baixo */
	}

	.col-item {
		flex: 1;
		min-width: 150px; /* Garante uma largura mínima antes de quebrar */
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		background-color: white;
		padding: 0.5rem;
	}

	/* Responsividade para telas menores (Celulares e Tablets) */
	@media (max-width: 768px) {
		.myform-container {
			padding: 1rem;
		}

		.myform-card {
			width: 100%;
			padding: 1.5rem 1rem;
		}

		.myform-titulo {
			font-size: 1.75rem;
		}

		.row-cols {
			gap: 1rem;
		}

		.col-item {
			width: 100% !important; /* Força cada campo a ocupar a linha toda */
			flex: none;
		}

		.secao-card {
			padding: 0.75rem;
		}
	}

	.col-label {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.col-input {
		width: 100%;
		border: 1px solid #abacad;
		border-radius: 0.25rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
		outline: none;
	}

	.col-input:focus {
		border-color: #d1d5db;
	}
	.secoes-container {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.secao-card {
		background-color: #ffffff;
		padding: 0.5rem;
		border-radius: 1rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		width: 100%;
		transition: transform 0.2s;
	}

	.secao-titulo {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	.secao-body {
		color: #6b7280;
		font-size: 0.875rem;
	}
	.myform-container {
		display: flex;
		flex: 1;
		width: 100%;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		min-height: 70vh;
	}

	.myform-card {
		width: 90%;
		border-radius: 1.5rem;
		box-shadow: 0 25px 50px -12px rgba(244, 114, 182, 0.25);
		padding: 2.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.myform-form {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.myform-titulo {
		font-size: 2.25rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.myform-description {
		font-size: 1.125rem;
		margin-bottom: 2rem;
		text-align: justify;
		max-width: 800px;
	}
	.btn-submit {
		width: 100%;
		max-width: 400px;
		color: white;
		font-weight: 800;
		font-size: 1.125rem;
		padding: 1rem 2rem;
		border-radius: 1rem;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.btn-submit:hover:not(:disabled) {
		transform: translateY(-2px);
		filter: brightness(110%);
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.btn-submit:active:not(:disabled) {
		transform: translateY(0);
	}

	.btn-submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-action {
		flex: 1;
		color: white;
		font-weight: 700;
		padding: 0.75rem 1.5rem;
		border-radius: 0.75rem;
		transition: all 0.2s;
		text-align: center;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.btn-action:hover {
		transform: scale(1.02);
		filter: brightness(110%);
	}
</style>
