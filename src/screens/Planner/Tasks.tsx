import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SectionList, ScrollView, TextInput, Alert, Modal } from 'react-native';
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

    // 상태 추가
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    // 수정 모달 상태
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editTarget, setEditTarget] = useState<Task | null>(null);
    const [editDate, setEditDate] = useState<Date>(new Date());
    const [editCategoryId, setEditCategoryId] = useState<number | null>(null);

    // 카테고리 목록을 불러왔을 때 첫 번째 카테고리를 기본 선택 상태로 만듦
    useEffect(() => {
        if (categories.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(categories[0].id);
        }
    }, [categories]);

    // 할 일 등록 핸들러
    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) {
            alert("할 일을 입력해주세요.");
            return;
        }
        if (!selectedCategoryId) {
            alert("카테고리를 선택해주세요.");
            return;
        }

        try {
            const dateString = formatDateToYYYYMMDD(currentDate);

            // POST 요청
            const response = await api.post<Task>('/api/task', {
                title: newTaskTitle,
                planDate: dateString,
                categoryId: selectedCategoryId
            });

            // 기존 목록에 새 할 일 추가
            setTasks((prev) => [...prev, response.data]);

            // 입력창 초기화
            setNewTaskTitle('');
        } catch (error) {
            console.error("할 일 추가 실패 : ", error);
        }
    }

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

    
    // 체크박스 토글 핸들러
    const handleToggleComplete = async (taskId: number) => {
        try {
            // 백엔드에 토글 PATCH 요청
            const response = await api.patch<Task>(`/api/task/${taskId}/toggle`);

            // 프론트 상태 업데이트
            setTasks((prevTasks) => 
                prevTasks.map((task) =>
                    // 수정된 할 일 덮어쓰기
                    task.id === taskId ? response.data : task
                )
            );
        } catch (error) {
            console.error("완료 상태 변경 실패 : ", error);
        }
    };

    // 등록된 플랜 삭제
    const handleDeleteTask = (taskId: number) => {
        Alert.alert("삭제", "해당 내용을 삭제할까요?", [
            { text: "취소", style: "cancel" }, 
            {
                text: "삭제",
                style: "destructive",
                onPress: async () => {
                    try {
                        await api.delete(`/api/task/${taskId}`);
                        setTasks((prev) => prev.filter(task => task.id !== taskId));
                    } catch (error) {
                        console.error("삭제 실패:", error);
                        Alert.alert("오류", "삭제에 실패했습니다.");
                    }
                }
            }
        ])
    };

    // 수정 모달
    const openEditModal = (task: Task) => {
        setEditTarget(task);
        setEditDate(new Date(task.planDate)); // 기존 날짜
        setEditCategoryId(task.categoryId); // 기존 카테고리 세팅
        setIsModalVisible(true);
    };

    // 날짜/카테고리 수정 반영 핸들러
    const handleUpdateSchedule = async () => {
        if (!editTarget || !editCategoryId) return;

        const newDateString = formatDateToYYYYMMDD(editDate);

        try {
            const response = await api.patch<Task>(`/api/task/${editTarget.id}/schedule`, {
                planDate: newDateString,
                categoryId: editCategoryId
            });

            if (newDateString !== formatDateToYYYYMMDD(currentDate)) {
                setTasks((prev) => prev.filter(task => task.id !== editTarget.id));
            } else {
                setTasks((prev) => prev.map(task =>
                    task.id === editTarget.id ? response.data: task
                ));
            }
            setIsModalVisible(false);
        } catch(error) {
            console.error("일정 변경 실패:", error);
            Alert.alert("오류", "일정 변경을 실패했습니다.");
        }
    }

    // 리스트 항목 렌더링
    const renderTaskItem = ({item}: {item: Task}) => (
        <View style={styles.taskItem}>
            <View style={styles.taskItem}>
                {/* 체크박스 영역 */}
                <TouchableOpacity 
                    style={[styles.checkbox, item.isComplete && styles.checkboxChecked]} 
                    onPress={() => handleToggleComplete(item.id)}
                    activeOpacity={0.7}
                />
                <Text style={[styles.taskTitle, item.isComplete && styles.taskTitleCompleted]}>
                    {item.title}
                </Text>
            </View>

            {/* 우측 수정, 삭제 버튼 그룹 */}
            <View style={styles.taskActions}>
                <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}>
                    <Text style={styles.editBtnText}>이동</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteTask(item.id)}>
                    <Text style={styles.deleteBtnText}>삭제</Text>
                </TouchableOpacity>
            </View>
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

            {/* 하단 할 일 입력 영역 */}
            <View style={styles.inputContainer}>
                {/* 카테고리 선택 영역 */}
                <ScrollView
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScroll}
                >
                    {
                        categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryChip,
                                    selectedCategoryId === cat.id && styles.categoryChipSelected
                                ]}
                                onPress={() => setSelectedCategoryId(cat.id)}
                            >
                                <Text
                                    style={[
                                        styles.categoryChipText,
                                        selectedCategoryId === cat.id && styles.categoryChipTextSelected
                                    ]}
                                >
                                    {cat.categoryName}
                                </Text>
                            </TouchableOpacity>
                        ))}
                </ScrollView>

                {/* 할 일 입력창 영역 */}
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.textInput}
                        placeholder={`${formatDateToYYYYMMDD(currentDate)} 할 일 추가...`}
                        value={newTaskTitle}
                        onChangeText={setNewTaskTitle}
                        onSubmitEditing={handleAddTask}
                        returnKeyType="done"
                    />
                    <TouchableOpacity style={styles.submitBtn} onPress={handleAddTask}>
                        <Text style={styles.submitBtnText}>등록</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 일정 변경 모달 */}
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>일정 및 카테고리 이동</Text>
                        <Text style={styles.modalSubTitle}>'{editTarget?.title}'</Text>
                    
                        {/* 날짜 변경 영역 */}
                        <View style={styles.dateSelector}>
                            <TouchableOpacity onPress={() => {
                                const prev = new Date(editDate);
                                prev.setDate(prev.getDate() - 1);
                                setEditDate(prev);
                            }} style={styles.arrowButton}>
                                <Text style={styles.arrowText}>{'<'}</Text>
                            </TouchableOpacity>
                            <Text style={styles.dateText}>{formatDateToYYYYMMDD(editDate)}</Text>
                            <TouchableOpacity onPress={() => {
                                const next = new Date(editDate);
                                next.setDate(next.getDate() + 1);
                                setEditDate(next);
                            }} style={styles.arrowButton}>
                                <Text style={styles.arrowText}>{'>'}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* 카테고리 변경 영역 */}
                        <View style={styles.modalCategoryWrap}>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.categoryChip,
                                        editCategoryId === cat.id && styles.categoryChipSelected
                                    ]}
                                    onPress={() => setEditCategoryId(cat.id)}
                                >
                                    <Text style={[
                                        styles.categoryChipText,
                                        editCategoryId === cat.id && styles.categoryChipTextSelected
                                    ]}>
                                        {cat.categoryName}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* 버튼 영역 */}
                        <View style={styles.modalButtonGroup}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsModalVisible(false)}>
                                <Text style={styles.modalBtnText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleUpdateSchedule}>
                                <Text style={styles.modalBtnTextWhite}>저장</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        justifyContent: 'space-between',
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
    tastLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
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
    inputContainer: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E9ECEF',
    },
    categoryScroll: {
        marginBottom: 12,
    },
    categoryChip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#F1F3F5',
        borderRadius: 20,
        marginRight: 8,
    },
    categoryChipSelected: {
        backgroundColor: '#4DABF7', // 선택된 카테고리 색상
    },
    categoryChipText: {
        fontSize: 14,
        color: '#495057',
    },
    categoryChipTextSelected: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textInput: {
        flex: 1,
        height: 44,
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#CED4DA',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginRight: 10,
        fontSize: 15,
    },
    submitBtn: {
        backgroundColor: '#4DABF7',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
    taskActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: { padding: 4 },
    editBtnText: { color: '#4DABF7', fontSize: 13 },
    deleteBtnText: { color: '#FF6B6B', fontSize: 13 },

    // 모달 스타일
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
    modalSubTitle: { fontSize: 14, color: '#868E96', marginBottom: 20, textAlign: 'center' },
    modalCategoryWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginVertical: 20,
    },
    modalButtonGroup: { flexDirection: 'row', gap: 10 },
    modalCancelBtn: { flex: 1, padding: 12, backgroundColor: '#E9ECEF', borderRadius: 8, alignItems: 'center' },
    modalSaveBtn: { flex: 1, padding: 12, backgroundColor: '#4DABF7', borderRadius: 8, alignItems: 'center' },
    modalBtnText: { fontSize: 16, color: '#495057' },
    modalBtnTextWhite: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
})