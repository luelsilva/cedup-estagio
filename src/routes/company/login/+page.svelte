<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { apiFetch, setAuthTokens, checkAuth } from '$lib/api';
	import { user } from '$lib/stores/auth';

	let fullName = $state('');
	let email = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let showNameField = $state(false);

	onMount(async () => {
		// Preservar o parâmetro returnTo no localStorage
		const returnTo = $page.url.searchParams.get('returnTo');
		if (returnTo) {
			localStorage.setItem('returnTo', returnTo);
		}

		// Se já estiver logado, redireciona
		const isAuthenticated = await checkAuth();
		if (isAuthenticated) {
			const savedReturnTo = localStorage.getItem('returnTo');
			if (savedReturnTo) {
				localStorage.removeItem('returnTo');
				goto(savedReturnTo);
			} else if ($user?.roles === 'company') {
				goto('/company/view');
			} else {
				goto('/');
			}
		}
	});

	function validateEmail(email: string) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	async function handleProceed() {
		if (!email) {
			error = 'Por favor, preencha o e-mail.';
			return;
		}

		if (!validateEmail(email)) {
			error = 'Por favor, insira um e-mail válido.';
			return;
		}

		// Passo 2: Se já pedimos o nome, validar e registrar/logar via rota específica
		if (showNameField) {
			if (!fullName) {
				error = 'Por favor, preencha o nome completo.';
				return;
			}
			const nameTerms = fullName.trim().split(/\s+/);
			if (nameTerms.length < 2) {
				error = 'Por favor, insira o nome completo do responsável.';
				return;
			}

			performLoginOrRegister();
			return;
		}

		// Passo 1: Tentar login direto apenas com o email (assumindo senha = email)
		isLoading = true;
		error = '';

		try {
			const response = await apiFetch('/auth/login', {
				method: 'POST',
				body: JSON.stringify({
					email,
					password: email // Senha padrão é o próprio e-mail neste fluxo
				})
			});

			if (response.ok) {
				const data = await response.json();
				handleAuthSuccess(data);
			} else {
				// Se falhar o login, assume que é um novo cadastro ou precisa confirmar dados
				// Então mostra o campo de nome
				showNameField = true;
				error = ''; // Limpa erro de login para não confundir
				isLoading = false;
			}
		} catch (err) {
			console.error('Erro ao tentar login inicial:', err);
			// Em caso de erro de rede, tenta mostrar o campo de nome para forçar o fluxo de registro que é mais robusto
			showNameField = true;
			isLoading = false;
		}
	}

	async function performLoginOrRegister() {
		error = '';
		isLoading = true;

		try {
			const response = await apiFetch('/auth/login-or-register-company', {
				method: 'POST',
				body: JSON.stringify({
					email,
					full_name: fullName,
					password: email
				})
			});

			const data = await response.json();

			if (response.ok) {
				handleAuthSuccess(data);
			} else {
				error = data.error || 'Não foi possível realizar o acesso.';
				isLoading = false;
			}
		} catch (err) {
			console.error('[COMPANY LOGIN] Erro:', err);
			error = 'Erro de conexão. Tente novamente.';
			isLoading = false;
		}
	}

	function handleAuthSuccess(data: any) {
		if (data.accessToken && data.refreshToken) {
			setAuthTokens(data.accessToken, data.refreshToken);
			if (data.user) {
				user.set(data.user);
			}

			const savedReturnTo = localStorage.getItem('returnTo');
			if (savedReturnTo) {
				localStorage.removeItem('returnTo');
				goto(savedReturnTo);
			} else {
				goto('/company/view'); // Redireciona para a view da empresa
			}
		} else {
			isLoading = false;
			error = 'Erro inesperado na autenticação.';
		}
	}
</script>

<svelte:head>
	<title>Acesso Empresa | Cedup</title>
</svelte:head>

