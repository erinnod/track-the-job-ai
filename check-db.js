// Script to directly check the database structure and test job_description updates
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client (use environment variables in production)
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

// Check if environment variables are set
if (!supabaseUrl || !supabaseKey) {
	console.error(
		'Error: Supabase URL or key not found in environment variables.'
	)
	console.log(
		'Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
	)
	process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseTable() {
	try {
		console.log('Checking job_applications table structure...')

		// Check if the table exists and get its columns
		const { data: columns, error: columnsError } = await supabase.rpc(
			'get_table_columns',
			{ table_name: 'job_applications' }
		)

		if (columnsError) {
			if (
				columnsError.message.includes(
					'function "get_table_columns" does not exist'
				)
			) {
				console.log('RPC function not available, falling back to direct query')

				// Fetch a single job to examine structure
				const { data: job, error: jobError } = await supabase
					.from('job_applications')
					.select('*')
					.limit(1)
					.single()

				if (jobError) {
					throw new Error(`Error fetching job: ${jobError.message}`)
				}

				console.log('Job application structure:')
				console.log(Object.keys(job))

				if (job.hasOwnProperty('job_description')) {
					console.log('✅ job_description column exists in the table')
					console.log('Current value:', job.job_description)
				} else {
					console.log('❌ job_description column NOT FOUND in the table')
				}

				// Attempt a direct update
				if (job.id) {
					console.log(`Attempting direct update on job ID: ${job.id}`)

					const testDesc = `Test description updated at ${new Date().toISOString()}`

					const { data: updateData, error: updateError } = await supabase
						.from('job_applications')
						.update({ job_description: testDesc })
						.eq('id', job.id)
						.select()

					if (updateError) {
						console.log('❌ Update error:', updateError.message)
					} else {
						console.log('✅ Direct update successful:')
						console.log(
							'Updated job_description:',
							updateData[0].job_description
						)
					}
				}
			} else {
				throw columnsError
			}
		} else {
			// Log columns from the table
			console.log('Table columns:')
			const jobDescColumn = columns.find(
				(col) => col.column_name === 'job_description'
			)

			if (jobDescColumn) {
				console.log(
					'✅ job_description column exists with data type:',
					jobDescColumn.data_type
				)
			} else {
				console.log('❌ job_description column NOT FOUND in the table')
			}
		}
	} catch (error) {
		console.error('Error checking database:', error)
	}
}

// Run the function
checkDatabaseTable()
