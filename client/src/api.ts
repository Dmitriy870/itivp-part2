export type CourseInput = {
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

export type Course = CourseInput & { id: string; createdBy: string };

export type CoursePage = {
  data: Course[];
  pagination: { page: number; limit: number; total: number; pages: number };
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

export type Certificate = {
  id: string;
  number: string;
  issuedAt: string;
  courseId: string;
  courseTitle?: string;
};

export type VerifiedCertificate = Certificate & {
  valid: true;
  studentEmail: string;
};

export type LearningPlan = {
  course: { id: string; title: string };
  lessons: Array<{
    id: string;
    title: string;
    position: number;
    durationMinutes: number;
    completed: boolean;
  }>;
  progress: { completed: number; total: number; percent: number };
  certificate: Certificate | null;
};

export type WebinarInput = {
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingUrl: string;
};

export type Webinar = Omit<WebinarInput, 'meetingUrl'> & {
  id: string;
  courseId: string;
  courseTitle: string;
  meetingUrl: string | null;
};

type ValidationDetail = { field: string; message: string };

type ApiErrorBody = {
  error?: { code?: string; message?: string; details?: ValidationDetail[] };
};

const apiBase = import.meta.env.VITE_USE_API_PROXY === 'true'
  ? '/api'
  : (import.meta.env.VITE_API_URL?.trim() || '/api').replace(/\/+$/, '');
let accessToken = '';
let refreshing: Promise<User> | undefined;

export class ApiError extends Error {
  constructor(public status: number, message: string, public details: ValidationDetail[] = []) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit, canRetry = true): Promise<T> {
  const token = accessToken;
  const response = await fetch(`${apiBase}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as ApiErrorBody;
    if (canRetry && token && response.status === 401 && body.error?.code === 'INVALID_ACCESS_TOKEN') {
      if (token === accessToken) await restoreSession();
      return request<T>(path, init, false);
    }
    throw new ApiError(response.status, body.error?.message || 'Ошибка запроса', body.error?.details);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getCourses(search: string, format: string, options: {
  limit?: number; page?: number; mine?: boolean; signal?: AbortSignal;
} = {}) {
  const query = new URLSearchParams({
    limit: String(options.limit ?? 12),
    page: String(options.page ?? 1),
  });
  if (search.trim()) query.set('search', search.trim());
  if (format) query.set('format', format);
  const path = options.mine ? '/courses/mine' : '/courses';
  return request<CoursePage>(`${path}?${query}`, { signal: options.signal });
}

export function getCourse(id: string, signal?: AbortSignal) {
  return request<{ data: Course }>(`/courses/${encodeURIComponent(id)}`, { signal });
}

export function saveCourse(input: CourseInput, id?: string) {
  return request<{ data: Course }>(id ? `/courses/${encodeURIComponent(id)}` : '/courses', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteCourse(id: string) {
  return request<void>(`/courses/${encodeURIComponent(id)}`, { method: 'DELETE' });
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
  refreshing ??= request<{ data: { user: User; accessToken: string } }>('/auth/refresh', {
    method: 'POST',
  }, false)
    .then((result) => {
      accessToken = result.data.accessToken;
      return result.data.user;
    })
    .finally(() => { refreshing = undefined; });
  return refreshing;
}

export async function logout() {
  await refreshing?.catch(() => undefined);
  try {
    await request<void>('/auth/logout', { method: 'POST' }, false);
  } finally {
    accessToken = '';
  }
}

export function getMyEnrollments(signal?: AbortSignal) {
  return request<{ data: Enrollment[] }>('/enrollments/me', { signal });
}

export function enrollInCourse(courseId: string) {
  return request<{ data: Enrollment }>(`/enrollments/${courseId}`, { method: 'POST' });
}

export function cancelEnrollment(courseId: string) {
  return request<void>(`/enrollments/${courseId}`, { method: 'DELETE' });
}

export function getLearningPlan(courseId: string) {
  return request<{ data: LearningPlan }>(`/learning/${courseId}`);
}

export function completeLesson(courseId: string, lessonId: string) {
  return request<{ data: Pick<LearningPlan, 'progress' | 'certificate'> }>(
    `/learning/${courseId}/lessons/${lessonId}/complete`,
    { method: 'POST' },
  );
}

export function getCertificates() {
  return request<{ data: Certificate[] }>('/certificates/me');
}

export function getUpcomingWebinars(courseId?: string, signal?: AbortSignal) {
  const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : '';
  return request<{ data: Webinar[] }>(`/webinars${query}`, { signal });
}

export function getWebinar(id: string, signal?: AbortSignal) {
  return request<{ data: Webinar }>(`/webinars/${encodeURIComponent(id)}`, { signal });
}

export function getManagedWebinars(courseId: string, signal?: AbortSignal) {
  return request<{ data: Webinar[] }>(`/webinars/manage/${encodeURIComponent(courseId)}`, { signal });
}

export function saveWebinar(courseId: string, input: WebinarInput, webinarId?: string) {
  const basePath = `/webinars/manage/${encodeURIComponent(courseId)}`;
  return request<{ data: Webinar }>(webinarId ? `${basePath}/${encodeURIComponent(webinarId)}` : basePath, {
    method: webinarId ? 'PUT' : 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteWebinar(courseId: string, webinarId: string) {
  return request<void>(`/webinars/manage/${encodeURIComponent(courseId)}/${encodeURIComponent(webinarId)}`, {
    method: 'DELETE',
  });
}

export function verifyCertificate(number: string) {
  return request<{ data: VerifiedCertificate }>(`/certificates/verify/${encodeURIComponent(number)}`);
}
