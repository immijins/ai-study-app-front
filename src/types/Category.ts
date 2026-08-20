// Spring Boot 에서 넘어오는 Category 데이터 타입
export interface Category {
    id: number;
    userId: number;
    categoryName: string;
    createdAt: Date;
}