<script lang="ts">
	import { onMount } from 'svelte';
	import { user } from '$lib/stores/auth';
	import { apiFetch, checkAuth } from '$lib/api';
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';

	interface Internship {
		id: string;
		userId: string;
		studentRegistration: number;
		studentName: string;
		courseSigla: string;
		companyName: string;
		companyCnpj: string | null;
		startDate: string;
		endDate: string;
		printDate: string | null;
		jsonData: any;
		createdAt: string;
		updatedAt: string;
	}

	let internships: Internship[] = [];
	let isLoading = true;
	let error: string | null = null;
	let totalRecords = 0;
	let selectedInternship: Internship | null = null;
	let isDeleting = false;
	let isDeletingId: string | null = null;

	// Filtros e Paginação (Server-side)
	let searchTerm = '';
	let pageSize = 25;
	let currentPage = 1;
	let searchTimeout: NodeJS.Timeout;

	async function fetchInternships() {
		if (isLoading && internships.length > 0) return; // Evita múltiplas chamadas simultâneas se já houver dados

		isLoading = true;
		try {
			const query = new URLSearchParams({
				page: String(currentPage),
				limit: String(pageSize),
				search: searchTerm
			});

			const response = await apiFetch(`/internships?${query.toString()}`);
			if (response.ok) {
				const result = await response.json();

				if (result.data && Array.isArray(result.data)) {
					internships = result.data;
					totalRecords = result.total;
				} else {
					internships = result;
					totalRecords = result.length;
				}
			} else {
				error = 'Erro ao carregar estágios do servidor.';
			}
		} catch (e) {
			error = 'Houve um problema de conexão com o servidor.';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		let unsubscribe: () => void;

		checkAuth().then(async (isAuthenticated) => {
			if (!isAuthenticated) {
				goto('/auth/login');
				return;
			}

			// Proteção por Role: Apenas teacher, admin e sudo podem ver estagiários
			unsubscribe = user.subscribe((u) => {
				if (u && u.roles) {
					if (!['teacher', 'admin', 'sudo'].includes(u.roles)) {
						goto('/'); // Redireciona usuários não autorizados para a home
					}
				}
			});

			await fetchInternships();
		});

		return () => {
			if (unsubscribe) unsubscribe();
		};
	});

	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			currentPage = 1;
			fetchInternships();
		}, 500);
	}

	function handlePageSizeChange() {
		currentPage = 1;
		fetchInternships();
	}

	function formatDate(dateStr: string) {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleDateString('pt-BR');
	}

	$: totalPages = Math.ceil(totalRecords / pageSize);

	function changePage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
			fetchInternships(); // Chamada explícita ao mudar de página
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Tem certeza que deseja excluir este contrato de estágio?')) return;

		isDeleting = true;
		isDeletingId = id;
		try {
			const response = await apiFetch(`/internships/${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				// Remove da lista local e atualiza contador
				internships = internships.filter((item) => item.id !== id);
				totalRecords--;

				// Se a página ficou vazia e não é a primeira, volta uma
				if (internships.length === 0 && currentPage > 1) {
					currentPage--;
					fetchInternships();
				}
			} else {
				alert('Erro ao excluir o estágio.');
			}
		} catch (e) {
			alert('Erro de conexão ao tentar excluir.');
		} finally {
			isDeleting = false;
			isDeletingId = null;
		}
	}

	function viewDetails(item: Internship) {
		selectedInternship = item;
	}

	function closeDetails() {
		selectedInternship = null;
	}
</script>

<svelte:head>
	<title>Cedup - Lista de Estagiários</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 p-4 md:p-8">
	<div class="mx-auto max-w-7xl space-y-6">
		<!-- Header Section -->
		<header
			class="flex flex-col justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:flex-row md:items-center"
		>
			<div>
				<h1 class="text-2xl font-black tracking-tight text-slate-800">
					CEDUP - Lista de Estagiários
				</h1>
				<p class="text-sm font-medium text-slate-500">
					Gerenciamento e consulta de contratos de estágio
				</p>
			</div>

			<div class="flex items-center gap-3">
				<div class="relative flex-1 md:w-80">
					<input
						type="text"
						placeholder="Buscar por matrícula, nome ou empresa..."
						class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-10 text-sm transition-all outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
						bind:value={searchTerm}
						oninput={handleSearch}
					/>
					<svg
						class="absolute top-2.5 left-3 h-4 w-4 text-slate-400"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</div>

				<select
					bind:value={pageSize}
					onchange={handlePageSizeChange}
					class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
				>
					<option value={10}>10 por pág.</option>
					<option value={25}>25 por pág.</option>
					<option value={50}>50 por pág.</option>
					<option value={100}>100 por pág.</option>
				</select>
			</div>
		</header>

		<!-- Main Content -->
		<main
			class="relative min-h-[400px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl"
		>
			{#if isLoading && internships.length === 0}
				<div class="flex flex-col items-center justify-center space-y-4 p-20">
					<div
						class="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"
					></div>
					<p class="animate-pulse font-bold text-slate-500">Carregando dados do servidor...</p>
				</div>
			{:else if error}
				<div class="space-y-4 p-20 text-center">
					<div class="text-5xl text-red-500">⚠️</div>
					<p class="font-semibold text-slate-700">{error}</p>
					<button
						class="rounded-lg bg-indigo-600 px-6 py-2 text-white transition hover:bg-indigo-700"
						onclick={() => window.location.reload()}>Tentar novamente</button
					>
				</div>
			{:else}
				<!-- Overlay de loading para trocas de página -->
				{#if isLoading}
					<div
						class="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px]"
						transition:fade={{ duration: 200 }}
					>
						<div
							class="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent"
						></div>
					</div>
				{/if}

				<div class="overflow-x-auto">
					<table class="w-full border-collapse text-left">
						<thead>
							<tr class="border-b border-slate-100 bg-slate-50">
								<th class="px-6 py-4 text-xs font-black tracking-wider text-slate-500 uppercase"
									>Matrícula</th
								>
								<th class="px-6 py-4 text-xs font-black tracking-wider text-slate-500 uppercase"
									>Nome Aluno</th
								>
								<th class="px-6 py-4 text-xs font-black tracking-wider text-slate-500 uppercase"
									>Curso</th
								>
								<th class="px-6 py-4 text-xs font-black tracking-wider text-slate-500 uppercase"
									>Empresa</th
								>
								<th class="px-6 py-4 text-xs font-black tracking-wider text-slate-500 uppercase"
									>Início</th
								>
								<th class="px-6 py-4 text-xs font-black tracking-wider text-slate-500 uppercase"
									>Final</th
								>
								<th class="px-6 py-4 text-xs font-black tracking-wider text-slate-500 uppercase"
									>Criado em</th
								>
								<th
									class="px-6 py-4 text-center text-xs font-black tracking-wider text-slate-500 uppercase"
									>Ações</th
								>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-50">
							{#each internships as item, i (item.id)}
								<tr
									in:fly={{ x: -10, duration: 300, delay: i * 20 }}
									class="group cursor-pointer transition-colors hover:bg-indigo-50/30"
									onclick={() => viewDetails(item)}
									onkeydown={(e) => e.key === 'Enter' && viewDetails(item)}
									role="button"
									tabindex="0"
								>
									<td class="px-6 py-4 font-mono text-sm text-slate-600"
										>{item.studentRegistration || '-'}</td
									>
									<td class="px-6 py-4">
										<div class="flex items-center gap-2">
											<div class="text-sm font-bold text-slate-800">{item.studentName}</div>
											{#if $user && $user.roles === 'company' && item.userId !== $user.id}
												<span
													class="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-black tracking-wider text-indigo-500 uppercase"
												>
													Recebido
												</span>
											{/if}
										</div>
									</td>
									<td class="px-6 py-4">
										<span
											class="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-black text-indigo-700 transition-colors group-hover:bg-indigo-200"
										>
											{item.courseSigla}
										</span>
									</td>
									<td class="px-6 py-4 text-sm font-medium text-slate-700">{item.companyName}</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-slate-500"
										>{formatDate(item.startDate)}</td
									>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-slate-500"
										>{formatDate(item.endDate)}</td
									>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-slate-400"
										>{new Date(item.createdAt).toLocaleString('pt-BR', {
											day: '2-digit',
											month: '2-digit',
											year: 'numeric',
											hour: '2-digit',
											minute: '2-digit'
										})}</td
									>
									<td class="px-6 py-4 text-center">
										<div class="flex items-center justify-center gap-2">
											<a
												href="/gotce?id={item.id}"
												target="_blank"
												class="group/btn rounded-lg p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
												title="Editar"
												onclick={(e) => e.stopPropagation()}
											>
												<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
													/>
												</svg>
											</a>

											<button
												class="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-30"
												title="Excluir"
												disabled={isDeleting && isDeletingId === item.id}
												onclick={(e) => {
													e.stopPropagation();
													handleDelete(item.id);
												}}
											>
												{#if isDeleting && isDeletingId === item.id}
													<div
														class="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent"
													></div>
												{:else}
													<svg
														class="h-5 w-5"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
												{/if}
											</button>
										</div>
									</td>
								</tr>
							{/each}

							{#if internships.length === 0}
								<tr>
									<td colspan="8" class="px-6 py-20 text-center">
										<div class="flex flex-col items-center space-y-2">
											<svg
												class="h-12 w-12 text-slate-200"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="1.5"
													d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											<p class="font-medium text-slate-400 italic">Nenhum estagiário encontrado.</p>
										</div>
									</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>

				<!-- Footer / Pagination -->
				<footer
					class="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 md:flex-row"
				>
					<div class="text-xs font-bold text-slate-500">
						Mostrando {internships.length} de {totalRecords} registros encontrados
					</div>

					{#if totalPages > 1}
						<div class="flex items-center gap-2">
							<button
								class="rounded-lg border border-transparent p-2 font-bold transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm disabled:opacity-30"
								disabled={currentPage === 1}
								onclick={() => changePage(currentPage - 1)}
							>
								<svg class="inline h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 19l-7-7 7-7"
									/></svg
								>
								Anterior
							</button>

							<div class="flex items-center gap-1">
								<span
									class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm"
								>
									Página {currentPage} de {totalPages}
								</span>
							</div>

							<button
								class="rounded-lg border border-transparent p-2 font-bold transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm disabled:opacity-30"
								disabled={currentPage === totalPages}
								onclick={() => changePage(currentPage + 1)}
							>
								Próxima
								<svg class="inline h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									/></svg
								>
							</button>
						</div>
					{/if}
				</footer>
			{/if}
		</main>
	</div>
</div>

{#if selectedInternship}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
		onclick={closeDetails}
		onkeydown={(e) => e.key === 'Escape' && closeDetails()}
		role="button"
		tabindex="-1"
		aria-label="Fechar modal"
	>
		<div
			class="world-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
			transition:fly={{ y: 20, duration: 300 }}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="presentation"
		>
			<header
				class="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-8 py-6"
			>
				<div>
					<h2 class="text-xl font-black text-slate-800">Detalhes do Estágio</h2>
					<p class="text-sm font-medium text-slate-500">Informações completas do contrato</p>
				</div>
				<button
					class="rounded-full p-2 transition-colors hover:bg-slate-200"
					onclick={closeDetails}
					title="Fechar"
					aria-label="Fechar Detalhes"
				>
					<svg class="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</header>

			<div class="max-h-[70vh] space-y-6 overflow-y-auto p-8">
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div class="space-y-1">
						<span class="block text-xs font-black tracking-wider text-slate-400 uppercase"
							>Aluno</span
						>
						<p class="font-bold text-slate-800">{selectedInternship.studentName}</p>
						<p class="font-mono text-sm text-slate-500">
							Matrícula: {selectedInternship.studentRegistration}
						</p>
					</div>
					<div class="space-y-1">
						<span class="block text-xs font-black tracking-wider text-slate-400 uppercase"
							>Curso</span
						>
						<p class="font-bold text-slate-800">{selectedInternship.courseSigla}</p>
					</div>
					<div class="space-y-1">
						<span class="block text-xs font-black tracking-wider text-slate-400 uppercase"
							>Empresa</span
						>
						<p class="font-bold text-slate-800">{selectedInternship.companyName}</p>
						{#if selectedInternship.companyCnpj}
							<p class="font-mono text-sm text-slate-500">
								CNPJ: {selectedInternship.companyCnpj}
							</p>
						{/if}
					</div>
					<div class="space-y-1">
						<span class="block text-xs font-black tracking-wider text-slate-400 uppercase"
							>Período</span
						>
						<p class="font-bold text-slate-800">
							{formatDate(selectedInternship.startDate)} até {formatDate(
								selectedInternship.endDate
							)}
						</p>
					</div>
				</div>

				{#if selectedInternship.jsonData}
					<div class="space-y-3">
						<span class="block text-xs font-black tracking-wider text-slate-400 uppercase"
							>Dados Adicionais (JSON)</span
						>
						<div class="overflow-x-auto rounded-2xl bg-slate-900 p-4">
							<pre class="font-mono text-xs text-indigo-300">{JSON.stringify(
									selectedInternship.jsonData,
									null,
									2
								)}</pre>
						</div>
					</div>
				{/if}

				<div
					class="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400"
				>
					<span>Criado em: {new Date(selectedInternship.createdAt).toLocaleString()}</span>
					<span>ID: {selectedInternship.id}</span>
				</div>
			</div>

			<footer class="grid grid-cols-1 gap-4 border-t border-slate-100 bg-slate-50 px-8 py-6">
				<div class="flex items-end">
					<button
						class="w-full rounded-xl bg-indigo-600 py-3 font-black text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700"
						onclick={closeDetails}
					>
						Fechar Detalhes
					</button>
				</div>
			</footer>
		</div>
	</div>
{/if}

<style>
	/* Estilos Premium */
	:global(body) {
		font-family:
			'Inter',
			system-ui,
			-apple-system,
			sans-serif;
	}

	table tr {
		transition: transform 0.2s;
	}

	table tr:hover {
		transform: scale(1.002);
	}
</style>
