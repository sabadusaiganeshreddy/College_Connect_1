export interface CompanySelection {
  companyId?: string;
  companyName: string;
  selectedAt: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  linkedin: string;
  collegeDomain: string;
  selections: CompanySelection[];
  registeredAt: string;
}

export interface CompanyVisit {
  id: string;
  name: string;
  visitDate?: string;
  jobRoles: string[];
  addedBy: string;
  selectedStudents: string[];
  totalSelections?: number;
  addedAt: string;
}

export interface College {
  name: string;
  domain: string;
  students: Student[];
  companies: CompanyVisit[];
  createdAt: string;
}

export interface CollegesData {
  [domainKey: string]: College;
}

export interface RegisterPayload {
  name: string;
  email: string;
  linkedin: string;
  collegeName?: string;
}

export interface RegisterResponse {
  token: string;
  student: Student;
  existing: boolean;
}

export interface SimilarCollege {
  name: string;
  domain: string;
  domainKey: string;
}

export interface AddCompanyPayload {
  name: string;
  visitDate?: string;
  jobRoles: string[];
  selectedForCurrentUser: boolean;
  totalSelections?: number;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;

    if (details && typeof details === 'object' && 'code' in details) {
      this.code = String((details as { code: unknown }).code);
    }
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const token = localStorage.getItem('collegeConnectToken');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body
      ? String((body as { error: unknown }).error)
      : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, body);
  }

  return body as T;
}

export async function fetchPlacementSnapshot(): Promise<CollegesData> {
  const response = await request<{ colleges: CollegesData }>('/api/placement/snapshot');
  return response.colleges;
}

export async function registerStudent(payload: RegisterPayload): Promise<RegisterResponse> {
  return request<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function addCompanyVisit(payload: AddCompanyPayload): Promise<{ companyId: string }> {
  return request<{ companyId: string }>('/api/companies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function toggleCompanySelection(companyId: string): Promise<{ selected: boolean }> {
  return request<{ selected: boolean }>(`/api/companies/${companyId}/toggle-selection`, {
    method: 'POST',
  });
}

export function subscribeToPlacementEvents(onUpdate: () => void): () => void {
  const source = new EventSource(`${API_BASE_URL}/api/events`);
  source.addEventListener('placement-update', onUpdate);

  source.onerror = () => {
    source.close();
  };

  return () => source.close();
}

