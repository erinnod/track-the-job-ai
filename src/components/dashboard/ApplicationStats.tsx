import { JobApplication, statusLabels } from '@/data/mockJobs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Clock, MessageSquare, XCircle, Bookmark } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'

interface ApplicationStatsProps {
	jobs: JobApplication[]
}

const ApplicationStats = ({ jobs }: ApplicationStatsProps) => {
	// Generate data for status distribution
	const statusCount = {
		saved: jobs.filter((job) => job.status === 'saved').length,
		applied: jobs.filter((job) => job.status === 'applied').length,
		interview: jobs.filter((job) => job.status === 'interview').length,
		offer: jobs.filter((job) => job.status === 'offer').length,
		rejected: jobs.filter((job) => job.status === 'rejected').length,
	}

	const totalJobs = jobs.length

	// Status configurations with icons and colors
	const statusConfig = [
		{
			status: 'saved',
			label: 'Saved',
			icon: <Bookmark className='h-4 w-4' />,
			color: 'bg-slate-400',
			textColor: 'text-slate-600',
			bgColor: 'bg-slate-100',
			lightBgColor: 'bg-slate-50',
			badgeColor: 'border-slate-200 bg-slate-100 text-slate-700',
			percent: totalJobs ? (statusCount.saved / totalJobs) * 100 : 0,
			fill: '#94a3b8',
		},
		{
			status: 'applied',
			label: 'Applied',
			icon: <Clock className='h-4 w-4' />,
			color: 'bg-purple-400',
			textColor: 'text-purple-600',
			bgColor: 'bg-purple-100',
			lightBgColor: 'bg-purple-50',
			badgeColor: 'border-purple-200 bg-purple-100 text-purple-700',
			percent: totalJobs ? (statusCount.applied / totalJobs) * 100 : 0,
			fill: '#c084fc',
		},
		{
			status: 'interview',
			label: 'Interview',
			icon: <MessageSquare className='h-4 w-4' />,
			color: 'bg-blue-400',
			textColor: 'text-blue-600',
			bgColor: 'bg-blue-100',
			lightBgColor: 'bg-blue-50',
			badgeColor: 'border-blue-200 bg-blue-100 text-blue-700',
			percent: totalJobs ? (statusCount.interview / totalJobs) * 100 : 0,
			fill: '#60a5fa',
		},
		{
			status: 'offer',
			label: 'Offer',
			icon: <Check className='h-4 w-4' />,
			color: 'bg-green-400',
			textColor: 'text-green-600',
			bgColor: 'bg-green-100',
			lightBgColor: 'bg-green-50',
			badgeColor: 'border-green-200 bg-green-100 text-green-700',
			percent: totalJobs ? (statusCount.offer / totalJobs) * 100 : 0,
			fill: '#4ade80',
		},
		{
			status: 'rejected',
			label: 'Rejected',
			icon: <XCircle className='h-4 w-4' />,
			color: 'bg-red-400',
			textColor: 'text-red-600',
			bgColor: 'bg-red-100',
			lightBgColor: 'bg-red-50',
			badgeColor: 'border-red-200 bg-red-100 text-red-700',
			percent: totalJobs ? (statusCount.rejected / totalJobs) * 100 : 0,
			fill: '#f87171',
		},
	]

	return (
		<Card className='col-span-1 md:col-span-3'>
			<CardHeader>
				<CardTitle className='text-xl'>Application Status</CardTitle>
			</CardHeader>
			<CardContent>
				{totalJobs > 0 ? (
					<div className='space-y-8'>
						{/* Status cards with shadcn UI components */}
						<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'>
							{statusConfig.map((status) => {
								const count = statusCount[status.status]
								return (
									<Card
										key={status.status}
										className={`border shadow-sm ${
											count > 0 ? status.lightBgColor : 'bg-gray-50'
										}`}
									>
										<CardContent className='p-4 flex flex-col items-center text-center'>
											<div
												className={`rounded-full ${status.bgColor} p-2 mb-2`}
											>
												<div className={status.textColor}>{status.icon}</div>
											</div>
											<div className='font-medium text-sm'>{status.label}</div>
											<div className='text-2xl font-bold mt-1'>{count}</div>
											<Badge
												variant='outline'
												className={`mt-2 ${status.badgeColor}`}
											>
												{status.percent.toFixed(0)}%
											</Badge>
										</CardContent>
									</Card>
								)
							})}
						</div>

						{/* Progress bars for application status */}
						<div className='bg-gray-50 rounded-lg p-6'>
							<h3 className='text-sm font-medium text-gray-700 mb-5'>
								Application Progress
							</h3>
							<div className='space-y-5'>
								{statusConfig.map((status) => (
									<div
										key={status.status}
										className='space-y-2'
									>
										<div className='flex justify-between items-center text-sm'>
											<div className='flex items-center gap-2'>
												<div
													className={`w-3 h-3 rounded-full ${status.color}`}
												></div>
												<span className='font-medium text-gray-800'>
													{status.label}
												</span>
											</div>
											<div className='text-gray-600'>
												{statusCount[status.status]} of {totalJobs} (
												{status.percent.toFixed(0)}%)
											</div>
										</div>
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<div className='w-full'>
														<Progress
															value={status.percent}
															className={`h-2.5 ${status.color}`}
														/>
													</div>
												</TooltipTrigger>
												<TooltipContent>
													<p>
														{status.label}: {statusCount[status.status]}{' '}
														applications
													</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</div>
								))}
							</div>
						</div>
					</div>
				) : (
					<div className='h-40 flex items-center justify-center'>
						<p className='text-gray-500'>No application data available</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}

export default ApplicationStats
