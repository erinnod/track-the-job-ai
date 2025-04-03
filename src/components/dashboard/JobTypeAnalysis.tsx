import { JobApplication } from '@/data/mockJobs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Briefcase,
	Award,
	Home,
	Building,
	Clock,
	BarChart,
	Laptop,
	Timer,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Legend,
	Tooltip as RechartsTooltip,
} from 'recharts'
import { useState } from 'react'

interface JobTypeAnalysisProps {
	jobs: JobApplication[]
}

// Chart data type
interface ChartDataItem {
	name: string
	value: number
	color: string
}

const JobTypeAnalysis = ({ jobs }: JobTypeAnalysisProps) => {
	const [activeIndex, setActiveIndex] = useState(0)

	// Generate data for job types
	const getTypeData = () => {
		const typeCount = {}
		jobs.forEach((job) => {
			if (job.type) {
				typeCount[job.type] = (typeCount[job.type] || 0) + 1
			} else {
				typeCount['Not specified'] = (typeCount['Not specified'] || 0) + 1
			}
		})

		// Create sorted array of objects
		return Object.entries(typeCount)
			.map(([name, count]: [string, number]) => ({
				name,
				count,
				percent: jobs.length ? (count / jobs.length) * 100 : 0,
			}))
			.sort((a, b) => b.count - a.count)
	}

	// Work type data (on-site/remote/hybrid)
	const getWorkTypeData = () => {
		const workTypeCount = {
			'On-site': 0,
			Remote: 0,
			Hybrid: 0,
			'Not specified': 0,
		}

		jobs.forEach((job) => {
			if (job.workType) {
				workTypeCount[job.workType]++
			} else {
				workTypeCount['Not specified']++
			}
		})

		return Object.entries(workTypeCount)
			.filter(([_, count]) => count > 0)
			.map(([name, count]: [string, number]) => ({
				name,
				count,
				percent: jobs.length ? (count / jobs.length) * 100 : 0,
				icon: getWorkTypeIcon(name),
				color: getWorkTypeColor(name),
			}))
			.sort((a, b) => b.count - a.count)
	}

	// Employment type data (full-time/part-time)
	const getEmploymentTypeData = () => {
		const employmentTypeCount = {
			'Full-time': 0,
			'Part-time': 0,
			'Not specified': 0,
		}

		jobs.forEach((job) => {
			if (job.employmentType) {
				employmentTypeCount[job.employmentType]++
			} else {
				employmentTypeCount['Not specified']++
			}
		})

		return Object.entries(employmentTypeCount)
			.filter(([_, count]) => count > 0)
			.map(([name, count]: [string, number]) => ({
				name,
				count,
				percent: jobs.length ? (count / jobs.length) * 100 : 0,
				icon: getEmploymentTypeIcon(name),
				color: getEmploymentTypeColor(name),
			}))
			.sort((a, b) => b.count - a.count)
	}

	const getWorkTypeIcon = (type: string) => {
		switch (type) {
			case 'Remote':
				return <Home className='h-4 w-4' />
			case 'Hybrid':
				return <Laptop className='h-4 w-4' />
			case 'On-site':
				return <Building className='h-4 w-4' />
			default:
				return <Clock className='h-4 w-4' />
		}
	}

	const getEmploymentTypeIcon = (type: string) => {
		switch (type) {
			case 'Full-time':
				return <Briefcase className='h-4 w-4' />
			case 'Part-time':
				return <Timer className='h-4 w-4' />
			default:
				return <Clock className='h-4 w-4' />
		}
	}

	const getWorkTypeColor = (type: string) => {
		switch (type) {
			case 'Remote':
				return {
					color: 'bg-indigo-400',
					bgColor: 'bg-indigo-100',
					textColor: 'text-indigo-600',
					fill: '#818cf8', // indigo-400
				}
			case 'Hybrid':
				return {
					color: 'bg-amber-400',
					bgColor: 'bg-amber-100',
					textColor: 'text-amber-600',
					fill: '#fbbf24', // amber-400
				}
			case 'On-site':
				return {
					color: 'bg-blue-400',
					bgColor: 'bg-blue-100',
					textColor: 'text-blue-600',
					fill: '#60a5fa', // blue-400
				}
			default:
				return {
					color: 'bg-gray-400',
					bgColor: 'bg-gray-100',
					textColor: 'text-gray-600',
					fill: '#9ca3af', // gray-400
				}
		}
	}

	const getEmploymentTypeColor = (type: string) => {
		switch (type) {
			case 'Full-time':
				return {
					color: 'bg-green-400',
					bgColor: 'bg-green-100',
					textColor: 'text-green-600',
					fill: '#4ade80', // green-400
				}
			case 'Part-time':
				return {
					color: 'bg-purple-400',
					bgColor: 'bg-purple-100',
					textColor: 'text-purple-600',
					fill: '#c084fc', // purple-400
				}
			default:
				return {
					color: 'bg-gray-400',
					bgColor: 'bg-gray-100',
					textColor: 'text-gray-600',
					fill: '#9ca3af', // gray-400
				}
		}
	}

	const typeData = getTypeData()
	const workTypeData = getWorkTypeData()
	const employmentTypeData = getEmploymentTypeData()

	// Get appropriate icon for job type
	const getJobTypeIcon = (typeName: string) => {
		if (typeName.toLowerCase().includes('full')) {
			return <Briefcase className='h-4 w-4' />
		} else if (typeName.toLowerCase().includes('part')) {
			return <Clock className='h-4 w-4' />
		} else if (typeName.toLowerCase().includes('contract')) {
			return <Award className='h-4 w-4' />
		} else {
			return <BarChart className='h-4 w-4' />
		}
	}

	// Generate colors based on item index
	const getItemColor = (index: number) => {
		const colors = [
			{
				color: 'bg-blue-400',
				bgColor: 'bg-blue-100',
				textColor: 'text-blue-600',
				fill: '#60a5fa', // blue-400
			},
			{
				color: 'bg-purple-400',
				bgColor: 'bg-purple-100',
				textColor: 'text-purple-600',
				fill: '#c084fc', // purple-400
			},
			{
				color: 'bg-green-400',
				bgColor: 'bg-green-100',
				textColor: 'text-green-600',
				fill: '#4ade80', // green-400
			},
			{
				color: 'bg-yellow-400',
				bgColor: 'bg-yellow-100',
				textColor: 'text-yellow-600',
				fill: '#facc15', // yellow-400
			},
			{
				color: 'bg-red-400',
				bgColor: 'bg-red-100',
				textColor: 'text-red-600',
				fill: '#f87171', // red-400
			},
		]
		return colors[index % colors.length]
	}

	// Create data for donut chart - Work Type
	const workTypeChartData: ChartDataItem[] = workTypeData
		.filter((item) => item.count > 0)
		.map((item) => ({
			name: item.name,
			value: item.count,
			color: item.color.fill,
		}))

	// Custom tooltip for chart
	const CustomTooltip = ({ active, payload }: any) => {
		if (active && payload && payload.length) {
			const data = payload[0].payload
			return (
				<div className='bg-white p-3 border border-gray-200 rounded-md shadow-md'>
					<p className='font-medium text-sm'>{`${data.name}: ${data.value}`}</p>
					<p className='text-gray-600 text-xs'>{`${(
						(data.value / jobs.length) *
						100
					).toFixed(1)}%`}</p>
				</div>
			)
		}
		return null
	}

	// Custom legend
	const CustomLegend = ({ payload }: any) => {
		return (
			<div className='flex flex-wrap justify-center gap-4 mt-4'>
				{payload.map((entry: any, index: number) => (
					<div
						key={`legend-${index}`}
						className='flex items-center gap-2'
					>
						<div
							className='w-3 h-3 rounded-full'
							style={{ backgroundColor: entry.color }}
						/>
						<span className='text-sm font-medium text-gray-700'>
							{entry.value}
						</span>
						<span className='text-sm text-gray-500'>{entry.payload.value}</span>
					</div>
				))}
			</div>
		)
	}

	return (
		<Card className='col-span-1 md:col-span-2 lg:col-span-2'>
			<CardHeader>
				<CardTitle className='text-xl'>Job Distribution</CardTitle>
			</CardHeader>
			<CardContent>
				{jobs.length > 0 ? (
					<div className='bg-white rounded-lg p-6'>
						<div className='h-[272px] w-full relative'>
							<ResponsiveContainer
								width='100%'
								height='100%'
							>
								<PieChart>
									<text
										x='50%'
										y='50%'
										textAnchor='middle'
										dominantBaseline='middle'
										className='text-4xl font-bold'
									>
										{jobs.length}
									</text>
									<text
										x='50%'
										y='58%'
										textAnchor='middle'
										dominantBaseline='middle'
										className='text-xs text-gray-500'
									>
										Total Jobs
									</text>
									<Pie
										data={workTypeChartData}
										cx='50%'
										cy='50%'
										innerRadius={50}
										outerRadius={110}
										paddingAngle={3}
										dataKey='value'
										animationDuration={800}
										animationBegin={0}
									>
										{workTypeChartData.map((entry, index) => (
											<Cell
												key={`cell-${index}`}
												fill={entry.color}
											/>
										))}
									</Pie>
									<RechartsTooltip content={<CustomTooltip />} />
									<Legend content={<CustomLegend />} />
								</PieChart>
							</ResponsiveContainer>
						</div>
					</div>
				) : (
					<div className='h-64 flex items-center justify-center'>
						<p className='text-gray-500'>No application data available</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}

export default JobTypeAnalysis
