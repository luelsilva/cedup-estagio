<script lang="ts">
	import { onMount } from 'svelte';
	import { apiFetch } from '$lib/api';
	import { fade, fly } from 'svelte/transition';

	let stats = $state<any>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	async function loadStats() {
		isLoading = true;
		error = null;
		try {
			const response = await apiFetch('/db/stats');
			if (response.ok) {
				stats = await response.json();
			} else {
				error = 'Erro ao carregar estatísticas do banco de dados';
			}
		} catch (e) {
			error = 'Erro de conexão com o servidor';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadStats();
	});
</script>

<svelte:head>
	<title>Sudo - Database Manager</title>
</svelte:head>

<div class="mx-auto max-w-6xl p-8">
	<header class="mb-12 flex items-end justify-between">
		<div>
			<h1 class="mb-2 text-4xl font-bold tracking-tight text-white">
				Database <span class="text-orange-500">Manager</span>
			</h1>
			<p class="text-gray-400">Gerenciamento avançado e monitoramento do banco de dados.</p>
		</div>
		<button
			onclick={loadStats}
			class="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium transition-all hover:bg-gray-700"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path
					d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
				/><path d="M3 21v-5h5" /></svg
			>
			Atualizar
		</button>
	</header>

	{#if isLoading}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="h-32 animate-pulse rounded-2xl border border-gray-800 bg-gray-900/50"></div>
			{/each}
		</div>
	{:else if error}
		<div
			class="flex items-center gap-4 rounded-2xl border border-red-900/50 bg-red-900/20 p-6 text-red-400"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line
					x1="12"
					y1="16"
					x2="12.01"
					y2="16"
				/></svg
			>
			<span>{error}</span>
		</div>
	{:else if stats}
		<div class="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<div
				class="group rounded-2xl border border-gray-800 bg-gray-900 p-6 transition-colors hover:border-orange-500/50"
			>
				<p class="mb-1 text-sm font-semibold tracking-wider text-gray-400 uppercase">Tabelas</p>
				<p
					class="text-3xl font-bold text-white uppercase transition-colors group-hover:text-orange-500"
				>
					{stats.totalTables}
				</p>
			</div>
			<div
				class="group rounded-2xl border border-gray-800 bg-gray-900 p-6 transition-colors hover:border-blue-500/50"
			>
				<p class="mb-1 text-sm font-semibold tracking-wider text-gray-400 uppercase">Engine</p>
				<p class="text-2xl font-bold text-white transition-colors">PostgreSQL</p>
			</div>
			<div
				class="group rounded-2xl border border-gray-800 bg-gray-900 p-6 transition-colors hover:border-green-500/50"
			>
				<p class="mb-1 text-sm font-semibold tracking-wider text-gray-400 uppercase">Status</p>
				<p class="flex items-center gap-2 text-2xl font-bold text-green-500">
					<span class="h-3 w-3 animate-ping rounded-full bg-green-500"></span>
					Online
				</p>
			</div>
			<div
				class="group rounded-2xl border border-gray-800 bg-gray-900 p-6 transition-colors hover:border-purple-500/50"
			>
				<p class="mb-1 text-sm font-semibold tracking-wider text-gray-400 uppercase">Provedor</p>
				<p class="text-2xl font-bold text-white">Supabase</p>
			</div>
		</div>

		<div class="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900" in:fade>
			<div class="flex items-center justify-between border-b border-gray-800 p-6">
				<h2 class="text-xl font-bold text-white">Tabelas e Registros</h2>
				<span class="text-xs text-gray-500"
					>Dados coletados em {new Date(stats.timestamp).toLocaleString()}</span
				>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-left">
					<thead>
						<tr class="bg-gray-950/50">
							<th class="px-6 py-4 text-xs font-semibold tracking-wider text-gray-400 uppercase"
								>Nome da Tabela</th
							>
							<th class="px-6 py-4 text-xs font-semibold tracking-wider text-gray-400 uppercase"
								>Total de Registros</th
							>
							<th
								class="px-6 py-4 text-right text-xs font-semibold tracking-wider text-gray-400 uppercase"
								>Ações</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each stats.tables as table, i}
							<tr class="transition-colors hover:bg-gray-800/50" in:fly={{ y: 20, delay: i * 30 }}>
								<td class="px-6 py-4">
									<div class="flex items-center gap-3">
										<div
											class="flex h-8 w-8 items-center justify-center rounded bg-gray-800 text-gray-400"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-4 w-4"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg
											>
										</div>
										<span class="font-medium text-gray-200">{table.name}</span>
									</div>
								</td>
								<td class="px-6 py-4">
									<span class="rounded-full bg-gray-800 px-3 py-1 font-mono text-sm text-gray-300">
										{table.count.toLocaleString()}
									</span>
								</td>
								<td class="px-6 py-4 text-right">
									<button
										class="text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
										>Ver Dados</button
									>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<div class="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
		<div
			class="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-600/10 to-transparent p-8"
		>
			<h3 class="mb-4 flex items-center gap-3 text-xl font-bold text-white">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 text-orange-500"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline
						points="7 10 12 15 17 10"
					/><line x1="12" y1="15" x2="12" y2="3" /></svg
				>
				Backup & Restore
			</h3>
			<p class="mb-6 leading-relaxed text-gray-400">
				Utilize os scripts CLI dedicados para operações robustas de backup e restauração. Os dumps
				são salvos automaticamente em <code class="text-orange-400">urso/z_MyAnotes/backups</code>.
			</p>
			<div class="space-y-3">
				<div class="group flex cursor-help items-center justify-between rounded-lg bg-black/40 p-3">
					<code class="text-xs text-gray-300">npm run db:backup</code>
					<span
						class="text-[10px] text-gray-500 opacity-0 transition-opacity group-hover:opacity-100"
						>Full SQL Dump</span
					>
				</div>
				<div class="group flex cursor-help items-center justify-between rounded-lg bg-black/40 p-3">
					<code class="text-xs text-gray-300">npm run db:export:csv</code>
					<span
						class="text-[10px] text-gray-500 opacity-0 transition-opacity group-hover:opacity-100"
						>Export to CSV</span
					>
				</div>
			</div>
		</div>

		<div
			class="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 to-transparent p-8"
		>
			<h3 class="mb-4 flex items-center gap-3 text-xl font-bold text-white">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 text-blue-500"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path
						d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
					/></svg
				>
				Drizzle Kit
			</h3>
			<p class="mb-6 leading-relaxed text-gray-400">
				Gerencie migrações e visualize schemas usando as ferramentas integradas do Drizzle ORM.
			</p>
			<div class="space-y-3">
				<div class="group flex cursor-help items-center justify-between rounded-lg bg-black/40 p-3">
					<code class="text-xs text-gray-300">npm run db:push</code>
					<span
						class="text-[10px] text-gray-500 opacity-0 transition-opacity group-hover:opacity-100"
						>Push changes to DB</span
					>
				</div>
				<div class="group flex cursor-help items-center justify-between rounded-lg bg-black/40 p-3">
					<code class="text-xs text-gray-300">npm run db:studio</code>
					<span
						class="text-[10px] text-gray-500 opacity-0 transition-opacity group-hover:opacity-100"
						>Open GUI Explorer</span
					>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(body) {
		background-color: #030712;
	}
</style>
