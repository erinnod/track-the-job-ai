import { DollarSign, PoundSterling } from 'lucide-react'
import { ReactNode } from 'react'

// UK locations to check
const ukLocations = [
	'uk',
	'united kingdom',
	'england',
	'scotland',
	'wales',
	'london',
	'manchester',
	'birmingham',
	'shrewsbury',
	'shropshire',
	'oswestry',
	'oxford',
	'cambridge',
	'leeds',
	'bristol',
	'liverpool',
	'milton keynes',
	'peterborough',
]

// US locations to check
const usLocations = [
	'usa',
	'united states',
	'us',
	'america',
	'california',
	'new york',
	'ny',
	'seattle',
	'chicago',
	'boston',
	'austin',
	'san francisco',
	'los angeles',
	'atlanta',
	'miami',
	'dallas',
	'houston',
	'tampa',
	'orlando',
	'pittsburgh',
	'cincinnati',
]

/**
 * Determines the appropriate currency symbol based on location
 * @param location The job location string
 * @returns The currency symbol (£ or $)
 */
export function getCurrencySymbol(location: string | undefined): string {
	if (!location || typeof location !== 'string') {
		return '$'
	}

	const locationLower = location.toLowerCase()

	// Special case for "New York"
	if (locationLower.includes('new york') || locationLower.includes('ny,')) {
		return '$'
	}

	// Check if it's a UK location
	const isUkLocation = ukLocations.some(
		(ukLocation) =>
			locationLower.includes(ukLocation) &&
			!usLocations.some((usLocation) => locationLower.includes(usLocation))
	)

	// Check if it's a US location
	const isUsLocation = usLocations.some((usLocation) =>
		locationLower.includes(usLocation)
	)

	if (isUkLocation && !isUsLocation) {
		return '£'
	} else if (isUsLocation) {
		return '$'
	}

	// Default to dollar sign
	return '$'
}

/**
 * Returns the appropriate currency icon component based on location
 * @param location The job location string
 * @returns React component for the currency icon
 */
export function getCurrencyIcon(location: string | undefined): ReactNode {
	const symbol = getCurrencySymbol(location)

	if (symbol === '£') {
		return (
			<PoundSterling className='w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0' />
		)
	}

	return <DollarSign className='w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0' />
}
