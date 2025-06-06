import type { Job } from '@/types/kanban.types'

export class JobService {
  private static instance: JobService
  private baseUrl = '/api/jobs' // TODO: Get from environment

  static getInstance(): JobService {
    if (!JobService.instance) {
      JobService.instance = new JobService()
    }
    return JobService.instance
  }

  async getAllJobs(): Promise<Job[]> {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(this.baseUrl)
      // if (!response.ok) {
      //   throw new Error('Failed to fetch jobs')
      // }
      // return await response.json()

      // Mock data for now
      return [
        {
          id: 1,
          name: 'Website Redesign',
          description: 'Complete redesign of company website with modern UI/UX',
          status: 'pending',
          client: 'Tech Corp Ltd',
          created_by: 'John Smith',
          created_date: '2025-01-01',
          paid: false,
          job_number: 'JOB-001'
        },
        {
          id: 2,
          name: 'Mobile App Development',
          description: 'Cross-platform mobile application for task management',
          status: 'in_progress',
          client: 'StartUp Inc',
          created_by: 'Jane Doe',
          created_date: '2025-01-02',
          paid: true,
          job_number: 'JOB-002'
        },
        {
          id: 3,
          name: 'Database Migration',
          description: 'Migrate legacy database to modern cloud solution',
          status: 'review',
          client: 'Enterprise Solutions',
          created_by: 'Bob Wilson',
          created_date: '2025-01-03',
          paid: false,
          job_number: 'JOB-003'
        },
        {
          id: 4,
          name: 'API Integration',
          description: 'Integrate third-party payment and notification APIs',
          status: 'completed',
          client: 'E-commerce Plus',
          created_by: 'Alice Brown',
          created_date: '2025-01-04',
          paid: true,
          job_number: 'JOB-004'
        },
        {
          id: 5,
          name: 'Security Audit',
          description: 'Complete security assessment and vulnerability testing',
          status: 'archived',
          client: 'Finance Corp',
          created_by: 'Mike Davis',
          created_date: '2024-12-15',
          paid: true,
          job_number: 'JOB-005'
        }
      ]
    } catch (error) {
      console.error('Error fetching jobs:', error)
      throw new Error('Failed to load jobs')
    }
  }

  async getJobById(id: number): Promise<Job | null> {
    try {
      const jobs = await this.getAllJobs()
      return jobs.find(job => job.id === id) || null
    } catch (error) {
      console.error('Error fetching job by ID:', error)
      throw new Error('Failed to load job details')
    }
  }

  async getJobsByStatus(status: string): Promise<Job[]> {
    try {
      const jobs = await this.getAllJobs()
      return jobs.filter(job => job.status === status)
    } catch (error) {
      console.error('Error fetching jobs by status:', error)
      throw new Error('Failed to load jobs by status')
    }
  }

  searchJobs(jobs: Job[], query: string): Job[] {
    if (!query.trim()) return []

    const searchTerm = query.toLowerCase()
    return jobs.filter(job =>
      job.name.toLowerCase().includes(searchTerm) ||
      job.description.toLowerCase().includes(searchTerm) ||
      job.client.toLowerCase().includes(searchTerm) ||
      job.created_by.toLowerCase().includes(searchTerm) ||
      job.job_number.toLowerCase().includes(searchTerm)
    )
  }
}
