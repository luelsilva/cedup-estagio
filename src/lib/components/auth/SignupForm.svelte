<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { API_URL } from '$lib/constants';
	import { fade } from 'svelte/transition';

	// Propriedades (Svelte 5 Runes)
	let {
		role = $bindable(''),
		title = 'Criar Conta',
		description = $bindable('Cadastre-se para acessar o portal')
	} = $props();

	let backLink = $state('/');

	// onMount removido conforme solicitação de retirar localStorage

	let fullName = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let success = $state('');
	let isLoading = $state(false);
	let showPassword = $state(false);

	async function handleSignup(e: Event) {
		e.preventDefault();
		isLoading = true;
		error = '';
		success = '';

		if (password !== confirmPassword) {
			error = 'As senhas não coincidem.';
			isLoading = false;
			return;
		}

		try {
			const response = await fetch(`${API_URL}/auth/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email,
					password,
					full_name: fullName,
					role: role || undefined
				})
			});

			const data = await response.json();

			if (response.ok) {
				const registeredEmail = email;
				success = data.message || 'Cadastro realizado com sucesso!';

				// Limpar formulário
				fullName = '';
				email = '';
				password = '';
				confirmPassword = '';

				setTimeout(() => {
					// Redirecionamento padrão após cadastro
					goto(`/auth/verify-email?email=${encodeURIComponent(registeredEmail)}`);
				}, 3000);
			} else {
				error = data.details?.[0] || data.error || data.message || 'Falha no cadastro.';
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
		<h1 class="text-3xl font-black tracking-tight text-blue-900">{title}</h1>
		<p class="mt-2 font-medium text-gray-500">{description}</p>
	</div>

	<form onsubmit={handleSignup} class="space-y-5">
		<div>
			<label for="fullName" class="mb-2 ml-1 block text-sm font-bold text-gray-700"
				>Nome Completo</label
			>
			<input
				type="text"
				id="fullName"
				required
				bind:value={fullName}
				class="block w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-900 shadow-sm transition-all outline-none focus:border-blue-500 focus:ring-blue-500"
				placeholder="Seu nome completo"
			/>
		</div>

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
			<label for="password" class="mb-2 ml-1 block text-sm font-bold text-gray-700">Senha</label>
			<input
				type={showPassword ? 'text' : 'password'}
				id="password"
				required
				bind:value={password}
				class="block w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-900 shadow-sm transition-all outline-none focus:border-blue-500 focus:ring-blue-500"
				placeholder="••••••••"
			/>
		</div>

		<div>
			<label for="confirmPassword" class="mb-2 ml-1 block text-sm font-bold text-gray-700"
				>Confirmar Senha</label
			>
			<input
				type={showPassword ? 'text' : 'password'}
				id="confirmPassword"
				required
				bind:value={confirmPassword}
				class="block w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-900 shadow-sm transition-all outline-none focus:border-blue-500 focus:ring-blue-500"
				placeholder="••••••••"
			/>
		</div>

		<div class="flex items-center px-1">
			<label class="group flex cursor-pointer items-center gap-2">
				<input
					type="checkbox"
					bind:checked={showPassword}
					class="h-4 w-4 rounded border-gray-300 text-blue-600 transition-all focus:ring-blue-500"
				/>
				<span class="text-sm font-medium text-gray-600 transition-colors group-hover:text-gray-900"
					>Mostrar senhas</span
				>
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
			{isLoading ? 'Cadastrando...' : 'Criar Conta'}
		</button>
	</form>

	<div class="mt-8 border-t border-gray-50 pt-6 text-center">
		<p class="text-sm font-medium text-gray-500">
			Já tem uma conta?
			<a href="/auth/login" class="font-bold text-blue-600 transition-colors hover:text-blue-500"
				>Faça login</a
			>
		</p>

		<div class="mt-4 border-t border-gray-50 pt-4 tracking-widest uppercase">
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
</div>
