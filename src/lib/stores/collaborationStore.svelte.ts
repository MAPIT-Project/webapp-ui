// Type for a collaboration space item in the sidebar
interface CollaborationSpace {
	id: string;
	name: string;
}

// --- State for the currently selected space ---
let currentSelectedSpaceId: string = $state('personal');

// Callback to notify when space changes
let onSpaceChangeCallback: ((spaceId: string) => void) | null = null;

export function getSpace() {
	return currentSelectedSpaceId;
}

export function setSpace(newSpaceId: string) {
	if (currentSelectedSpaceId === newSpaceId) return;
	currentSelectedSpaceId = newSpaceId;
	// Notify callback when space changes
	if (onSpaceChangeCallback) {
		onSpaceChangeCallback(newSpaceId);
	}
}

export function registerSpaceChangeCallback(callback: (spaceId: string) => void) {
	onSpaceChangeCallback = callback;
}

// --- State for managing the list of user collaborations ---
let userCollaborationItems = $state<CollaborationSpace[]>([]);
let isLoadingUserCollaborations = $state(true);

// Function to fetch user collaborations from the API
export async function fetchUserCollaborations() {
	if (!isLoadingUserCollaborations && userCollaborationItems.length > 0) {
		// Data already fetched and not in initial loading state, could add a force refresh later if needed
		// For now, avoid refetching if already loaded to prevent UI flicker unless explicitly told.
		// isLoadingUserCollaborations = false; // Ensure it's false if we skip.
		// return;
	}
	isLoadingUserCollaborations = true;
	try {
		const response = await fetch('/api/user-collaborations', {
			credentials: 'include' // Ensure cookies are sent
		});

		if (response.ok) {
			const fetchedCollaborations = await response.json();

			userCollaborationItems = fetchedCollaborations
				.map((c: { id: number | string; name: string }) => ({
					id: String(c.id), // Ensure ID is a string
					name: c.name
				}))
				.sort((a: CollaborationSpace, b: CollaborationSpace) => a.name.localeCompare(b.name));
		} else {
			console.error(
				'Failed to fetch collaborations in store:',
				response.status,
				response.statusText
			);
			userCollaborationItems = []; // Default to empty on error
		}
	} catch (error) {
		console.error('Error fetching collaborations in store:', error);
		userCollaborationItems = []; // Default to empty on error
	} finally {
		isLoadingUserCollaborations = false;
	}
}

// Function to add a collaboration to the local store
// Expects an object with at least id and name
export function addCollaborationToStore(collab: { id: number | string; name: string }) {
	const newCollaborationSpace = { id: String(collab.id), name: collab.name };
	if (!userCollaborationItems.find((c) => c.id === newCollaborationSpace.id)) {
		const updatedList = [...userCollaborationItems, newCollaborationSpace];
		userCollaborationItems = updatedList.sort((a, b) => a.name.localeCompare(b.name));
	}
}

// Function to remove a collaboration from the local store
export function removeCollaborationFromStore(collabId: string) {
	userCollaborationItems = userCollaborationItems.filter((c) => c.id !== collabId);
	// If the removed collaboration was the currently selected one, switch to personal
	if (currentSelectedSpaceId === collabId) {
		setSpace('personal');
	}
}

// --- Derived state for all available spaces (Personal + fetched collaborations) ---
const _allAvailableSpaces = $derived([
	{ id: 'personal', name: 'Personal' },
	...userCollaborationItems
]);

export function getAllAvailableSpaces() {
	return _allAvailableSpaces;
}

// --- Getters for loading state and items (optional, direct $state access is fine in Svelte 5) ---
export function getIsLoadingUserCollaborations() {
	return isLoadingUserCollaborations;
}

export function getUserCollaborationItemsOnly() {
	// To distinguish from allAvailableSpaces
	return userCollaborationItems;
}
