<script lang="ts">
    import '../app.css';
    const { children } = $props();
</script>

<div class="min-w-[100vw] min-h-screen bg-[#2B2A2C]">
    {@render children()}
</div>