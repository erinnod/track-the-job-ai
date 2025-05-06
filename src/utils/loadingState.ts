/**
 * A simple utility to manage loading state with a key.
 * This helps with forcing components to re-fetch data when navigated to
 * by providing a unique key that can be used as a component key or dependency.
 */

// Create a global store for loading keys
const loadingKeys: Record<string, number> = {}

/**
 * Gets a loading key for a specific component/page
 * @param id The component/page identifier
 * @returns The current timestamp key
 */
export const getLoadingKey = (id: string): number => {
	// If no key exists for this ID, create one
	if (!loadingKeys[id]) {
		refreshLoadingKey(id)
	}
	return loadingKeys[id]
}

/**
 * Refreshes a loading key to force data refresh
 * @param id The component/page identifier
 * @returns The new timestamp key
 */
export const refreshLoadingKey = (id: string): number => {
	loadingKeys[id] = Date.now()
	return loadingKeys[id]
}

/**
 * Gets a key function to use in useEffect dependencies or React keys
 * This ensures that useEffect hooks re-run when navigated to
 */
export const getLoadingKeyFn = (id: string): (() => number) => {
	return () => getLoadingKey(id)
}
