<script lang="ts">
	import { onMount } from 'svelte';
	import { apiFetch } from '$lib/api';
	import { fade, slide } from 'svelte/transition';

	interface Teacher {
		id: string;
		registration: string;
		name: string;
		email: string;
	}

	let teachers = $state<Teacher[]>([]);
	let loading = $state(true);
	let errorMessage = $state('');
	let successMessage = $state('');

	// Modal
	let showModal = $state(false);
	let editingTeacher = $state<Teacher | null>(null);
	let form = $state({
		registration: '',
		name: '',
		email: ''
	});

	onMount(loadTeachers);

	async function loadTeachers() {
		loading = true;
		try {
			const res = await apiFetch('/teachers');
			if (res.ok) {
				teachers = await res.json();
			} else {
				errorMessage = 'Erro ao carregar professores';
			}
		} catch (e) {
			errorMessage = 'Erro de conexão';
		} finally {
			loading = false;
		}
	}

	function openModal(teacher?: Teacher) {
		if (teacher) {
			editingTeacher = teacher;
			form = {
				registration: teacher.registration,
				name: teacher.name,
				email: teacher.email
			};
		} else {
			editingTeacher = null;
			form = { registration: '', name: '', email: '' };
		}
		showModal = true;
	}

	async function save() {
		const method = editingTeacher ? 'PATCH' : 'POST';
		const url = editingTeacher ? `/teachers/${editingTeacher.id}` : '/teachers';

		try {
			const res = await apiFetch(url, {
				method,
				body: JSON.stringify(form)
			});
			if (res.ok) {
				showModal = false;
				successMessage = editingTeacher ? 'Professor atualizado!' : 'Professor criado!';
				loadTeachers();
				setTimeout(() => (successMessage = ''), 3000);
			} else {
				const err = await res.json();
				alert(err.error || 'Erro ao salvar');
			}
		} catch (e) {
			alert('Erro de conexão');
		}
	}

	async function remove(teacher: Teacher) {
		if (!confirm(`Excluir professor ${teacher.name}?`)) return;
		try {
			const res = await apiFetch(`/teachers/${teacher.id}`, { method: 'DELETE' });
			if (res.ok) {
				successMessage = 'Professor removido!';
				loadTeachers();
				setTimeout(() => (successMessage = ''), 3000);
			} else {
				alert('Erro ao excluir');
			}
		} catch (e) {
			alert('Erro de conexão');
		}
	}
</script>

<svelte:head>
	<title>Gerenciar Professores | Admin</title>
</svelte:head>

<div class="mx-auto max-w-6xl p-6">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Gerenciamento de Professores</h1>
			<p class="text-sm text-gray-500">Adicione, edite ou remova professores da instituição.</p>
		</div>
		<button
			onclick={() => openModal()}
			class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
					clip-rule="evenodd"
				/>
			</svg>
			Novo Professor
		</button>
	</div>

	<!-- Messages -->
	{#if successMessage}
		<div
			transition:fade
			class="mb-6 flex items-center justify-between rounded border-l-4 border-green-500 bg-green-50 p-4 text-green-700 shadow-sm"
		>
			<span class="font-medium">{successMessage}</span>
			<button onclick={() => (successMessage = '')} class="text-green-600 hover:text-green-800"
				>&times;</button
			>
		</div>
	{/if}

	{#if loading}
		<div class="space-y-4">
			{#each Array(3) as _}
				<div class="h-16 animate-pulse rounded-lg bg-gray-100"></div>
			{/each}
		</div>
	{:else}
		<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
			<table class="w-full text-left">
				<thead
					class="border-b border-gray-200 bg-gray-50 text-xs font-semibold tracking-wider text-gray-600 uppercase"
				>
					<tr>
						<th class="w-32 p-4">Matrícula</th>
						<th class="p-4">Nome</th>
						<th class="p-4">Email</th>
						<th class="w-32 p-4 text-right">Ações</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each teachers as teacher (teacher.id)}
						<tr class="transition-colors hover:bg-gray-50">
							<td class="p-4 font-mono text-sm font-medium text-gray-900">{teacher.registration}</td
							>
							<td class="p-4 text-gray-700">{teacher.name}</td>
							<td class="p-4 text-sm text-gray-500">{teacher.email}</td>
							<td class="flex justify-end gap-2 p-4 text-right">
								<button
									onclick={() => openModal(teacher)}
									class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
									title="Editar"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
										/>
									</svg>
								</button>
								<button
									onclick={() => remove(teacher)}
									class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
									title="Excluir"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
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
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if teachers.length === 0}
				<div class="flex flex-col items-center gap-2 p-12 text-center text-gray-500 italic">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-10 w-10 text-gray-300"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
						/>
					</svg>
					Nenhum professor cadastrado.
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Modal -->
{#if showModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" transition:fade>
		<div
			class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
			transition:slide={{ duration: 200, axis: 'y' }}
		>
			<h2 class="mb-4 text-xl font-bold text-gray-800">
				{editingTeacher ? 'Editar Professor' : 'Novo Professor'}
			</h2>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					save();
				}}
				class="space-y-4"
			>
				<div>
					<label for="teacherRegistration" class="mb-1 block text-sm font-medium text-gray-700"
						>Matrícula</label
					>
					<input
						id="teacherRegistration"
						type="text"
						bind:value={form.registration}
						class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						required
						placeholder="Ex: 123456"
					/>
				</div>

				<div>
					<label for="teacherName" class="mb-1 block text-sm font-medium text-gray-700"
						>Nome Completo</label
					>
					<input
						id="teacherName"
						type="text"
						bind:value={form.name}
						class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						required
						placeholder="Ex: João da Silva"
					/>
				</div>

				<div>
					<label for="teacherEmail" class="mb-1 block text-sm font-medium text-gray-700"
						>Email Institucional</label
					>
					<input
						id="teacherEmail"
						type="email"
						bind:value={form.email}
						class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						required
						placeholder="Ex: joao.silva@escola.com.br"
					/>
				</div>

				<div class="mt-6 flex justify-end gap-3 pt-2">
					<button
						type="button"
						onclick={() => (showModal = false)}
						class="rounded-lg px-4 py-2 font-medium text-gray-600 hover:bg-gray-100"
						>Cancelar</button
					>
					<button
						type="submit"
						class="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-blue-700"
						>Salvar</button
					>
				</div>
			</form>
		</div>
	</div>
{/if}
