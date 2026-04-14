// types/index.ts — Shared TypeScript interfaces for the entire application

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info'
export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Minimal'
export type AlertSource = 'misconfiguration' | 'log_anomaly' | 'ml'
export type AssetType = 'ec2' | 's3' | 'iam_user' | 'iam_role' | 'security_group'

// ── Auth ────────────────────────────────────────────────────────────────────

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthToken {
  access_token: string
  token_type: string
}

export interface AuthUser {
  username: string
  role: string
}

// ── Scan ────────────────────────────────────────────────────────────────────

export interface ScanSummary {
  status: string
  scanned_by: string
  aws_account_id?: string
  aws_identity?: string
  region?: string
  summary: {
    ec2_instances: number
    s3_buckets: number
    iam_users: number
    iam_roles: number
    security_groups: number
  }
  vulnerabilities_found: number
  resources_scored: number
  risk_scores_sample: RiskScore[]
}

// ── Vulnerabilities ─────────────────────────────────────────────────────────

export interface Vulnerability {
  id: number
  asset_id: string
  resource_type: string
  issue: string
  severity: Severity
  rule_id: string
  remediation: string
  risk_score: number
  status: string
  detected_at: string
}

export interface VulnerabilitiesResponse {
  total: number
  vulnerabilities: Vulnerability[]
}

// ── Risk Scores ─────────────────────────────────────────────────────────────

export interface RiskScore {
  resource_id: string
  resource_type: string
  risk_score: number
  risk_level: RiskLevel
}

export interface RiskScoreRequest {
  resource_id: string
  resource_type: string
  public_access: number
  open_ports: number
  encryption_enabled: number
  iam_privilege_level: number
  mfa_enabled: number
  logging_enabled: number
}

// ── Alerts ───────────────────────────────────────────────────────────────────

export interface Alert {
  id: number
  title: string
  description: string
  severity: Severity
  source: AlertSource
  resource_id: string
  resource_type: string
  remediation_advice: string
  is_acknowledged: boolean
  is_resolved: boolean
  created_at: string
}

export interface AlertsResponse {
  total: number
  alerts: Alert[]
}

// ── Log Analysis ─────────────────────────────────────────────────────────────

export interface CloudTrailEvent {
  eventTime: string
  eventName: string
  userIdentity: { arn: string }
  awsRegion: string
  sourceIPAddress: string
  errorCode?: string
}

export interface LogAnomaly {
  user_identity: string
  api_call_count: number
  failed_logins: number
  hour_of_day: number
  is_new_region: boolean
  anomaly: boolean
  anomaly_score: number
  anomaly_reason: string
}

export interface LogAnalysisResult {
  status: string
  total_events_analyzed: number
  total_anomalies_found: number
  alerts_created: number
  cloudtrail_anomalies: LogAnomaly[]
  vpc_anomalies: LogAnomaly[]
}

// ── Advisor ───────────────────────────────────────────────────────────────────

export interface AdvisorResponse {
  source: 'rule_based' | 'llm'
  risk?: string
  recommendation: string
  severity?: string
  effort?: string
  priority?: number
}

// ── API Error ─────────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string
  status?: number
}
