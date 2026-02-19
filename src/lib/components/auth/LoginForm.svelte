<script lang="ts">
	import { goto } from '$app/navigation';
	import { API_URL } from '$lib/constants';
	import { user } from '$lib/stores/auth';
	import { apiFetch, setAuthTokens } from '$lib/api';
	import { fade } from 'svelte/transition';

	// Propriedades (Svelte 5 Runes)
	let email = $state('');
	let password = $state('');
	let rememberMe = $state(false);
	let error = $state('');
	let isLoading = $state(false);
	let showPassword = $state(false);
	let description = $state('Bem-vindo de volta!');
	let backLink = $state('/');

	async function handleLogin(e: Event) {
		e.preventDefault(); // IMPORTANTE: Impede o recarregamento da página e perda da URL
		isLoading = true;
		error = '';

		try {
			const response = await fetch(`${API_URL}/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, password, rememberMe })
			});

			const data = await response.json();

			if (response.ok) {
				if (data.accessToken && data.refreshToken) {
					setAuthTokens(data.accessToken, data.refreshToken);

					if (data.user) {
						user.set(data.user);

						if (data.user.mustChangePassword) {
							goto('/auth/change-password');
							return;
						}
					}

					goto('/');
				} else {
					error = 'Tokens não recebidos da API.';
				}
			} else {
				if (response.status === 403 && data.verified === false) {
					error = data.error || 'Por favor, ative sua conta antes de continuar.';
					setTimeout(() => {
						goto(`/auth/verify-email?email=${encodeURIComponent(data.email || email)}`);
					}, 2000);
					return;
				}

				error = data.details?.[0] || data.error || data.message || 'Falha no login.';
			}
		} catch (err) {
			error = 'Erro de conexão. Tente novamente.';
			console.error(err);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-10 shadow-2xl" in:fade>
	<div class="mb-10 text-center">
		<h1 class="text-3xl font-black tracking-tight text-blue-900">Login</h1>
		<p class="mt-2 font-medium text-gray-500">{description}</p>
	</div>

	<form onsubmit={handleLogin} class="space-y-6">
		<div>
			<label for="email" class="mb-2 ml-1 block text-sm font-bold text-gray-700">Email</label>
			<input
				type="email"
				id="email"
				required
				bind:value={email}
				class="block w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-900 shadow-sm transition-all outline-none focus:border-blue-500 focus:ring-blue-500"
				placeholder="seu@email.com"
			/>
		</div>

		<div>
			<div class="mb-2 ml-1 flex items-center justify-between">
				<label for="password" class="block text-sm font-bold text-gray-700">Senha</label>
				<a
					href="/auth/forgot-password"
					class="text-xs font-bold text-blue-600 transition-colors hover:text-blue-500"
				>
					Esqueci minha senha
				</a>
			</div>
			<input
				type={showPassword ? 'text' : 'password'}
				id="password"
				required
				bind:value={password}
				class="block w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-900 shadow-sm transition-all outline-none focus:border-blue-500 focus:ring-blue-500"
				placeholder="••••••••"
			/>
		</div>

		<div class="flex items-center justify-between px-1">
			<label class="group flex cursor-pointer items-center gap-2">
				<input
					type="checkbox"
					bind:checked={rememberMe}
					class="h-4 w-4 rounded border-gray-300 text-blue-600 transition-all focus:ring-blue-500"
				/>
				<span class="text-sm font-medium text-gray-600 transition-colors group-hover:text-gray-900"
					>Lembrar-me</span
				>
			</label>

			<label class="group flex cursor-pointer items-center gap-2">
				<input
					type="checkbox"
					bind:checked={showPassword}
					class="h-4 w-4 rounded border-gray-300 text-blue-600 transition-all focus:ring-blue-500"
				/>
				<span class="text-sm font-medium text-gray-600 transition-colors group-hover:text-gray-900"
					>Mostrar senha</span
				>
			</label>
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
			{isLoading ? 'Entrando...' : 'Entrar'}
		</button>
	</form>

	<div class="mt-10 border-t border-gray-50 pt-6 text-center tracking-widest uppercase">
		<a
			href={backLink}
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
			Voltar para o início
		</a>
	</div>
</div>
