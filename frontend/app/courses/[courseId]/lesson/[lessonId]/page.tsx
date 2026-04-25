'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import LessonViewer from '@/views/LessonViewer';
export default function LessonPage() {
    return (<ProtectedRoute wrapLayout><LessonViewer /></ProtectedRoute>);
}
