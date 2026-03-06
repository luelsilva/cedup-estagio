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

	interface Course {
		id: string;
		name: string;
		sigla: string;
		shortName: string;
		updatedAt: string;
		teachers?: Teacher[];
	}

	let courses = $state<Course[]>([]);
	let availableTeachers = $state<Teacher[]>([]); // New state for selection
	let loading = $state(true);
	let errorMessage = $state('');
	let successMessage = $state('');

	// Modal
	let showModal = $state(false);
	let editingCourse = $state<Course | null>(null);
	let form = $state({ name: '', sigla: '', shortName: '', teacherIds: [] as string[] });

	onMount(loadData);

	async function loadData() {
		loading = true;
		try {
			const [coursesRes, teachersRes] = await Promise.all([
				apiFetch('/courses'),
				apiFetch('/teachers')
			]);

			if (coursesRes.ok && teachersRes.ok) {
				courses = await coursesRes.json();
				availableTeachers = await teachersRes.json();
			} else {
				errorMessage = 'Erro ao carregar dados';
			}
		} catch (e) {
			errorMessage = 'Erro de conexão';
		} finally {
			loading = false;
		}
	}

	function openModal(course?: Course) {
		if (course) {
			editingCourse = course;
			form = {
				name: course.name,
				sigla: course.sigla,
				shortName: course.shortName,
				teacherIds: course.teachers ? course.teachers.map((t) => t.id) : []
			};
		} else {
			editingCourse = null;
			form = { name: '', sigla: '', shortName: '', teacherIds: [] };
		}
		showModal = true;
	}

	async function save() {
		const method = editingCourse ? 'PATCH' : 'POST';
		const url = editingCourse ? `/courses/${editingCourse.id}` : '/courses';

		try {
			const res = await apiFetch(url, {
				method,
				body: JSON.stringify(form)
			});
			if (res.ok) {
				showModal = false;
				successMessage = editingCourse ? 'Curso atualizado!' : 'Curso criado!';
				loadData();
				setTimeout(() => (successMessage = ''), 3000);
			} else {
				const err = await res.json();
				alert(err.error || 'Erro ao salvar');
			}
		} catch (e) {
			alert('Erro de conexão');
		}
	}

	async function remove(course: Course) {
		if (!confirm(`Excluir ${course.name}?`)) return;
		try {
			const res = await apiFetch(`/courses/${course.id}`, { method: 'DELETE' });
			if (res.ok) {
				successMessage = 'Curso removido!';
				loadData();
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
	<title>Gerenciar Cursos | Admin</title>
</svelte:head>

<div class="mx-auto max-w-6xl p-6">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Gerenciamento de Cursos</h1>
			<p class="text-sm text-gray-500">Adicione, edite ou remova cursos técnicos.</p>
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
			Novo Curso
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
						<th class="w-24 p-4">Sigla</th>
						<th class="p-4">Nome do Curso</th>
						<th class="w-32 p-4 text-right">Ações</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each courses as course (course.id)}
						<tr class="transition-colors hover:bg-gray-50">
							<td class="p-4 font-medium text-gray-500">{course.sigla}</td>
							<td class="p-4 font-medium text-gray-900">{course.name}</td>
							<td class="flex justify-end gap-2 p-4 text-right">
								<button
									onclick={() => openModal(course)}
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
									onclick={() => remove(course)}
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
			{#if courses.length === 0}
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
							d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
						/>
					</svg>
					Nenhum curso cadastrado.
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
				{editingCourse ? 'Editar Curso' : 'Novo Curso'}
			</h2>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					save();
				}}
				class="space-y-4"
			>
				<div class="grid grid-cols-3 gap-4">
					<div class="col-span-1">
						<label for="courseSigla" class="mb-1 block text-sm font-medium text-gray-700"
							>Sigla</label
						>
						<input
							id="courseSigla"
							type="text"
							bind:value={form.sigla}
							class="w-full rounded-lg border-gray-300 uppercase shadow-sm focus:border-blue-500 focus:ring-blue-500"
							required
							maxlength="10"
							placeholder="Ex: TDS"
						/>
					</div>
					<div class="col-span-2">
						<label for="courseShortName" class="mb-1 block text-sm font-medium text-gray-700"
							>Nome Curto</label
						>
						<input
							id="courseShortName"
							type="text"
							bind:value={form.shortName}
							class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							required
							maxlength="40"
							placeholder="Ex: Desenv. Sistemas"
						/>
					</div>
				</div>

				<div>
					<label for="courseName" class="mb-1 block text-sm font-medium text-gray-700"
						>Nome do Curso</label
					>
					<input
						id="courseName"
						type="text"
						bind:value={form.name}
						class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						required
						placeholder="Ex: Técnico em Informática"
					/>
				</div>

				<div>
					<span class="mb-1 block text-sm font-medium text-gray-700"
						>Professores Orientadores de Estágio</span
					>
					<div
						class="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-300 bg-gray-50 p-2"
					>
						{#if availableTeachers.length === 0}
							<p class="p-1 text-xs text-gray-500 italic">Nenhum professor cadastrado.</p>
						{:else}
							{#each availableTeachers as teacher (teacher.id)}
								<label class="flex cursor-pointer items-center gap-2 rounded p-1 hover:bg-white">
									<input
										type="checkbox"
										value={teacher.id}
										checked={form.teacherIds.includes(teacher.id)}
										onchange={(e) => {
											if (e.currentTarget.checked) {
												form.teacherIds = [...form.teacherIds, teacher.id];
											} else {
												form.teacherIds = form.teacherIds.filter((id) => id !== teacher.id);
											}
										}}
										class="rounded text-blue-600 focus:ring-blue-500"
									/>
									<span class="text-sm text-gray-700"
										>{teacher.name}
										<span class="text-xs text-gray-400">({teacher.registration})</span></span
									>
								</label>
							{/each}
						{/if}
					</div>
					<p class="mt-1 text-xs text-gray-500">
						Selecione os professores orientadores de estágio neste curso.
					</p>
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
