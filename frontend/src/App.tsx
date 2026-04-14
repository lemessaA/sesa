import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

import GlobalPopup from "./components/GlobalPopup";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";
import SafeEduConcierge from "./components/SafeEduConcierge";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import FAQ from "./pages/FAQ";
import Marketplace from "./pages/Marketplace";
import Payment from "./pages/Payment";
import CoursePage from "./pages/CoursePage";
import LessonViewer from "./pages/LessonViewer";
import BrowseCourses from "./pages/student/BrowseCourses";
import Certificates from "./pages/student/Certificates";
import Resources from "./pages/student/Resources";
import CreateCourse from "./pages/instructor/CreateCourse";
import Students from "./pages/instructor/Students";
import Analytics from "./pages/instructor/Analytics";
import ManageUsers from "./pages/admin/ManageUsers";
import Approvals from "./pages/admin/Approvals";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminInstructors from "./pages/admin/AdminInstructors";
import Categories from "./pages/admin/Categories";
import Settings from "./pages/admin/Settings";
import CoursePreview from "./pages/admin/CoursePreview";
import MyCourses from "./pages/instructor/MyCourses";
import Leaderboard from "./pages/student/Leaderboard";
import NotFound from "./pages/NotFound";
import { UserRole } from "./types";
import "./index.css";
import "./styles/accessibility.css";

const AppRoutes: React.FC = () => {
    const location = useLocation();
    const { isAuthenticated, isLoading } = useAuth();
    const isAppContent = ['/dashboard', '/student', '/instructor', '/admin', '/payment', '/courses'].some(path => location.pathname.startsWith(path));
    const showPublicChrome = isAuthenticated && !isAppContent;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300 flex flex-col">
            {showPublicChrome && <Navbar />}
            {isAuthenticated && <GlobalPopup />}
            <main className="flex-grow">
                <Routes>
                    <Route path="/" element={isAuthenticated ? <Landing /> : <Navigate to="/auth" replace />} />

                    {/* Unified Auth */}
                    <Route 
                        path="/auth" 
                        element={
                            <ProtectedRoute requireGuest>
                                <Login />
                            </ProtectedRoute>
                        } 
                    />
                    <Route path="/login" element={<Navigate to="/auth" replace />} />
                    <Route path="/login/student" element={<Navigate to="/auth?role=student" replace />} />
                    <Route path="/login/instructor" element={<Navigate to="/auth?role=instructor" replace />} />
                    <Route path="/login/admin" element={<Navigate to="/auth?role=admin" replace />} />
                    <Route
                        path="/faq"
                        element={
                            <ProtectedRoute wrapLayout>
                                <FAQ />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/marketplace"
                        element={
                            <ProtectedRoute wrapLayout>
                                <Marketplace />
                            </ProtectedRoute>
                        }
                    />

                    {/* Payment Route */}
                    <Route 
                        path="/payment" 
                        element={
                            <ProtectedRoute wrapLayout>
                                <Payment />
                            </ProtectedRoute>
                        } 
                    />

                    {/* Shared Dashboard with RBAC */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute wrapLayout>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Student Routes */}
                    <Route
                        path="/student/browse"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]} wrapLayout>
                                <BrowseCourses />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student/certificates"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.STUDENT]} wrapLayout>
                                <Certificates />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student/resources"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.STUDENT]} wrapLayout>
                                <Resources />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student/leaderboard"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]} wrapLayout>
                                <Leaderboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Instructor Routes */}
                    <Route
                        path="/instructor/create"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]} wrapLayout>
                                <CreateCourse />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/instructor/create-course"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]} wrapLayout>
                                <CreateCourse />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/instructor/students"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]} wrapLayout>
                                <Students />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/instructor/analytics"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]} wrapLayout>
                                <Analytics />
                            </ProtectedRoute>
                        }
                    />
                     <Route
                        path="/instructor/my-courses"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]} wrapLayout>
                                <MyCourses />
                            </ProtectedRoute>
                        }
                    />

                    {/* Admin Routes */}
                    <Route
                        path="/admin/users"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.ADMIN]} wrapLayout>
                                <ManageUsers />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/instructors"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]} wrapLayout>
                                <AdminInstructors />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/approvals"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MODERATOR]} wrapLayout>
                                <Approvals />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/courses"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MODERATOR]} wrapLayout>
                                <AdminCourses />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/categories"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.ADMIN]} wrapLayout>
                                <Categories />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/courses/:id/preview"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MODERATOR]} wrapLayout>
                                <CoursePreview />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/settings"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.ADMIN]} wrapLayout>
                                <Settings />
                            </ProtectedRoute>
                        }
                    />

                    {/* Smart Enrollment Routes - NEW */}
                    <Route
                        path="/courses/:courseId"
                        element={
                            <ProtectedRoute wrapLayout>
                                <CoursePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/courses/:courseId/lesson/:lessonId"
                        element={
                            <ProtectedRoute wrapLayout>
                                <LessonViewer />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/payment/:courseId"
                        element={
                            <ProtectedRoute wrapLayout>
                                <Payment />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={isAuthenticated ? <NotFound /> : <Navigate to="/auth" replace />} />
                </Routes>
            </main>
            {showPublicChrome && <Footer />}
            {showPublicChrome && <BackToTop />}
            {isAuthenticated && <SafeEduConcierge />}

            {/* Toast Notifications */}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <LanguageProvider>
                <Router>
                    <AppRoutes />
                </Router>
            </LanguageProvider>
        </AuthProvider>
    );
};

export default App;