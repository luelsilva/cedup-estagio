<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiFetch } from '$lib/api';
	import { user } from '$lib/stores/auth';
	import { fade } from 'svelte/transition';

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let success = $state('');
	let isLoading = $state(false);
	let showPassword = $state(false);

	async function handleUpdatePassword(e: Event) {
		e.preventDefault();
		error = '';
		success = '';

		if (newPassword !== confirmPassword) {
			error = 'As senhas não coincidem.';
			return;
		}

		if (newPassword.length < 6) {
			error = 'A nova senha deve ter pelo menos 6 caracteres.';
			return;
		}

		isLoading = true;

		try {
			const res = await apiFetch('/auth/change-password', {
				method: 'POST',
				body: JSON.stringify({ currentPassword, newPassword })
			});

			const data = await res.json();

			if (res.ok) {
				success = 'Senha atualizada com sucesso!';
				// Atualizar flag no store local
				user.update((u) => (u ? { ...u, mustChangePassword: false } : null));

				setTimeout(() => {
					goto('/');
				}, 2000);
			} else {
				if (data.details && Array.isArray(data.details)) {
					error = data.details[0];
				} else {
					error = data.error || 'Erro ao atualizar senha.';
				}
			}
		} catch (err) {
			error = 'Erro de conexão com a API.';
			console.error(err);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-10 shadow-2xl" in:fade>
	<div class="mb-10 text-center">
		<h1 class="text-3xl font-black tracking-tight text-blue-900">Definir Nova Senha</h1>
		<p class="mt-2 font-medium text-gray-500">Você precisa atualizar sua senha para continuar.</p>
	</div>

	<form onsubmit={handleUpdatePassword} class="space-y-6">
		<div>
			<label for="currentPassword" class="mb-2 ml-1 block text-sm font-bold text-gray-700"
				>Senha Atual</label
			>
			<input
				type={showPassword ? 'text' : 'password'}
				id="currentPassword"
				required
				bind:value={currentPassword}
				class="block w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-900 shadow-sm transition-all outline-none focus:border-blue-500 focus:ring-blue-500"
				placeholder="Sua senha temporária"
			/>
		</div>

		<div>
			<label for="newPassword" class="mb-2 ml-1 block text-sm font-bold text-gray-700"
				>Nova Senha</label
			>
			<input
				type={showPassword ? 'text' : 'password'}
				id="newPassword"
				required
				bind:value={newPassword}
				class="block w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-900 shadow-sm transition-all outline-none focus:border-blue-500 focus:ring-blue-500"
				placeholder="Mínimo 6 caracteres"
			/>
		</div>

		<div>
			<label for="confirmPassword" class="mb-2 ml-1 block text-sm font-bold text-gray-700"
				>Confirmar Nova Senha</label
			>
			<input
				type={showPassword ? 'text' : 'password'}
				id="confirmPassword"
				required
				bind:value={confirmPassword}
				class="block w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-900 shadow-sm transition-all outline-none focus:border-blue-500 focus:ring-blue-500"
				placeholder="Repita a nova senha"
			/>
		</div>

		<!-- Show Password Toggle -->
		<div class="flex items-center space-x-2">
			<input
				type="checkbox"
				id="showPassword"
				bind:checked={showPassword}
				class="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-600"
			/>
			<label
				for="showPassword"
				class="cursor-pointer text-sm font-medium text-gray-600 select-none"
			>
				Mostrar senhas
			</label>
		</div>

		{#if error}
			<div class="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
				{error}
			</div>
		{/if}

		{#if success}
			<div
				class="rounded-xl border border-green-100 bg-green-50 p-4 text-sm font-medium text-green-600"
			>
				{success}
			</div>
		{/if}

		<button
			type="submit"
			disabled={isLoading}
			class="w-full rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
		>
			{isLoading ? 'Atualizando...' : 'Atualizar e Continuar'}
		</button>
	</form>
</div>
