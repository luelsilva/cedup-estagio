<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { apiFetch } from '$lib/api';
	import { user as currentUserStore } from '$lib/stores/auth';

	// State
	let users = $state([]);
	let loading = $state(true);
	let errorMessage = $state('');
	let searchQuery = $state('');
	let selectedRole = $state('all');
	let isModalOpen = $state(false);
	let editingUser = $state(null);

	// Form State
	let userForm = $state({
		email: '',
		password: '',
		fullName: '',
		roles: 'generic',
		isVerified: false,
		mustChangePassword: false
	});

	const rolesOptions = ['generic', 'student', 'company', 'teacher', 'admin', 'sudo'];

	// Fetch Users
	async function loadUsers() {
		try {
			loading = true;
			const res = await apiFetch('/usuarios');
			if (res.ok) {
				users = await res.json();
			} else {
				throw new Error('Falha ao carregar usuários');
			}
		} catch (error) {
			errorMessage = error.message;
		} finally {
			loading = false;
		}
	}

	// Modal Operations
	function openCreateModal() {
		editingUser = null;
		userForm = {
			email: '',
			password: '',
			fullName: '',
			roles: 'generic',
			isVerified: false,
			mustChangePassword: true // Por padrão, forçar troca de senha para novos usuários
		};
		isModalOpen = true;
	}

	function openEditModal(userObj) {
		editingUser = userObj;
		userForm = {
			email: userObj.email,
			password: '', // Inicialmente vazio; se preenchido, resetará a senha
			fullName: userObj.fullName || '',
			roles: userObj.roles,
			isVerified: !!userObj.isVerified,
			mustChangePassword: !!userObj.mustChangePassword
		};
		isModalOpen = true;
	}

	async function saveUser() {
		try {
			const method = editingUser ? 'PUT' : 'POST';
			const url = editingUser ? `/usuarios/${editingUser.id}` : '/usuarios';

			const res = await apiFetch(url, {
				method,
				body: JSON.stringify(userForm)
			});

			if (res.ok) {
				await loadUsers();
				isModalOpen = false;
			} else {
				const data = await res.json();
				alert(data.error || 'Erro ao salvar usuário');
			}
		} catch (error) {
			console.error(error);
			alert('Erro ao salvar usuário');
		}
	}

	async function deleteUser(id) {
		if (!confirm('Tem certeza que deseja remover este usuário?')) return;
		try {
			const res = await apiFetch(`/usuarios/${id}`, { method: 'DELETE' });
			if (res.ok) {
				await loadUsers();
			} else {
				const data = await res.json();
				alert(data.error || 'Erro ao deletar usuário');
			}
		} catch (error) {
			console.error(error);
		}
	}

	// Computed
	let filteredUsers = $derived(
		users.filter((u) => {
			const matchesSearch =
				!searchQuery ||
				u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				u.email.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesRole = selectedRole === 'all' || u.roles === selectedRole;

			return matchesSearch && matchesRole;
		})
	);

	import { goto } from '$app/navigation';

	onMount(() => {
		const unsubscribe = currentUserStore.subscribe((u) => {
			if (u && u.roles !== 'sudo') {
				goto('/');
			}
		});

		loadUsers();
		return unsubscribe;
	});
</script>

