// Spring Boot 에서 넘어오는 Todo 데이터 타입 정의
export interface Todo {
    id: number;
    title: string;
    completed: boolean;
    createdAt: Date;
}