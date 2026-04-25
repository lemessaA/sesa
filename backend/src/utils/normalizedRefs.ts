import mongoose from 'mongoose';

type ObjectIdLike = mongoose.Types.ObjectId | string | null | undefined;

type UserCourseRefDoc = {
  userId?: ObjectIdLike;
  user?: ObjectIdLike;
  courseId?: ObjectIdLike;
  course?: ObjectIdLike;
  set?: (path: string, value: ObjectIdLike) => void;
  [key: string]: unknown;
};

const assign = (doc: UserCourseRefDoc, key: 'userId' | 'user' | 'courseId' | 'course', value: ObjectIdLike) => {
  if (typeof doc.set === 'function') {
    doc.set(key, value);
    return;
  }

  doc[key] = value;
};

export const syncUserCourseRefs = (doc: UserCourseRefDoc): void => {
  const userRef = doc.userId || doc.user;
  const courseRef = doc.courseId || doc.course;

  if (userRef) {
    assign(doc, 'userId', userRef);
    assign(doc, 'user', userRef);
  }

  if (courseRef) {
    assign(doc, 'courseId', courseRef);
    assign(doc, 'course', courseRef);
  }
};

export const userRefQuery = (userId: ObjectIdLike) => ({
  $or: [{ userId }, { user: userId }],
});

export const courseRefQuery = (courseId: ObjectIdLike) => ({
  $or: [{ courseId }, { course: courseId }],
});

export const userCourseRefQuery = (userId: ObjectIdLike, courseId: ObjectIdLike) => ({
  $or: [
    { userId, courseId },
    { user: userId, course: courseId },
  ],
});

export const setOnInsertUserCourseRefs = (userId: ObjectIdLike, courseId: ObjectIdLike) => ({
  userId,
  user: userId,
  courseId,
  course: courseId,
});