<div class="p-6">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-800">Gerenciar Usuários</h1>
			<p class="text-sm text-gray-500">Administre permissões e contas do sistema</p>
		</div>

		<div class="flex gap-4">
			<div class="flex gap-2">
				<div class="relative">
					<input
						type="text"
						placeholder="Buscar por nome ou email..."
						bind:value={searchQuery}
						class="w-64 rounded-xl border py-2 pr-4 pl-10 text-sm outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="absolute top-3 left-3 h-4 w-4 text-gray-400"
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
					bind:value={selectedRole}
					class="rounded-xl border bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">Todos os Cargos</option>
					{#each rolesOptions as opt}
						<option value={opt}>{opt.toUpperCase()}</option>
					{/each}
				</select>
			</div>
			<button
				onclick={openCreateModal}
				class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95"
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
				Novo Usuário
			</button>
		</div>
	</div>

	{#if loading && users.length === 0}
		<div class="flex items-center justify-center py-20">
			<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
		</div>
	{:else if errorMessage}
		<div class="rounded-lg border border-red-100 bg-red-50 p-4 text-red-600">
			{errorMessage}
		</div>
	{:else}
		<div class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
			<table class="w-full text-left">
				<thead class="border-b border-gray-100 bg-gray-50">
					<tr>
						<th class="p-4 font-semibold text-gray-600">Usuário</th>
						<th class="p-4 font-semibold text-gray-600">Cargo</th>
						<th class="p-4 font-semibold text-gray-600">Status</th>
						<th class="p-4 text-right font-semibold text-gray-600">Ações</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredUsers as u}
						<tr class="border-b border-gray-50 transition-colors hover:bg-gray-50">
							<td class="p-4">
								<div class="font-medium text-gray-900">{u.fullName || 'Sem Nome'}</div>
								<div class="text-xs text-gray-500">{u.email}</div>
							</td>
							<td class="p-4">
								<span
									class="rounded-md px-2 py-1 text-xs font-bold tracking-wider uppercase
                                    {u.roles === 'sudo'
										? 'bg-purple-100 text-purple-700'
										: u.roles === 'admin'
											? 'bg-blue-100 text-blue-700'
											: 'bg-gray-100 text-gray-600'}"
								>
									{u.roles}
								</span>
							</td>
							<td class="p-4">
								<div class="flex flex-col gap-1">
									<span
										class="flex items-center gap-1 text-xs {u.isVerified
											? 'text-green-600'
											: 'text-amber-600'}"
									>
										<span
											class="h-2 w-2 rounded-full {u.isVerified ? 'bg-green-600' : 'bg-amber-600'}"
										></span>
										{u.isVerified ? 'Verificado' : 'Pendente'}
									</span>
									{#if u.mustChangePassword}
										<span
											class="w-fit rounded border border-red-100 bg-red-50 px-1.5 py-0.5 text-[10px] text-red-600"
										>
											⚠️Troca de Senha
										</span>
									{/if}
								</div>
							</td>
							<td class="flex justify-end gap-2 p-4 text-right">
								<button
									onclick={() => openEditModal(u)}
									class="rounded bg-blue-50 p-1 text-blue-600 hover:text-blue-800"
									title="Editar Usuário"
								>
									✏️
								</button>
								<button
									onclick={() => deleteUser(u.id)}
									class="rounded bg-red-50 p-1 text-red-600 hover:text-red-800"
									title="Excluir Usuário"
								>
									🗑️
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>

			{#if filteredUsers.length === 0}
				<div class="p-8 text-center text-gray-500">Nenhum usuário encontrado.</div>
			{/if}
		</div>
	{/if}

	<!-- Modal Usuário -->
	{#if isModalOpen}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			transition:fade
		>
			<div class="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
				<div class="border-b border-gray-100 p-6">
					<h2 class="text-xl font-bold text-gray-800">{editingUser ? 'Editar' : 'Novo'} Usuário</h2>
					{#if editingUser}
						<p class="mt-1 text-xs text-gray-500">{editingUser.email}</p>
					{/if}
				</div>

				<div class="space-y-4 p-6">
					{#if !editingUser}
						<div>
							<label for="userEmail" class="mb-1 block text-sm font-semibold">Email</label>
							<input
								id="userEmail"
								type="email"
								bind:value={userForm.email}
								class="w-full rounded-lg border p-2 outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="usuario@email.com"
							/>
						</div>
						<div>
							<label for="userPassword" class="mb-1 block text-sm font-semibold"
								>Senha Inicial</label
							>
							<input
								id="userPassword"
								type="password"
								bind:value={userForm.password}
								autocomplete="new-password"
								class="w-full rounded-lg border p-2 outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="••••••••"
							/>
						</div>
					{:else}
						<div>
							<label for="resetPassword" class="mb-1 block text-sm font-semibold text-blue-700"
								>Redefinir Senha (Opcional)</label
							>
							<input
								id="resetPassword"
								type="password"
								bind:value={userForm.password}
								autocomplete="new-password"
								class="w-full rounded-lg border-2 border-blue-100 p-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
								placeholder="Deixe em branco para manter a atual"
							/>
							<p class="mt-1 text-[10px] text-gray-500 italic">
								Ao preencher, a senha do usuário será alterada imediatamente.
							</p>
						</div>
					{/if}

					<div>
						<label for="userFullName" class="mb-1 block text-sm font-semibold">Nome Completo</label>
						<input
							id="userFullName"
							type="text"
							bind:value={userForm.fullName}
							class="w-full rounded-lg border p-2 outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="userRoles" class="mb-1 block text-sm font-semibold">Cargo (Role)</label>
						<select
							id="userRoles"
							bind:value={userForm.roles}
							class="w-full rounded-lg border p-2 font-mono text-sm uppercase outline-none focus:ring-2 focus:ring-blue-500"
						>
							{#each rolesOptions as opt}
								<option value={opt}>{opt}</option>
							{/each}
						</select>
					</div>

					<div class="space-y-3 pt-2">
						<label
							class="group flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
						>
							<input
								type="checkbox"
								bind:checked={userForm.isVerified}
								class="h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 transition-all"
							/>
							<div class="flex flex-col">
								<span class="text-sm font-semibold text-gray-700">Email Verificado</span>
								<span class="text-[10px] text-gray-500"
									>Permite login sem verificação de código</span
								>
							</div>
						</label>

						<label
							class="group flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
						>
							<input
								type="checkbox"
								bind:checked={userForm.mustChangePassword}
								class="h-5 w-5 cursor-pointer rounded border-gray-300 text-red-600 transition-all"
							/>
							<div class="flex flex-col">
								<span class="text-sm font-semibold text-red-700">Forçar Troca de Senha</span>
								<span class="text-[10px] text-gray-500"
									>Usuário deverá trocar a senha no próximo acesso</span
								>
							</div>
						</label>
					</div>
				</div>

				<div class="flex justify-end gap-3 bg-gray-50 p-6">
					<button
						onclick={() => (isModalOpen = false)}
						class="rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-200"
						>Cancelar</button
					>
					<button
						onclick={saveUser}
						class="rounded-lg bg-blue-600 px-6 py-2 font-bold text-white shadow-md transition-all hover:bg-blue-700"
					>
						{editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