<div class="step-container" in:fade={{ duration: 400 }}>
	<div class="glass-card" in:fly={{ y: 20, duration: 600, delay: 100 }}>
		<!-- Header Section -->
		<header class="page-header">
			<div class="header-content">
				<div class="logo-wrapper">
					<img src="/brazao_sc_217x233.png" alt="Brasão SC" class="state-logo" />
				</div>
				<div class="title-wrapper">
					<h1 class="state-title">ESTADO DE SANTA CATARINA</h1>
					<h2 class="state-subtitle">Secretaria de Estado da Educação</h2>
				</div>
			</div>

			<div class="document-info">
				<hr class="divider" />
				<h3 class="doc-title">TERMO DE COMPROMISSO DE ESTÁGIO - TCE OBRIGATÓRIO</h3>
				<p class="doc-description">
					O Termo de Compromisso tem por objetivo a realização de estágio de estudantes, do Ensino
					Médio e suas modalidades, Educação Profissional Técnica de Nível Médio, da educação
					especial e dos anos finais do ensino fundamental, na modalidade profissional da educação
					de jovens e adultos das escolas da rede pública estadual de ensino, nos termos da Lei nº
					11.788/2008 e Portaria SED Nº 124 de 21/01/2020.
				</p>
				<div class="school-tag">
					<strong>Escola:</strong> CEDUP – CENTRO DE EDUCAÇÃO PROFISSIONAL DARIO GERALDO SALLES
				</div>
			</div>
		</header>

		<div class="step-form">
			<div class="inputs-group">
				{#if showNameField}
					<div class="input-field" in:fly={{ y: -10, duration: 300 }}>
						<label for="fullName">Nome Completo do Responsável</label>
						<input
							type="text"
							id="fullName"
							bind:value={fullName}
							placeholder="Digite seu nome completo"
							disabled={isLoading}
							required
						/>
					</div>
				{/if}

				<div class="input-field">
					<label for="email">E-mail Corporativo</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						placeholder="Digite seu e-mail"
						disabled={isLoading || showNameField}
						required
					/>
				</div>
			</div>

			{#if error}
				<div class="error-box" transition:fade>
					{error}
				</div>
			{/if}

			<button type="button" class="submit-button" onclick={handleProceed} disabled={isLoading}>
				{isLoading ? 'Processando...' : showNameField ? 'Cadastrar e Entrar' : 'Continuar'}
			</button>
		</div>
	</div>
</div>

<style>
	.step-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: calc(100vh - 80px);
		padding: 2rem;
		background: linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%);
	}

	.glass-card {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		width: 100%;
		max-width: 800px;
		padding: 3rem;
		border-radius: 2rem;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 2rem;
		margin-bottom: 1.5rem;
	}

	.state-logo {
		width: 100px;
		height: auto;
		filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
	}

	.title-wrapper {
		display: flex;
		flex-direction: column;
	}

	.state-title {
		font-size: 1.5rem;
		font-weight: 800;
		color: #1a365d;
		letter-spacing: -0.025em;
		margin: 0;
	}

	.state-subtitle {
		font-size: 1rem;
		font-weight: 500;
		color: #4a5568;
		margin-top: 0.25rem;
	}

	.divider {
		border: none;
		height: 2px;
		background: linear-gradient(to right, #3182ce, transparent);
		margin: 1.25rem 0;
	}

	.doc-title {
		font-size: 1.1rem;
		font-weight: 700;
		color: #2d3748;
		margin-bottom: 0.75rem;
		text-align: center;
	}

	.doc-description {
		font-size: 0.85rem;
		line-height: 1.6;
		color: #4a5568;
		text-align: justify;
		margin-bottom: 1.25rem;
		padding: 0 0.5rem;
	}

	.school-tag {
		background: #ebf8ff;
		border-left: 4px solid #3182ce;
		padding: 0.6rem 0.8rem;
		border-radius: 0.5rem;
		color: #2c5282;
		font-size: 0.85rem;
	}

	.step-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 500px;
		margin: 0 auto;
	}

	.inputs-group {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		background: #f8fafc;
		padding: 2rem;
		border-radius: 1.5rem;
		border: 1px solid #e2e8f0;
	}

	.input-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.input-field label {
		font-size: 0.875rem;
		font-weight: 700;
		color: #4a5568;
		margin-left: 0.25rem;
	}

	.input-field input {
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		border: 1px solid #cbd5e0;
		font-size: 1rem;
		color: #2d3748;
		outline: none;
		transition: all 0.2s;
	}

	.input-field input:focus {
		border-color: #3182ce;
		box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
	}

	.error-box {
		padding: 1rem;
		background-color: #fff5f5;
		border: 1px solid #feb2b2;
		color: #c53030;
		border-radius: 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
		text-align: center;
	}

	.submit-button {
		background: #3182ce;
		color: white;
		font-weight: 700;
		font-size: 1rem;
		padding: 1.125rem;
		border-radius: 1rem;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 4px 6px rgba(49, 130, 206, 0.3);
	}

	.submit-button:hover:not(:disabled) {
		background: #2b6cb0;
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(49, 130, 206, 0.4);
	}

	.submit-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.glass-card {
			padding: 2rem 1.5rem;
		}
		.header-content {
			flex-direction: column;
			text-align: center;
			gap: 1rem;
		}
	}
</style>
