import { Link } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card'
import { User, Bell, Shield } from 'lucide-react'

const SettingsIndex = () => {
	return (
		<Layout>
			<div className='container mx-auto max-w-4xl py-6'>
				<div className='border-b border-gray-200 pb-4 mb-6'>
					<h1 className='text-2xl font-bold text-slate-800'>Settings</h1>
					<p className='text-slate-500 mt-1'>
						Manage your account and application preferences
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{/* Profile Settings - use direct Link for faster navigation */}
					<Link
						to='/settings/profile'
						className='block h-full'
					>
						<Card className='cursor-pointer hover:bg-slate-50 transition-colors h-full'>
							<CardHeader className='flex flex-row items-center gap-3'>
								<User className='h-6 w-6 text-blue-500' />
								<CardTitle className='text-lg'>Profile</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-slate-500'>
									Manage your personal and professional information
								</p>
							</CardContent>
						</Card>
					</Link>

					{/* Notification Settings */}
					<Link
						to='/settings/notifications'
						className='block h-full'
					>
						<Card className='hover:bg-slate-50 transition-colors cursor-pointer h-full'>
							<CardHeader className='flex flex-row items-center gap-3'>
								<Bell className='h-6 w-6 text-blue-500' />
								<CardTitle className='text-lg'>Notification Settings</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-slate-500'>
									Manage your notification preferences and alert settings
								</p>
							</CardContent>
						</Card>
					</Link>

					{/* Security Settings */}
					<Link
						to='/settings/security'
						className='block h-full'
					>
						<Card className='hover:bg-slate-50 transition-colors cursor-pointer h-full'>
							<CardHeader className='flex flex-row items-center gap-3'>
								<Shield className='h-6 w-6 text-blue-500' />
								<CardTitle className='text-lg'>Security</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-slate-500'>
									Update your password, set up two-factor authentication, and
									manage devices
								</p>
							</CardContent>
						</Card>
					</Link>
				</div>
			</div>
		</Layout>
	)
}

export default SettingsIndex
