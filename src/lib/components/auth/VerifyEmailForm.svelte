<script lang="ts">
	import { API_URL } from '$lib/constants';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';

	interface Props {
		email: string;
	}

	let { email }: Props = $props();

	let code = $state(['', '', '', '', '', '']);
	let isLoading = $state(false);
	let isResending = $state(false);
	let error = $state('');
	let message = $state('');
	let resendMessage = $state('');

	async function handleVerify(e: Event) {
		e.preventDefault();
		const fullCode = code.join('');
		if (fullCode.length !== 6) return;

		isLoading = true;
		error = '';
		message = '';

		try {
			const response = await fetch(`${API_URL}/auth/verify-otp`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, code: fullCode })
			});

			const data = await response.json();

			if (response.ok) {
				message = data.message || 'Conta verificada com sucesso!';
				setTimeout(() => goto('/auth/login'), 3000);
			} else {
				if (data.details && Array.isArray(data.details)) {
					error = data.details[0];
				} else {
					error = data.error || 'Falha ao verificar conta.';
				}
			}
		} catch (err: any) {
			error = 'Erro de conexão. Tente novamente.';
		} finally {
			isLoading = false;
		}
	}

	async function handleResend() {
		if (isResending) return;
		isResending = true;
		error = '';
		resendMessage = '';

		try {
			const response = await fetch(`${API_URL}/auth/resend-otp`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			const data = await response.json();
			if (response.ok) {
				resendMessage = 'Novo código enviado!';
				setTimeout(() => (resendMessage = ''), 5000);
			} else {
				error = data.error || 'Falha ao reenviar código.';
			}
		} catch (err) {
			error = 'Erro ao conectar. Tente novamente.';
		} finally {
			isResending = false;
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
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		</div>
		<h1 class="text-3xl font-black tracking-tight text-blue-900">Ativar Conta</h1>
		<p class="mt-2 font-medium text-gray-500">
			Insira o código de 6 dígitos enviado para <br /><span class="font-bold text-blue-600"
				>{email}</span
			>
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
		<form onsubmit={handleVerify} class="space-y-8">
			<div class="space-y-4">
				<div class="flex justify-between gap-3">
					{#each code as digit, i}
						<input
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

			{#if error}
				<div
					class="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600"
				>
					{error}
				</div>
			{/if}

			{#if resendMessage}
				<div
					class="rounded-xl border border-blue-100 bg-blue-50 p-4 text-center text-sm font-medium text-blue-600"
				>
					{resendMessage}
				</div>
			{/if}

			<button
				type="submit"
				disabled={isLoading || code.some((d) => d === '')}
				class="w-full rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
			>
				{isLoading ? 'Verificando...' : 'Ativar Conta'}
			</button>

			<div class="text-center">
				<button
					type="button"
					onclick={handleResend}
					disabled={isResending}
					class="text-sm font-bold text-blue-600 hover:text-blue-500 disabled:opacity-50"
				>
					{isResending ? 'Enviando...' : 'Reenviar código'}
				</button>
			</div>
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
			Voltar para o Login
		</a>
	</div>
</div>
