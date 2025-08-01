import { Zodios } from '@zodios/core'
import axios from 'axios'
import '@/plugins/axios'
import { endpoints } from './generated/api'

function getApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  return 'http://localhost:8000'
}

let _api: InstanceType<typeof Zodios<typeof endpoints>> | null = null

export function getApi(): InstanceType<typeof Zodios<typeof endpoints>> {
  if (!_api) {
    _api = new Zodios(getApiBaseUrl(), endpoints, { axiosInstance: axios })
  }
  return _api
}

export const api = getApi()
