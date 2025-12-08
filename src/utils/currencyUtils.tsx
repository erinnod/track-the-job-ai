import { DollarSign, Euro, PoundSterling } from 'lucide-react'
import { ReactNode } from 'react'

// UK locations to check (fallback when browser locale isn't available)
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

// US locations to check (fallback when browser locale isn't available)
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

const localeCurrencyMap: Record<string, { code: 'USD' | 'GBP' | 'EUR'; symbol: '$' | '£' | '€' }> = {
	US: { code: 'USD', symbol: '$' },
	GB: { code: 'GBP', symbol: '£' },
	UK: { code: 'GBP', symbol: '£' },
	FR: { code: 'EUR', symbol: '€' },
	IE: { code: 'EUR', symbol: '€' },
	DE: { code: 'EUR', symbol: '€' },
	ES: { code: 'EUR', symbol: '€' },
	IT: { code: 'EUR', symbol: '€' },
	NL: { code: 'EUR', symbol: '€' },
	BE: { code: 'EUR', symbol: '€' },
	PT: { code: 'EUR', symbol: '€' },
}

/**
 * Derive currency from the user's browser locale when available.
 * Falls back to time zone and finally defaults to USD.
 */
export function getUserCurrencyFromLocale(): { code: 'USD' | 'GBP' | 'EUR'; symbol: '$' | '£' | '€' } {
	if (typeof navigator === 'undefined') {
		return { code: 'USD', symbol: '$' }
	}

	const locale =
		(typeof navigator.languages !== 'undefined' && navigator.languages[0]) ||
		navigator.language
	const region = locale?.split('-')?.[1]?.toUpperCase()

	if (region && localeCurrencyMap[region]) {
		return localeCurrencyMap[region]
	}

	// Fallback: infer from time zone when the locale is neutral (e.g., "en")
	try {
		const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
		if (tz?.startsWith('Europe/London')) {
			return { code: 'GBP', symbol: '£' }
		}
		if (tz?.startsWith('Europe/')) {
			return { code: 'EUR', symbol: '€' }
		}
		if (tz?.startsWith('America/')) {
			return { code: 'USD', symbol: '$' }
		}
	} catch {
		// Ignore errors and use default below
	}

	return { code: 'USD', symbol: '$' }
}

/**
 * Determines the appropriate currency symbol based on the user's region
 * with a graceful fallback to job location heuristics.
 * @param location Optional job location string (used only as a fallback)
 * @returns The currency symbol (£, €, or $)
 */
export function getCurrencySymbol(location?: string): '$' | '£' | '€' {
	// Prefer user locale when available
	try {
		const { symbol } = getUserCurrencyFromLocale()
		if (symbol) return symbol
	} catch {
		// If anything goes wrong, fall through to location-based logic
	}

	// Fallback to location-based inference
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
	}

	if (isUsLocation) {
		return '$'
	}

	// Default to dollar sign
	return '$'
}

/**
 * Returns the appropriate currency icon component based on the user's locale.
 * @param location Optional job location string (used only as a fallback)
 * @returns React component for the currency icon
 */
export function getCurrencyIcon(location?: string): ReactNode {
	const symbol = getCurrencySymbol(location)

	if (symbol === '£') {
		return (
			<PoundSterling className='w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0' />
		)
	}

	if (symbol === '€') {
		return <Euro className='w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0' />
	}

	return <DollarSign className='w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0' />
}

/**
 * Formats a salary string/number with the user's currency symbol.
 * For ranges we simply prefix the detected symbol if none is present.
 */
export function formatSalaryForDisplay(
	salary: string | number | null | undefined,
	location?: string
): string {
	if (salary === null || salary === undefined || salary === '') {
		return 'Not specified'
	}

	const symbol = getCurrencySymbol(location)
	const code = getUserCurrencyFromLocale().code

	// Numeric values can be properly formatted
	if (typeof salary === 'number') {
		return new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency: code,
			maximumFractionDigits: 0,
		}).format(salary)
	}

	const salaryString = String(salary).trim()
	// If the salary already starts with a currency sign, leave it alone
	if (/^[\p{Sc}]/u.test(salaryString)) {
		return salaryString
	}

	return `${symbol}${salaryString}`
}
