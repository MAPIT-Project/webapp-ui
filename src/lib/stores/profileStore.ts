import { writable } from 'svelte/store';

interface UserProfile {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	loading: boolean;
	error: string | null;
}

// Initial state with loading flag
const initialState: UserProfile = {
	id: 0,
	firstName: '',
	lastName: '',
	email: '',
	loading: true,
	error: null
};

// Create the store
const createProfileStore = () => {
	const { subscribe, set, update } = writable<UserProfile>(initialState);

	return {
		subscribe,
		setProfile: (profile: Partial<UserProfile>) => update((state) => ({ ...state, ...profile })),
		setLoading: (loading: boolean) => update((state) => ({ ...state, loading })),
		setError: (error: string | null) => update((state) => ({ ...state, error })),
		reset: () => set(initialState)
	};
};

// Export the store
export const profileStore = createProfileStore();
