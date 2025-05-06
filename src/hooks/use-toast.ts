import * as React from 'react'

// Self-contained type definitions
export type ToastProps = {
	id: string
	className?: string
	variant?: 'default' | 'destructive'
	title?: React.ReactNode
	description?: React.ReactNode
	action?: React.ReactNode
	open?: boolean
	onOpenChange?: (open: boolean) => void
}

export type ToastActionElement = React.ReactNode

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 5000 // 5 seconds

type ToasterToast = ToastProps

const actionTypes = {
	ADD_TOAST: 'ADD_TOAST',
	UPDATE_TOAST: 'UPDATE_TOAST',
	DISMISS_TOAST: 'DISMISS_TOAST',
	REMOVE_TOAST: 'REMOVE_TOAST',
} as const

let count = 0

function genId() {
	count = (count + 1) % Number.MAX_SAFE_INTEGER
	return count.toString()
}

type ActionType = typeof actionTypes

type Action =
	| {
			type: ActionType['ADD_TOAST']
			toast: ToasterToast
	  }
	| {
			type: ActionType['UPDATE_TOAST']
			toast: Partial<ToasterToast>
	  }
	| {
			type: ActionType['DISMISS_TOAST']
			toastId?: ToasterToast['id']
	  }
	| {
			type: ActionType['REMOVE_TOAST']
			toastId?: ToasterToast['id']
	  }

interface State {
	toasts: ToasterToast[]
}

// Create a context for the toast state
const ToastContext = React.createContext<
	| {
			state: State
			dispatch: React.Dispatch<Action>
	  }
	| undefined
>(undefined)

// Initial state
const initialState: State = { toasts: [] }

// Reducer function
function toastReducer(state: State, action: Action): State {
	switch (action.type) {
		case 'ADD_TOAST':
			return {
				...state,
				toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
			}

		case 'UPDATE_TOAST':
			return {
				...state,
				toasts: state.toasts.map((t) =>
					t.id === action.toast.id ? { ...t, ...action.toast } : t
				),
			}

		case 'DISMISS_TOAST': {
			const { toastId } = action

			return {
				...state,
				toasts: state.toasts.map((t) =>
					t.id === toastId || toastId === undefined
						? {
								...t,
								open: false,
						  }
						: t
				),
			}
		}
		case 'REMOVE_TOAST':
			if (action.toastId === undefined) {
				return {
					...state,
					toasts: [],
				}
			}
			return {
				...state,
				toasts: state.toasts.filter((t) => t.id !== action.toastId),
			}
	}
}

// Provider component
export function ToastStateProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const [state, dispatch] = React.useReducer(toastReducer, initialState)

	// Handle toast removal after animation
	React.useEffect(() => {
		state.toasts.forEach((toast) => {
			if (!toast.open) {
				setTimeout(() => {
					dispatch({
						type: 'REMOVE_TOAST',
						toastId: toast.id,
					})
				}, TOAST_REMOVE_DELAY)
			}
		})
	}, [state.toasts])

	// Use createElement instead of JSX since this is a .ts file
	return React.createElement(
		ToastContext.Provider,
		{ value: { state, dispatch } },
		children
	)
}

// Toast hook for components
export function useToast() {
	const context = React.useContext(ToastContext)

	if (!context) {
		throw new Error('useToast must be used within a ToastProvider')
	}

	const { state, dispatch } = context

	const toast = React.useCallback(
		(props: Omit<ToasterToast, 'id'>) => {
			const id = genId()

			const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id })

			dispatch({
				type: 'ADD_TOAST',
				toast: {
					...props,
					id,
					open: true,
					onOpenChange: (open) => {
						if (!open) dismiss()
					},
				},
			})

			return {
				id,
				dismiss,
				update: (props: Partial<ToasterToast>) =>
					dispatch({
						type: 'UPDATE_TOAST',
						toast: { ...props, id },
					}),
			}
		},
		[dispatch]
	)

	return {
		toasts: state.toasts,
		toast,
		dismiss: (id?: string) => dispatch({ type: 'DISMISS_TOAST', toastId: id }),
	}
}

// Simple toast function for use outside of components
export const toast = (props: Omit<ToasterToast, 'id'>) => {
	// Warn if used outside of components
	console.warn(
		'Toast used outside a component - this is just a placeholder. Use the useToast hook inside your components.'
	)

	// Return a dummy implementation for type safety
	return {
		id: 'dummy-id',
		dismiss: () => {},
		update: () => {},
	}
}
