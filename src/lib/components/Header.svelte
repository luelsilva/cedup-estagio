<script lang="ts">
	import { onMount } from 'svelte';
	import { user } from '$lib/stores/auth';
	import { logout, checkAuth } from '$lib/api';

	let checkingAuth = true;
	let showDropdown = false;

	function toggleDropdown() {
		showDropdown = !showDropdown;
	}

	async function handleLogout() {
		showDropdown = false;
		await logout();
	}

	function getInitials(name: string) {
		if (!name) return 'U';
		return name
			.split(' ')
			.map((n) => n[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	function handleClickOutside(event: MouseEvent) {
		if (showDropdown && !(event.target as Element).closest('.user-menu')) {
			showDropdown = false;
		}
	}

	onMount(() => {
		window.addEventListener('click', handleClickOutside);

		// Verificar e restaurar autenticação de forma assíncrona
		checkAuth().then(() => {
			checkingAuth = false;
		});

		return () => {
			window.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<header class="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
	<div class="container mx-auto flex h-20 items-center justify-between px-6">
		<!-- Logo Section -->
		<a href="/" class="flex items-center space-x-4">
			<img src="/logo-cedup.png" alt="Logo Cedup" class="w-16 object-contain" />
			<div class="flex flex-col">
				<h1 class="text-2xl leading-none font-bold tracking-tight text-blue-900">
					CEDUP Joinville
				</h1>
				<span class="text-xs font-medium tracking-wide text-gray-500 uppercase"
					>Centro de Educação Profissional</span
				>
			</div>
		</a>

		<!-- Navigation Menu -->
		<nav>
			<ul class="flex items-center space-x-6">
				<li>
					<a
						href="https://www.getmais.com.br/"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-600 transition-all hover:bg-blue-50 hover:text-blue-700"
					>
						<img src="/logo-getmais.svg" alt="GetMais" class="h-5 w-auto" />
						<span
							class="bg-gradient-to-r from-[#9333ea] to-[#f97316] bg-clip-text font-bold text-transparent"
							>GetMais</span
						>
						<span class="font-medium">Vagas de Estágio e Emprego</span>
					</a>
				</li>

				{#if !checkingAuth}
					{#if $user}
						<li class="user-menu relative">
							<button
								on:click|stopPropagation={toggleDropdown}
								class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-sm transition-transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
							>
								{getInitials($user.name || '')}
							</button>

							{#if showDropdown}
								<div
									class="ring-opacity-5 animate-in fade-in zoom-in-95 absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white py-2 shadow-xl ring-1 ring-black duration-200 focus:outline-none"
								>
									<div class="border-b border-gray-100 px-4 py-3">
										<p class="truncate text-sm font-semibold text-gray-900">{$user.name}</p>
										<p class="truncate text-xs text-gray-500">{$user.email}</p>
										{#if $user.roles !== undefined}
											<span
												class="mt-2 inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
											>
												{$user.roles}
											</span>
										{/if}
									</div>

									<div class="py-1">
										{#if $user?.roles === 'company'}
											<a
												href="/company/view"
												class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
												on:click={() => (showDropdown = false)}
											>
												📂 Meus Estágios
											</a>
										{/if}
										{#if $user?.roles && ['teacher', 'admin', 'sudo'].includes($user.roles)}
											<a
												href="/estagio"
												class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
												on:click={() => (showDropdown = false)}
											>
												🏫 Estágio
											</a>
										{/if}
										{#if $user?.roles && ['teacher', 'admin', 'sudo'].includes($user.roles)}
											<a
												href="/internships"
												class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
												on:click={() => (showDropdown = false)}
											>
												📝 Estagiários
											</a>
										{/if}

										{#if $user.roles === 'admin' || $user.roles === 'sudo'}
											<div class="my-1 border-t border-gray-50">
												<p
													class="px-4 pt-3 pb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase"
												>
													Administração
												</p>

												{#if $user.roles === 'sudo'}
													<a
														href="/admin/menu"
														class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
														on:click={() => (showDropdown = false)}
													>
														📑 Menu
													</a>
													<a
														href="/admin/form-models"
														class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
														on:click={() => (showDropdown = false)}
													>
														📋 Formulários
													</a>
												{/if}

												<a
													href="/admin/courses"
													class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
													on:click={() => (showDropdown = false)}
												>
													🎓 Cursos
												</a>
												<a
													href="/admin/teachers"
													class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
													on:click={() => (showDropdown = false)}
												>
													👨‍🏫 Professores
												</a>

												{#if $user.roles === 'sudo'}
													<a
														href="/admin/users"
														class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
														on:click={() => (showDropdown = false)}
													>
														👥 Usuários
													</a>
													<a
														href="/sudo/db"
														class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
														on:click={() => (showDropdown = false)}
													>
														🗄️ Banco de Dados
													</a>
												{/if}
											</div>
										{/if}

										<div class="my-1 border-t border-gray-100 pb-1">
											<a
												href="/private/profile"
												class="mt-1 flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
												on:click={() => (showDropdown = false)}
											>
												👤 Meu Perfil
											</a>
											<button
												on:click={handleLogout}
												class="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
											>
												🚪 Sair
											</button>
										</div>
									</div>
								</div>
							{/if}
						</li>
					{:else}
						<li>
							<a
								href="/auth/login"
								class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-sm transition-all hover:scale-105 hover:bg-blue-700 active:scale-95"
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
										d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
									/>
								</svg>
								<span>Fazer Login</span>
							</a>
						</li>
					{/if}
				{/if}
			</ul>
		</nav>
	</div>
</header>
