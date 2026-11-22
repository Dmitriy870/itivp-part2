import type { Course, CourseInput, User } from '../api';

export const formatLabels: Record<CourseInput['format'], string> = {
  online: 'Онлайн',
  webinar: 'Вебинар',
  mixed: 'Смешанный',
};

export const MAX_COMPARED_COURSES = 3;

export function canManageCourse(course: Course, user: User | null) {
  return !!user && (user.role === 'admin' || user.id === course.createdBy);
}
