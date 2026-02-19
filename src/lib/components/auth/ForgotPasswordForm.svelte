<script lang="ts">
	import { API_URL } from '$lib/constants';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';

	let email = $state('');
	let isLoading = $state(false);
	let error = $state('');

	async function handleSubmit() {
		if (!email) return;
		isLoading = true;
		error = '';

		try {
			const response = await fetch(`${API_URL}/auth/forgot-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			const data = await response.json();

			if (response.ok) {
				// Redireciona para a página de reset já com o e-mail preenchido
				goto(`/auth/reset-password?email=${encodeURIComponent(email)}`);
			} else {
				error = data.error || 'Ocorreu um erro ao processar sua solicitação.';
			}
		} catch (err) {
			error = 'Erro de conexão. Tente novamente mais tarde.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-10 shadow-2xl" in:fade>
	<div class="mb-8 text-center">
		<div
			class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-8 w-8"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
				/>
			</svg>
		</div>
		<h1 class="text-2xl font-black text-gray-900">Recuperar Senha</h1>
		<p class="mt-2 text-sm font-medium text-gray-500">Insira seu e-mail para receber um código.</p>
	</div>

	<form onsubmit={handleSubmit} class="space-y-6">
		<div>
			<label for="email" class="mb-2 ml-1 block text-sm font-bold text-gray-700">E-mail</label>
			<input
				type="email"
				id="email"
				required
				bind:value={email}
				class="block w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-900 shadow-sm transition-all outline-none focus:border-blue-500 focus:ring-blue-500"
				placeholder="seu@email.com"
			/>
		</div>

		{#if error}
			<div class="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
				{error}
			</div>
		{/if}

		<button
			type="submit"
			disabled={isLoading}
			class="w-full rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
		>
			{isLoading ? 'Enviando...' : 'Enviar Código'}
		</button>
	</form>

	<div class="mt-10 border-t border-gray-50 pt-6 text-center tracking-widest uppercase">
		<a
			href="/auth/login"
			class="flex items-center justify-center gap-2 text-xs font-black text-gray-400 transition-colors hover:text-blue-600"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 19l-7-7m0 0l7-7m-7 7h18"
				/>
			</svg>
			Voltar para o Login
		</a>
	</div>
</div>
