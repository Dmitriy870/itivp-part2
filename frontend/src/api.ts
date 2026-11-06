export type Course = {
  id: string;
  title: string;
  description: string;
  category: string;
  format: 'online' | 'webinar' | 'mixed';
  durationHours: number;
  price: number;
  certificateIssued: boolean;
  webinarUrl: string | null;
  published: boolean;
};

export type User = {
  id: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
};

export type Enrollment = {
  id: string;
  status: 'active' | 'completed' | 'cancelled';
  courseId: string;
  enrolledAt: string;
  course: Course;
};

type ApiErrorBody = {
  error?: { message?: string; details?: Array<{ field: string; message: string }> };
};

let accessToken = '';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as ApiErrorBody;
    throw new ApiError(response.status, body.error?.message || 'Ошибка запроса');
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getCourses(search: string, format: string) {
  const query = new URLSearchParams({ published: 'true', limit: '50' });
  if (search.trim()) query.set('search', search.trim());
  if (format) query.set('format', format);
  return request<{ data: Course[] }>(`/courses?${query}`);
}

export function getHealth() {
  return request<{
    status: string;
    uptimeSeconds: number;
    database: string;
    release: string;
  }>('/health');
}

export function login(email: string, password: string) {
  return request<{ data: { user: User; accessToken: string } }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }).then((result) => {
    accessToken = result.data.accessToken;
    return result;
  });
}

export function register(email: string, password: string) {
  return request<{ data: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function restoreSession() {
  return request<{ data: { user: User; accessToken: string } }>('/auth/refresh', {
    method: 'POST',
  }).then((result) => {
    accessToken = result.data.accessToken;
    return result.data.user;
  });
}

export function logout() {
  return request<void>('/auth/logout', { method: 'POST' }).finally(() => {
    accessToken = '';
  });
}

export function getMyEnrollments() {
  return request<{ data: Enrollment[] }>('/enrollments/me');
}

export function enrollInCourse(courseId: string) {
  return request<{ data: Enrollment }>(`/enrollments/${courseId}`, { method: 'POST' });
}

export function cancelEnrollment(courseId: string) {
  return request<void>(`/enrollments/${courseId}`, { method: 'DELETE' });
}
