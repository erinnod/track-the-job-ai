import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

/**
 * Auth callback page for handling email verification and other auth redirects
 */
const AuthCallback = () => {
	const navigate = useNavigate()
	const [message, setMessage] = useState('Verifying your email...')
	const [error, setError] = useState(false)

	useEffect(() => {
		// Process the OAuth or email verification callback
		const handleAuthCallback = async () => {
			try {
				// Get the auth code from the URL
				const hashParams = new URLSearchParams(
					window.location.hash.substring(1)
				)
				const queryParams = new URLSearchParams(window.location.search)

				const accessToken = hashParams.get('access_token')
				const refreshToken = hashParams.get('refresh_token')
				const type = queryParams.get('type') || hashParams.get('type')

				// Check if this is an email confirmation
				if (type === 'email_confirmation' || type === 'recovery') {
					setMessage('Email verified successfully! Redirecting to login...')

					// Wait a moment before redirecting
					setTimeout(() => {
						navigate('/login')
					}, 2000)
					return
				}

				// If we have tokens directly in the URL (OAuth case)
				if (accessToken && refreshToken) {
					const { error } = await supabase.auth.setSession({
						access_token: accessToken,
						refresh_token: refreshToken,
					})

					if (error) {
						throw error
					}

					setMessage('Login successful! Redirecting...')
					setTimeout(() => {
						navigate('/dashboard')
					}, 1000)
					return
				}

				// General fallback for other auth flows
				const { data, error } = await supabase.auth.getSession()

				if (error) {
					throw error
				}

				if (data?.session) {
					setMessage('Authenticated! Redirecting...')
					setTimeout(() => {
						navigate('/dashboard')
					}, 1000)
				} else {
					setMessage('No session found. Redirecting to login...')
					setTimeout(() => {
						navigate('/login')
					}, 1000)
				}
			} catch (err) {
				console.error('Auth callback error:', err)
				setError(true)
				setMessage('Authentication failed. Redirecting to login...')
				setTimeout(() => {
					navigate('/login')
				}, 2000)
			}
		}

		handleAuthCallback()
	}, [navigate])

	return (
		<div className='min-h-screen flex items-center justify-center p-4'>
			<Card className='w-full max-w-md'>
				<CardHeader className='space-y-1 text-center'>
					<CardTitle className='text-2xl'>Authentication</CardTitle>
				</CardHeader>
				<CardContent className='flex flex-col items-center justify-center space-y-4 pt-4'>
					{!error ? (
						<Loader2 className='h-8 w-8 animate-spin text-blue-500' />
					) : (
						<div className='text-red-500 rounded-full p-3'>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								width='24'
								height='24'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
							>
								<circle
									cx='12'
									cy='12'
									r='10'
								/>
								<line
									x1='15'
									y1='9'
									x2='9'
									y2='15'
								/>
								<line
									x1='9'
									y1='9'
									x2='15'
									y2='15'
								/>
							</svg>
						</div>
					)}
					<p className='text-center text-gray-700 mt-4'>{message}</p>
				</CardContent>
			</Card>
		</div>
	)
}

export default AuthCallback
