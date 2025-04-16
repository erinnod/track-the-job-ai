import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useToast } from '@/hooks/use-toast'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from '@/components/ui/form'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

// Form data interface
interface ProfessionalFormValues {
	title: string
	company: string
	industry: string
	location: string
}

export const ProfessionalForm = () => {
	const { toast } = useToast()
	const { user } = useAuth()
	const [isLoading, setIsLoading] = useState(false)

	// Initialize form with empty values - no need for initial data
	const professionalForm = useForm<ProfessionalFormValues>({
		defaultValues: {
			title: '',
			company: '',
			industry: '',
			location: '',
		},
	})

	// Load data once on component mount
	useEffect(() => {
		if (!user?.id) return

		const loadProfessionalData = async () => {
			try {
				const { data } = await supabase
					.from('professional_details')
					.select('*')
					.eq('user_id', user.id)
					.single()

				if (data) {
					professionalForm.reset({
						title: data.title || '',
						company: data.company || '',
						industry: data.industry || '',
						location: data.location || '',
					})
				}
			} catch (error) {
				// Silently fail - this is background loading that shouldn't block UI
				console.error('Error loading professional data:', error)
			}
		}

		loadProfessionalData()
	}, [user?.id])

	// Handle saving professional info
	const onProfessionalSubmit = async (data: ProfessionalFormValues) => {
		if (isLoading) return

		try {
			setIsLoading(true)

			if (!user?.id) {
				throw new Error('User not authenticated')
			}

			const userId = user.id

			// Save to database with upsert
			const { error } = await supabase.from('professional_details').upsert(
				{
					id: userId,
					user_id: userId,
					title: data.title || null,
					company: data.company || null,
					industry: data.industry || null,
					location: data.location || null,
					updated_at: new Date().toISOString(),
				},
				{
					onConflict: 'user_id',
					ignoreDuplicates: false,
				}
			)

			if (error) throw error

			toast({
				title: 'Professional details updated',
				description: 'Your professional details have been saved successfully.',
			})
		} catch (error: any) {
			toast({
				title: 'Error saving information',
				description:
					error.message || 'There was a problem saving your changes.',
				variant: 'destructive',
			})
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Professional Details</CardTitle>
				<CardDescription>
					Update your job preferences and professional information.
				</CardDescription>
			</CardHeader>
			<Form {...professionalForm}>
				<form onSubmit={professionalForm.handleSubmit(onProfessionalSubmit)}>
					<CardContent className='space-y-4'>
						<FormField
							control={professionalForm.control}
							name='title'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Current Title</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder='e.g. Software Engineer'
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							control={professionalForm.control}
							name='company'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Current Company</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder='e.g. Acme Corp'
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							control={professionalForm.control}
							name='industry'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Industry</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder='e.g. Technology, Healthcare'
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							control={professionalForm.control}
							name='location'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Location</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder='e.g. New York, NY'
										/>
									</FormControl>
								</FormItem>
							)}
						/>
					</CardContent>
					<CardFooter>
						<Button
							type='submit'
							disabled={isLoading}
						>
							{isLoading ? 'Saving...' : 'Save Changes'}
						</Button>
					</CardFooter>
				</form>
			</Form>
		</Card>
	)
}
