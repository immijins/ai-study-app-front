import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SectionList } from 'react-native';
import { api } from '../../api/api';
import { Task } from '../../types/Task';
import { Category } from '../../types/Category';

// 날짜를 YYYY-MM-DD 형식의 문자열로 변환하는 함수
const formatDateToYYYYMMDD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`
}

export default function Tasks() {
    // 상태 관리
    const [currentDate, setCurrentDate] = useState<Date>(new Date()); // 현재 선택된 날짜
    const [tasks, setTasks] = useState<Task[]>([]); // 할 일 목록 

    // 카테고리
    const [categories, setCategories] = useState<Category[]>([]);

    // Category 목록 불러오기 (GET)
    const fetchCategories = async () => {
        try {
            const response = await api.get<Category[]>('/api/category');
            setCategories(response.data);
        } catch (error) {
            console.error('불러오기 실패 :', error);
        } 
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // API 데이터 호출
    const fetchTasks = async (date: Date) => {
        const dateString = formatDateToYYYYMMDD(date);
        try {
            const response = await api.get<Task[]>(`/api/task?date=${dateString}`);
            setTasks(response.data);
        } catch (error) {
            console.error("할 일 목록 불러오기 실패 :", error);
        }
    };

    // currentDate가 변경될 때마다 fetchTasks 실행
    useEffect(() => {
        fetchTasks(currentDate);
    }, [currentDate]);

    // 카테고리순으로 정렬
    const sections = useMemo(() => {
        // categoryId를 키로 객체 묶음
        const grouped = tasks.reduce((acc, task) => {
            if (!acc[task.categoryId]) {
                acc[task.categoryId] = [];
            }
            acc[task.categoryId].push(task);
            return acc;
        }, {} as Record<number, Task[]>);

        return Object.keys(grouped).map(key => {
            const catId = Number(key);

            const categoryName = categories.find(c => c.id === catId)?.categoryName || '미지정';

            return {
                title: categoryName, 
                data: grouped[catId]
            };
        });
    }, [tasks, categories]);

    // 날짜 이동 핸들러
    const handlePrevDay = () => {
        const prev = new Date(currentDate);
        prev.setDate(prev.getDate() - 1);
        setCurrentDate(prev);
    };

    const handleNextDay = () => {
        const next = new Date(currentDate);
        next.setDate(next.getDate() + 1);
        setCurrentDate(next);
    };

    // 리스트 항목 렌더링
    const renderTaskItem = ({item}: {item: Task}) => (
        <View style={styles.taskItem}>
            {/* 체크박스 영역 */}
            <TouchableOpacity style={[styles.checkbox, item.isComplete && styles.checkboxChecked]} />
            <Text style={[styles.taskTitle, item.isComplete && styles.taskTitleCompleted]}>
                {item.title}
            </Text>
        </View>
    );

    // 카테고리명 렌더링
    const renderSectionHeader = ({ section: {title} } : {section: {title: string}}) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    )

    return (
        <View style={styles.container}>
            {/* 상단 날짜 이동바 */}
            <View style={styles.dateSelector}>
                <TouchableOpacity onPress={handlePrevDay} style={styles.arrowButton}>
                    <Text style={styles.arrowText}>{'<'}</Text>
                </TouchableOpacity>

                {/* 날짜 화면 표시 */}
                <Text style={styles.dateText}>{formatDateToYYYYMMDD(currentDate)}</Text>

                <TouchableOpacity onPress={handleNextDay} style={styles.arrowButton}>
                    <Text style={styles.arrowText}>{'>'}</Text>
                </TouchableOpacity>
            </View>

            {/* 할 일 목록 영역 */}
            <SectionList 
                sections={sections}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderTaskItem}
                renderSectionHeader={renderSectionHeader}
                ListEmptyComponent={<Text style={styles.emptyText}>등록된 계획이 없습니다.</Text>}
                contentContainerStyle={styles.listContent}
            />
        </View>
    )

}

const styles = StyleSheet.create({
container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    dateSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
    },
    arrowButton: {
        paddingHorizontal: 20,
    },
    arrowText: {
        fontSize: 20,
        color: '#495057',
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
        width: 120,
        textAlign: 'center',
    },
    listContent: {
        padding: 20,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2, // 안드로이드 그림자
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#CED4DA',
        marginRight: 12,
    },
    checkboxChecked: {
        backgroundColor: '#4DABF7',
        borderColor: '#4DABF7',
    },
    taskTitle: {
        fontSize: 16,
        color: '#343A40',
    },
    taskTitleCompleted: {
        color: '#ADB5BD',
        textDecorationLine: 'line-through',
    },
    emptyText: {
        textAlign: 'center',
        color: '#868E96',
        marginTop: 40,
    },
    sectionHeader: {
        backgroundColor: '#F8F9FA', // 배경색과 맞춰서 자연스럽게
        paddingVertical: 8,
        marginTop: 10,
        marginBottom: 5,
    },
    sectionHeaderText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#495057',
    },
})