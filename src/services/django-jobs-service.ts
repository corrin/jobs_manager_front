import axios from 'axios'

const API_BASE = '/quoting/api/'

export interface DjangoJob {
  id: string
  next_run_time: string | null
  job_state: string
}

export interface DjangoJobExecution {
  id: number
  job_id: string
  status: string
  run_time: string
  duration: number | null
  exception: string | null
  traceback: string | null
}

export async function getDjangoJobs(): Promise<DjangoJob[]> {
  const res = await axios.get(`${API_BASE}django-jobs/`)
  return res.data
}

export async function createDjangoJob(data: DjangoJob): Promise<DjangoJob> {
  const res = await axios.post(`${API_BASE}django-jobs/`, data)
  return res.data
}

export async function updateDjangoJob(id: string, data: Partial<DjangoJob>): Promise<DjangoJob> {
  const res = await axios.put(`${API_BASE}django-jobs/${id}/`, data)
  return res.data
}

export async function deleteDjangoJob(id: string): Promise<void> {
  await axios.delete(`${API_BASE}django-jobs/${id}/`)
}

export async function getDjangoJobExecutions(
  params: Record<string, unknown> = {},
): Promise<DjangoJobExecution[]> {
  const res = await axios.get(`${API_BASE}django-job-executions/`, { params })
  return res.data
}
