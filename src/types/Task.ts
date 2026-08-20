// Spring Boot 에서 넘어오는 Task 데이터 타입 정의
export interface Task {
    id: number;
    userId: number;
    title: string;
    planDate: Date;
    categoryId: number;
    isComplete: boolean;
    createdAt: Date;
}