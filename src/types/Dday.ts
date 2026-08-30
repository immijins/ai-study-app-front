// Spring Boot에서 넘어오는 Dday 데이터 타입
export interface Dday {
    id: number;
    userId: number;
    title: string;
    dayDate: Date;
    createdAt: Date;
}