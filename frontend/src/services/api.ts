 /**
 * services/api.ts — Axios API client.
 * AWS credentials are passed per-request, never stored.
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import type {
  ScanSummary, VulnerabilitiesResponse, AlertsResponse,
  LogAnalysisResult, AdvisorResponse, AuthToken, LoginCredentials,
} from '@/types'
import { isTokenExpired } from '@/utils/security'

// In-memory token store — never touches localStorage
let _accessToken: string | null = null
let _onUnauthorized: (() => void) | null = null

export const tokenStore = {
  set: (token: string) => { _accessToken = token },
  get: () => _accessToken,
  clear: () => { _accessToken = null },
}

export const setUnauthorizedHandler = (handler: () => void) => {
  _onUnauthorized = handler
}

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 120_000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (_accessToken && isTokenExpired(_accessToken)) {
      tokenStore.clear()
      _onUnauthorized?.()
      return Promise.reject(new Error('Session expired. Please log in again.'))
    }
    if (_accessToken) {
      config.headers.Authorization = `Bearer ${_accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      tokenStore.clear()
      _onUnauthorized?.()
    }

    // Extract the real error message from the backend
    const data = error.response?.data as { detail?: string | object } | undefined
    let message = 'An error occurred. Please try again.'

    if (data?.detail) {
      if (typeof data.detail === 'string') {
        // Filter out stack traces but keep real error messages
        if (!/Traceback|\.py:|at line \d/i.test(data.detail)) {
          message = data.detail.slice(0, 400)
        } else {
          message = 'A server error occurred.'
        }
      } else if (Array.isArray(data.detail)) {
        // Pydantic validation errors — format them nicely
        message = (data.detail as Array<{ msg: string; loc: string[] }>)
          .map((e) => `${e.loc?.slice(1).join(' → ')}: ${e.msg}`)
          .join('\n')
      }
    } else if (error.message === 'Network Error') {
      message = 'Cannot reach the backend server. Is it running on port 8000?'
    } else if (error.code === 'ECONNABORTED') {
      message = 'Request timed out. The scan may still be running in the background.'
    }

    return Promise.reject({ message, status: error.response?.status })
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(credentials: LoginCredentials): Promise<AuthToken> {
  const params = new URLSearchParams()
  params.append('username', credentials.username.trim())
  params.append('password', credentials.password)
  const response = await api.post<AuthToken>('/auth/token', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return response.data
}

export async function register(credentials: LoginCredentials): Promise<{ username: string; message: string }> {
  const response = await api.post('/auth/register', credentials)
  return response.data
}

// ── AWS Credential types ──────────────────────────────────────────────────────

export interface AWSCredentials {
  access_key_id: string
  secret_access_key: string
  region: string
  session_token?: string
}

export interface ScanRequest {
  credentials: AWSCredentials
  scan_ec2?: boolean
  scan_s3?: boolean
  scan_iam?: boolean
  scan_security_groups?: boolean
  persist_results?: boolean
}

// ── Scan ──────────────────────────────────────────────────────────────────────

export async function verifyAwsCredentials(credentials: AWSCredentials): Promise<{
  status: string
  account_id: string
  user_arn: string
  region: string
}> {
  const response = await api.post('/scan/verify-aws', { credentials })
  return response.data
}

export async function runAwsScan(request: ScanRequest): Promise<ScanSummary> {
  const response = await api.post<ScanSummary>('/scan/aws', request)
  return response.data
}

export async function getVulnerabilities(params?: {
  severity?: string
  status_filter?: string
  limit?: number
}): Promise<VulnerabilitiesResponse> {
  const response = await api.get<VulnerabilitiesResponse>('/scan/vulnerabilities', { params })
  return response.data
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export async function getAlerts(params?: {
  severity?: string
  source?: string
  resolved?: boolean
  limit?: number
}): Promise<AlertsResponse> {
  const response = await api.get<AlertsResponse>('/alerts', { params })
  return response.data
}

export async function acknowledgeAlert(alertId: number): Promise<void> {
  await api.patch(`/alerts/${alertId}/acknowledge`)
}

export async function resolveAlert(alertId: number): Promise<void> {
  await api.patch(`/alerts/${alertId}/resolve`)
}

// ── Log Analysis ──────────────────────────────────────────────────────────────

export async function analyzeLogs(payload: {
  cloudtrail_events?: object[]
  vpc_flow_records?: object[]
  persist_alerts?: boolean
}): Promise<LogAnalysisResult> {
  const response = await api.post<LogAnalysisResult>('/analyze-logs', payload)
  return response.data
}

// ── AI Advisor ────────────────────────────────────────────────────────────────

export async function getAdvisorRecommendation(payload: {
  rule_id?: string
  issue_description?: string
  resource_type?: string
  severity?: string
}): Promise<AdvisorResponse> {
  const response = await api.post<AdvisorResponse>('/advisor', payload)
  return response.data
}

export default api
