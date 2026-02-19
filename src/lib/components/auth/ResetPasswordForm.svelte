<script lang="ts">
	import { API_URL } from '$lib/constants';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';

	interface Props {
		email: string;
	}

	let { email }: Props = $props();

	let code = $state(['', '', '', '', '', '']);
	let newPassword = $state('');
	let showPassword = $state(false);
	let isLoading = $state(false);
	let error = $state('');
	let message = $state('');

	async function handleResetPassword(e: Event) {
		e.preventDefault();
		const fullCode = code.join('');
		if (fullCode.length !== 6 || !newPassword) return;

		isLoading = true;
		error = '';
		message = '';

		try {
			const response = await fetch(`${API_URL}/auth/reset-password`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, code: fullCode, newPassword })
			});

			const data = await response.json();

			if (response.ok) {
				message = data.message || 'Senha alterada com sucesso!';
				setTimeout(() => goto('/auth/login'), 3000);
			} else {
				if (data.details && Array.isArray(data.details)) {
					error = data.details[0];
				} else {
					error = data.error || data.message || 'Falha ao redefinir senha.';
				}
			}
		} catch (err: any) {
			error = 'Erro de conexão. Tente novamente.';
		} finally {
			isLoading = false;
		}
	}

	function handleInput(e: Event, index: number) {
		const target = e.target as HTMLInputElement;
		const value = target.value;
		if (!/^\d*$/.test(value)) {
			code[index] = '';
			return;
		}
		if (value.length > 1) code[index] = value.slice(-1);

		if (value && index < 5) {
			const next = target.nextElementSibling as HTMLInputElement;
			if (next) next.focus();
		}
	}

	function handleKeyDown(e: KeyboardEvent, index: number) {
		if (e.key === 'Backspace' && !code[index] && index > 0) {
			const currentTarget = e.currentTarget as HTMLInputElement;
			const prev = currentTarget.previousElementSibling as HTMLInputElement;
			if (prev) prev.focus();
		}
	}

	function handlePaste(e: ClipboardEvent) {
		e.preventDefault();
		const pastedData = e.clipboardData?.getData('text') || '';
		const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');

		digits.forEach((digit, i) => {
			if (i < 6) code[i] = digit;
		});
	}
</script>

<div class="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-10 shadow-2xl" in:fade>
	<div class="mb-10 text-center">
		<h1 class="text-3xl font-black tracking-tight text-blue-900">Nova Senha</h1>
		<p class="mt-2 font-medium text-gray-500">
			Insira o código enviado para <br /><span class="font-bold text-blue-600">{email}</span>
		</p>
	</div>

	{#if message}
		<div
			class="animate-pulse rounded-2xl border border-green-100 bg-green-50 p-6 text-center text-green-700"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="mx-auto mb-4 h-12 w-12"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
			<p class="text-lg font-black">{message}</p>
			<p class="mt-2 text-sm opacity-80">Redirecionando para o login...</p>
		</div>
	{:else}
		<form onsubmit={handleResetPassword} class="space-y-8">
			<!-- Código OTP -->
			<div class="space-y-4">
				<label for="otp-0" class="ml-1 block text-sm font-bold text-gray-700"
					>Código de Verificação</label
				>
				<div class="flex justify-between gap-3">
					{#each code as digit, i}
						<input
							id={i === 0 ? 'otp-0' : undefined}
							type="text"
							maxlength="1"
							bind:value={code[i]}
							oninput={(e) => handleInput(e, i)}
							onkeydown={(e) => handleKeyDown(e, i)}
							onpaste={handlePaste}
							aria-label={`Dígito ${i + 1} do código de verificação`}
							class="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 text-center text-2xl font-black text-blue-900 transition-all outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
						/>
					{/each}
				</div>
			</div>

			<!-- Nova Senha -->
			<div class="space-y-4">
				<label for="new-password" class="ml-1 block text-sm font-bold text-gray-700"
					>Defina sua nova senha</label
				>
				<div class="relative">
					<input
						id="new-password"
						type={showPassword ? 'text' : 'password'}
						bind:value={newPassword}
						required
						class="block w-full rounded-2xl border border-gray-200 px-4 py-4 pr-12 text-gray-900 shadow-sm transition-all outline-none focus:border-blue-500 focus:ring-blue-500"
						placeholder="••••••••"
					/>
					<button
						type="button"
						onclick={() => (showPassword = !showPassword)}
						class="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 transition-colors hover:text-blue-600"
					>
						{#if showPassword}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
								/>
							</svg>
						{:else}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.046m4.596-4.596A10.05 10.05 0 0112 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 3l18 18"
								/>
							</svg>
						{/if}
					</button>
				</div>
			</div>

			{#if error}
				<div
					class="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600"
				>
					{error}
				</div>
			{/if}

			<button
				type="submit"
				disabled={isLoading || code.some((d) => d === '') || !newPassword}
				class="w-full rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
			>
				{isLoading ? 'Redefinindo...' : 'Alterar Senha'}
			</button>
		</form>
	{/if}

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
			Cancelar
		</a>
	</div>
</div>
