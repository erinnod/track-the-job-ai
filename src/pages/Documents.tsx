import { useState, useEffect, useRef } from 'react'
import Layout from '@/components/layout/Layout'
import DocumentUploadSection from '@/components/documents/DocumentUploadSection'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { fetchUserDocuments, getCachedDocuments } from '@/lib/supabase'

const Documents = () => {
	const { user } = useAuth()
	const hasLoadedRef = useRef(false)

	// Preload documents data for all tabs when page loads, but only once
	useEffect(() => {
		if (!user?.id || hasLoadedRef.current) return

		// Mark as loaded immediately to prevent duplicate loading
		hasLoadedRef.current = true

		// Use cached docs first for immediate UI rendering
		const cachedResumes = getCachedDocuments(user.id, 'resume')
		const cachedCoverLetters = getCachedDocuments(user.id, 'coverletter')
		const cachedOthers = getCachedDocuments(user.id, 'other')

		// Check if we need to load documents (only fetch if cache is empty)
		const loadDocuments = async () => {
			try {
				// Sequential fetching with delays to prevent API overload
				// Only fetch categories that aren't already cached
				if (cachedResumes.length === 0) {
					await fetchUserDocuments(user.id, 'resume')
				}

				await new Promise((resolve) => setTimeout(resolve, 1000))

				if (cachedCoverLetters.length === 0) {
					await fetchUserDocuments(user.id, 'coverletter')
				}

				await new Promise((resolve) => setTimeout(resolve, 1000))

				if (cachedOthers.length === 0) {
					await fetchUserDocuments(user.id, 'other')
				}
			} catch (error) {
				console.error('Error loading documents:', error)
			}
		}

		loadDocuments()
	}, [user?.id])

	return (
		<Layout>
			<div className='w-full max-w-5xl mx-auto'>
				<div className='flex justify-between items-center mb-6'>
					<div>
						<h1 className='text-2xl font-bold text-gray-900'>My Documents</h1>
						<p className='text-sm text-gray-500 mt-1'>
							Upload and manage your job application documents
						</p>
					</div>
				</div>

				<Tabs
					defaultValue='resumes'
					className='w-full'
				>
					<TabsList className='grid w-full grid-cols-3 mb-8'>
						<TabsTrigger value='resumes'>Resumes/CVs</TabsTrigger>
						<TabsTrigger value='coverletters'>Cover Letters</TabsTrigger>
						<TabsTrigger value='other'>Other Documents</TabsTrigger>
					</TabsList>

					<TabsContent
						value='resumes'
						className='space-y-4'
					>
						<DocumentUploadSection
							title='Resume/CV'
							description='Upload your professional resume or CV. We support PDF, DOCX, and TXT formats.'
							fileType='resume'
							acceptedFileTypes='.pdf,.docx,.txt'
						/>
					</TabsContent>

					<TabsContent
						value='coverletters'
						className='space-y-4'
					>
						<DocumentUploadSection
							title='Cover Letters'
							description='Upload your cover letters. These can be tailored for different job applications.'
							fileType='coverletter'
							acceptedFileTypes='.pdf,.docx,.txt'
						/>
					</TabsContent>

					<TabsContent
						value='other'
						className='space-y-4'
					>
						<DocumentUploadSection
							title='Other Documents'
							description='Upload certificates, recommendation letters, portfolios or other important documents.'
							fileType='other'
							acceptedFileTypes='.pdf,.docx,.jpg,.png,.zip'
						/>
					</TabsContent>
				</Tabs>
			</div>
		</Layout>
	)
}

export default Documents
