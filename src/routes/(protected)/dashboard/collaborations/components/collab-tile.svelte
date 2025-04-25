<script lang="ts">
    interface Props {
        title: string;
        description: string | null;
        collaboratorsCount?: number;
    }

    const { 
        title,
        description,
        collaboratorsCount = 1, // Default to 1 as the user creating it is already a collaborator
    }: Props = $props();
</script>

<div class="rounded-lg shadow bg-gradient-to-br from-[#3D3C40] to-[#2A292D] p-5 flex flex-col h-48 hover:shadow-lg transition-all duration-200 border border-gray-700 hover:border-gray-600 cursor-pointer">
    <div class="flex-grow">
        <h3 class="font-bold text-xl text-white mb-2">{title}</h3>
        <p class="text-gray-300 text-sm line-clamp-3">{description || 'No description'}</p>
    </div>
    
    <div class="mt-4 pt-3 border-t border-gray-700 flex items-center">
        <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            <span class="ml-2 text-gray-300 text-sm">{collaboratorsCount} {collaboratorsCount === 1 ? 'Collaborator' : 'Collaborators'}</span>
        </div>
    </div>
</div>