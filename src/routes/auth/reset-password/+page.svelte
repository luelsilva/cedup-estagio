<script>
    import ResetPasswordForm from '$lib/components/auth/ResetPasswordForm.svelte';
    import { page } from '$app/stores';
    
    // Pegar o e-mail da URL (?email=...)
    $: email = $page.url.searchParams.get('email') || '';
</script>

<svelte:head>
    <title>Nova Senha | Cedup</title>
</svelte:head>

<div class="flex flex-1 w-full items-center justify-center px-4 py-12 bg-gray-50 min-h-[80vh]">
    <ResetPasswordForm {email} />
</div>
