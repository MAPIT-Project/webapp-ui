<script lang="ts">
	import { onMount } from "svelte";


    interface Props {
        name: string;
        organisationID: string;
        weight: number;
    }

    const {
        name,
        organisationID,
        weight
    }: Props = $props();

    onMount(() => {
        console.log('loaded marker');
    });
</script>

<style>
    /* Prevent scrollbars in info window */
    div {
        overflow: hidden;
        max-width: 220px;
    }

    h3 {
        margin-top: 0;
        margin-bottom: 8px;
    }

    p {
        margin: 5px 0;
    }

    /* Google Maps info window customization */
    :global(.gm-style-iw) {
        padding: 12px !important;
    }

    :global(.gm-style-iw-d) {
        overflow: hidden !important;
    }

    :global(.gm-style-iw-t) {
        overflow: visible !important;
    }
</style>

<div class="text-black">
    <h3>{name}</h3>
    <p><strong>ID:</strong> {organisationID}</p>
    <p><strong>Total Funding:</strong> €{weight.toLocaleString()}</p>
</div>