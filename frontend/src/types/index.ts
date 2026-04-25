export enum UserRole {
    SUPER_ADMIN = 'super_admin',
    ADMIN = 'admin',
    MODERATOR = 'moderator',
    INSTRUCTOR = 'instructor',
    ASSISTANT_INSTRUCTOR = 'assistant_instructor',
    STUDENT = 'student',
    PREMIUM_STUDENT = 'premium_student'
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

export interface Course {
    _id: string;
    title: string;
    description: string;
    resourceUrl?: string;
    previewVideoUrl?: string;
    enrolledContentUrls?: string[];
    youtubeVideoId?: string;
    thumbnailUrl?: string;
    price?: number;
    instructor: {
        _id: string;
        name: string;
        email?: string;
        role?: UserRole | string;
    };
    students: {
        studentId: string;
        status: 'pending' | 'approved' | 'rejected';
    }[];
    enrolledStudents?: string[];
    pendingApprovals?: string[];
    createdAt: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
}
