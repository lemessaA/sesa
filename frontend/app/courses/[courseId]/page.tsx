'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import CoursePage from '@/views/CoursePage';
export default function CourseIdPage() {
    return (<ProtectedRoute wrapLayout><CoursePage /></ProtectedRoute>);
}
