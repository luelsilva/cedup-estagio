<script lang="ts">
	import { onMount } from 'svelte';
	import { user } from '$lib/stores/auth';
	import { apiFetch, checkAuth } from '$lib/api';
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';

	interface Internship {
		id: string;
		studentRegistration: number;
		studentName: string;
		courseSigla: string;
		companyName: string;
		companyCnpj: string | null;
		startDate: string;
		endDate: string;
		jsonData: any;
		createdAt: string;
		userId: string;
	}

	let internships: Internship[] = [];
	let isLoading = true;
	let error: string | null = null;
	let searchTerm = '';

	async function fetchSharedInternships() {
		isLoading = true;
		try {
			// A API já filtra por registros do dono OU compartilhados com o e-mail.
			// Como o usuário comum/company não tem a role 'teacher', ele só verá o que lhe pertence.
			const response = await apiFetch(`/internships?search=${searchTerm}`);
			if (response.ok) {
				const result = await response.json();
				// Se a API retornar o formato paginado { data, total }
				if (result.data) {
					internships = result.data;
				} else {
					internships = result;
				}
			} else {
				error = 'Erro ao carregar seus estágios.';
			}
		} catch (e) {
			error = 'Erro de conexão com o servidor.';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		checkAuth().then((isAuthenticated) => {
			if (!isAuthenticated) {
				goto('/company/login');
				return;
			}
			fetchSharedInternships();
		});
	});

	// Redirecionar se o usuário deslogar enquanto estiver nesta página
	$: if ($user === null && !isLoading) {
		goto('/company/login');
	}

	function formatDate(dateStr: string) {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleDateString('pt-BR');
	}

	function handleSearch() {
		fetchSharedInternships();
	}
</script>

<svelte:head>
	<title>Área da Empresa - Meus Estágios</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 p-4 md:p-8">
	<div class="mx-auto max-w-6xl space-y-6">
		<!-- Header de Boas Vindas -->
		<header class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
			<div>
				<h1 class="text-3xl font-black tracking-tight text-slate-800">
					Olá, {$user?.name?.split(' ')[0] || 'Empresa'}!
				</h1>
				<p class="font-medium text-slate-500">Estágios vinculados à sua conta</p>
			</div>

			<div class="flex items-center gap-3">
				<div class="relative">
					<input
						type="text"
						placeholder="Buscar estagiário..."
						class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 md:w-64"
						bind:value={searchTerm}
						oninput={handleSearch}
					/>
					<svg
						class="absolute top-3 left-3 h-4 w-4 text-slate-400"
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
				<a
					href="/gotce"
					class="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
				>
					Novo TCE
				</a>
			</div>
		</header>

		{#if isLoading && internships.length === 0}
			<div
				class="flex h-64 flex-col items-center justify-center space-y-4 rounded-3xl bg-white shadow-sm"
			>
				<div
					class="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
				></div>
				<p class="font-bold text-slate-400">Buscando contratos...</p>
			</div>
		{:else if error}
			<div class="rounded-3xl bg-red-50 p-12 text-center text-red-600">
				<p class="font-bold">{error}</p>
				<button class="mt-4 underline" onclick={fetchSharedInternships}>Tentar novamente</button>
			</div>
		{:else if internships.length === 0}
			<div
				class="flex flex-col items-center justify-center space-y-6 rounded-3xl border border-dashed border-slate-200 bg-white p-16 shadow-sm"
			>
				<div class="rounded-full bg-slate-50 p-6">
					<svg
						class="h-12 w-12 text-slate-300"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
				</div>
				<div class="text-center">
					<p class="text-xl font-bold text-slate-700">Nenhum contrato encontrado</p>
					<p class="text-slate-500">Você ainda não possui estágios vinculados ao seu e-mail.</p>
				</div>
				<a href="/gotce" class="font-bold text-blue-600 hover:underline">
					Começar primeiro contrato →
				</a>
			</div>
		{:else}
			<!-- Grid de Cards Estilo Moderno -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each internships as item, i}
					<div
						in:fly={{ y: 20, duration: 400, delay: i * 50 }}
						class="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
					>
						<div class="space-y-4">
							<div class="flex items-start justify-between">
								<div
									class="rounded-2xl bg-blue-50 px-3 py-1 text-[10px] font-black tracking-wider text-blue-600 uppercase"
								>
									{item.courseSigla}
								</div>
								{#if $user && $user.roles === 'company' && item.userId !== $user.id}
									<span
										class="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-indigo-500 uppercase"
									>
										Recebido
									</span>
								{/if}
							</div>

							<div>
								<h3
									class="text-lg font-black text-slate-800 transition-colors group-hover:text-blue-600"
								>
									{item.studentName}
								</h3>
								<p class="font-mono text-xs text-slate-400">MAT: {item.studentRegistration}</p>
							</div>

							<div class="flex items-center gap-2 text-sm text-slate-600">
								<svg
									class="h-4 w-4 text-slate-300"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 01-2-2V7a2 2 0 012-2H5a2 2 0 01-2 2v12a2 2 0 012 2z"
									/>
								</svg>
								<span>{formatDate(item.startDate)} — {formatDate(item.endDate)}</span>
							</div>
						</div>

						<div class="mt-6 flex items-center gap-3">
							<a
								href="/gotce?id={item.id}"
								class="flex-1 rounded-xl bg-slate-50 py-2.5 text-center text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
							>
								Ver Contrato
							</a>
							<button
								class="rounded-xl bg-slate-50 p-2.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
								title="Opções"
							>
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
									/>
								</svg>
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	:global(body) {
		background-color: #f8fafc;
	}
</style>
