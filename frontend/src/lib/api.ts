const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  environment: string
  database: string
  storage: {
    driver: string
    status: string
  }
  system: {
    python_version: string
    platform: string
    retention_policy_minutes: number
    max_upload_mb: number
  }
}

export interface ToolMetadata {
  tool_id: string
  name: string
  supported_inputs: string[]
  output_extension: string
  output_mime_type: string
}

export interface UploadedFile {
  id: string
  original_filename: string
  file_size_bytes: number
  mime_type: string
  file_hash?: string
  page_count?: number
  is_blank?: boolean
  created_at: string
  expires_at: string
}

export interface ConversionJob {
  id: string
  tool_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  error_message?: string
  input_file_ids: string[]
  output_file_id?: string
  options: Record<string, unknown>
  created_at: string
  updated_at: string
}

export async function fetchHealth(): Promise<HealthData> {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) {
    throw new Error(`Failed to fetch health status: ${res.statusText}`)
  }
  return res.json()
}

export async function fetchTools(): Promise<ToolMetadata[]> {
  const res = await fetch(`${API_BASE}/tools`)
  if (!res.ok) {
    throw new Error(`Failed to fetch tools: ${res.statusText}`)
  }
  const body: ApiResponse<ToolMetadata[]> = await res.json()
  return body.data
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}/files/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null)
    throw new Error(errorBody?.detail || `Upload failed: ${res.statusText}`)
  }

  const body: ApiResponse<UploadedFile> = await res.json()
  return body.data
}

export async function createJob(
  toolId: string,
  inputFileIds: string[],
  options: Record<string, unknown> = {}
): Promise<ConversionJob> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool_id: toolId,
      input_file_ids: inputFileIds,
      options,
    }),
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null)
    throw new Error(errorBody?.detail || `Job creation failed: ${res.statusText}`)
  }

  const body: ApiResponse<ConversionJob> = await res.json()
  return body.data
}

export async function fetchJob(jobId: string): Promise<ConversionJob> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch job status: ${res.statusText}`)
  }
  const body: ApiResponse<ConversionJob> = await res.json()
  return body.data
}

export function getDownloadUrl(fileId: string): string {
  return `${API_BASE}/files/${fileId}/download`
}

export interface RecommendationItem {
  tool_id: string
  title: string
  reason: string
}

export interface FileInspectionResponse {
  filename: string
  file_size_bytes: number
  page_count: number
  pdf_version: string
  is_encrypted: boolean
  has_javascript: boolean
  has_annotations: boolean
  has_forms: boolean
  metadata: Record<string, string>
  privacy_score: number
  risk_level: 'Low Risk' | 'Medium Risk' | 'High Risk' | string
  recommendations: RecommendationItem[]
}

export async function inspectPdf(file: File): Promise<FileInspectionResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}/files/inspect`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null)
    throw new Error(errorBody?.detail || `Inspection failed: ${res.statusText}`)
  }

  const body: ApiResponse<FileInspectionResponse> = await res.json()
  return body.data
}
