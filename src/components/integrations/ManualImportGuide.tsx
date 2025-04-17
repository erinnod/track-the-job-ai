import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
	importLinkedInManually,
	importIndeedManually,
} from '@/services/integrationService'
import { useAuth } from '@/contexts/AuthContext'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
	CheckCircle,
	HelpCircle,
	FileText,
	Linkedin,
	Briefcase,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/components/ui/use-toast'

// Custom styles for logo images to prevent layout shifts and flashing
const logoImageStyle = {
	height: '20px',
	width: 'auto',
	display: 'inline-block',
	opacity: 1,
	transition: 'opacity 0.3s ease-in-out',
}

const ManualImportGuide = () => {
	const { user } = useAuth()
	const navigate = useNavigate()
	const { toast } = useToast()
	const [activeTab, setActiveTab] = useState('linkedin')
	const [loading, setLoading] = useState(false)
	const [instructions, setInstructions] = useState<string | null>(null)
	const [imageLoaded, setImageLoaded] = useState(false)

	// Reset image loaded state when tab changes
	useEffect(() => {
		setImageLoaded(false)
	}, [activeTab])

	const startImport = async (platform: 'linkedin' | 'indeed') => {
		if (!user) {
			toast({
				title: 'Authentication required',
				description: 'Please log in to import your job applications.',
				variant: 'destructive',
			})
			return
		}

		setLoading(true)

		try {
			const result =
				platform === 'linkedin'
					? await importLinkedInManually(user.id)
					: await importIndeedManually(user.id)

			if (result.success) {
				setInstructions(result.message)
			} else {
				toast({
					title: 'Import Failed',
					description: result.message,
					variant: 'destructive',
				})
			}
		} catch (error) {
			console.error(`Error importing from ${platform}:`, error)
			toast({
				title: 'Import Failed',
				description: `There was an error importing your data from ${platform}.`,
				variant: 'destructive',
			})
		} finally {
			setLoading(false)
		}
	}

	const handleAddManually = () => {
		navigate('/applications/new')
	}

	return (
		<Card className='w-full'>
			<CardHeader>
				<CardTitle className='text-xl'>Import Job Applications</CardTitle>
				<CardDescription>
					Import your job applications from LinkedIn and Indeed
				</CardDescription>
			</CardHeader>
			<CardContent>
				{instructions ? (
					<div className='space-y-4'>
						<Alert>
							<CheckCircle className='h-4 w-4' />
							<AlertTitle>Manual Import Instructions</AlertTitle>
							<AlertDescription className='whitespace-pre-line mt-2'>
								{instructions}
							</AlertDescription>
						</Alert>
						<div className='flex justify-center mt-6'>
							<Button
								onClick={handleAddManually}
								className='mx-2'
							>
								<FileText className='mr-2 h-4 w-4' />
								Add Job Manually
							</Button>
						</div>
					</div>
				) : (
					<Tabs
						defaultValue='linkedin'
						value={activeTab}
						onValueChange={setActiveTab}
					>
						<TabsList className='grid w-full grid-cols-2'>
							<TabsTrigger value='linkedin'>LinkedIn</TabsTrigger>
							<TabsTrigger value='indeed'>Indeed</TabsTrigger>
						</TabsList>
						<TabsContent
							value='linkedin'
							className='space-y-4 mt-4'
						>
							<div className='bg-muted p-4 rounded-lg'>
								<h3 className='font-medium flex items-center'>
									<img
										src='/images/linkedin-logo.png'
										alt='LinkedIn'
										className='mr-2 object-contain'
										style={logoImageStyle}
										onLoad={() => setImageLoaded(true)}
										onError={(e) => {
											// Fallback to the Linkedin icon if image fails to load
											e.currentTarget.style.display = 'none'
											const fallbackElement = document.createElement('span')
											fallbackElement.className = 'mr-2'
											fallbackElement.innerHTML =
												'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#0077B5" stroke="#0077B5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>'
											e.currentTarget.parentNode?.insertBefore(
												fallbackElement,
												e.currentTarget
											)
										}}
									/>
									LinkedIn Job Applications
								</h3>
								<p className='text-sm mt-2'>
									Import your saved and applied jobs from LinkedIn to track them
									in JobTrakr.
								</p>
								<div className='mt-4'>
									<Button
										onClick={() => startImport('linkedin')}
										disabled={loading}
										className='w-full'
									>
										{loading && activeTab === 'linkedin'
											? 'Starting Import...'
											: 'Start LinkedIn Import'}
									</Button>
								</div>
							</div>
						</TabsContent>
						<TabsContent
							value='indeed'
							className='space-y-4 mt-4'
						>
							<div className='bg-muted p-4 rounded-lg'>
								<h3 className='font-medium flex items-center'>
									<img
										src='/images/indeed-logo.png'
										alt='Indeed'
										className='mr-2 object-contain'
										style={logoImageStyle}
										onLoad={() => setImageLoaded(true)}
										onError={(e) => {
											// Fallback to the Briefcase icon if image fails to load
											e.currentTarget.style.display = 'none'
											const fallbackElement = document.createElement('span')
											fallbackElement.className = 'mr-2'
											fallbackElement.innerHTML =
												'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#003A9B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>'
											e.currentTarget.parentNode?.insertBefore(
												fallbackElement,
												e.currentTarget
											)
										}}
									/>
									Indeed Job Applications
								</h3>
								<p className='text-sm mt-2'>
									Import your saved and applied jobs from Indeed to track them
									in JobTrakr.
								</p>
								<div className='mt-4'>
									<Button
										onClick={() => startImport('indeed')}
										disabled={loading}
										className='w-full'
									>
										{loading && activeTab === 'indeed'
											? 'Starting Import...'
											: 'Start Indeed Import'}
									</Button>
								</div>
							</div>
						</TabsContent>
					</Tabs>
				)}
			</CardContent>
			<CardFooter className='flex justify-between'>
				<div className='flex items-center text-sm text-muted-foreground'>
					<HelpCircle className='mr-2 h-4 w-4' />
					Job data is only imported when you explicitly request it
				</div>
			</CardFooter>
		</Card>
	)
}

export default ManualImportGuide
