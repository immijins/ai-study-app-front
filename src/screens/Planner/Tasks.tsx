import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SectionList, ScrollView, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

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
    useFocusEffect(
        useCallback(() => {
            fetchTasks(currentDate);
        }, [currentDate])
    );

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
        <View style={styles.taskItemBox}>
            <View style={styles.taskItem}>
                {/* 체크박스 영역 */}
                <TouchableOpacity 
                    style={[styles.checkbox, item.isComplete && styles.checkboxChecked]} 
                    onPress={() => handleToggleComplete(item.id)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="checkmark-sharp" size={20} color="white" />
                </TouchableOpacity>
                <Text style={[styles.taskTitle, item.isComplete && styles.taskTitleCompleted]}>
                    {item.title}
                </Text>
            </View>

            {/* 우측 수정, 삭제 버튼 그룹 */}
            <View style={styles.taskActions}>
                <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}>
                    <Ionicons name="ellipsis-horizontal-sharp" size={24} color="#979797" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteTask(item.id)}>
                    <Ionicons name="close-outline" size={24} color="#FF0000" />
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

    // 오늘 달성률 계산
    const totalCount = tasks.length;
    const completedCount = tasks.filter(task => task.isComplete).length;
    const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    return (
        <SafeAreaView 
            style={styles.layout}
            edges={['top', 'left', 'right']}
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}    
            >
                <View 
                    style={styles.container}>
                    {/* 상단 날짜 이동바 */}
                    <View style={styles.dateHeader}>
                        <View style={styles.dateSelector}>
                            <TouchableOpacity onPress={handlePrevDay} style={styles.arrowButton}>
                                <Ionicons name="chevron-back-outline" size={24} color="#999" />
                            </TouchableOpacity>

                            {/* 날짜 화면 표시 */}
                            <Text style={styles.dateText}>{formatDateToYYYYMMDD(currentDate)}</Text>

                            <TouchableOpacity onPress={handleNextDay} style={styles.arrowButton}>
                                <Ionicons name="chevron-forward-outline" size={24} color="#999" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.dateProgress}>
                            <View style={styles.progressText}>
                                <Text style={styles.progressTit}>오늘의 달성률</Text>
                                <Text style={styles.progressTxt}>
                                    <Text style={styles.progressNum}>{completedCount}</Text>/{totalCount}({percentage}%)
                                </Text>
                            </View>
                            {/* 프로그레스 바 */}
                            <View style={styles.barBackground}>
                                <View
                                    style={[
                                        styles.barFill,
                                        { width: `${percentage}%` }
                                    ]}
                                >
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* 할 일 목록 영역 */}
                    <SectionList 
                        sections={sections}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderTaskItem}
                        renderSectionHeader={renderSectionHeader}
                        ListEmptyComponent={<Text style={styles.emptyText}>오늘의 스터디 플랜을 등록해보세요!</Text>}
                        contentContainerStyle={styles.listContent}
                    />

                    {/* 하단 할 일 입력 영역 */}
                    <View 
                        style={styles.inputContainer}>
                        {/* 카테고리 선택 영역 */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={true}
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
                                placeholder={`${formatDateToYYYYMMDD(currentDate)} 의 플랜을 입력하세요.`}
                                value={newTaskTitle}
                                onChangeText={setNewTaskTitle}
                                onSubmitEditing={handleAddTask}
                                returnKeyType="done"
                            />
                            <TouchableOpacity style={styles.submitBtn} onPress={handleAddTask}>
                                <Ionicons name="arrow-up" size={24} color="white" />
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
                            <Text style={styles.modalTitle}>수정하기</Text>
                            <View style={styles.modalList}>
                                <View style={styles.modalListBox}>
                                    <Text style={styles.modalSubTit}>항목명</Text>
                                    <View style={styles.modalTxtBox}>
                                        <Text>{editTarget?.title}</Text>
                                    </View>
                                </View>
                                <View style={styles.modalListBox}>
                                    <Text style={styles.modalSubTit}>날짜 변경</Text>
                                    <View style={styles.modalDateBox}>
                                        {/* 날짜 변경 영역 */}
                                        <View style={styles.modalDateSelector}>
                                            <TouchableOpacity onPress={() => {
                                                const prev = new Date(editDate);
                                                prev.setDate(prev.getDate() - 1);
                                                setEditDate(prev);
                                            }} style={styles.arrowButton}>
                                                <Ionicons name="chevron-back-outline" size={24} color="#999" />
                                            </TouchableOpacity>
                                            <Text style={styles.dateText}>{formatDateToYYYYMMDD(editDate)}</Text>
                                            <TouchableOpacity onPress={() => {
                                                const next = new Date(editDate);
                                                next.setDate(next.getDate() + 1);
                                                setEditDate(next);
                                            }} style={styles.arrowButton}>
                                                <Ionicons name="chevron-forward-outline" size={24} color="#999" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.modalListBox}>
                                    <Text style={styles.modalSubTit}>카테고리 변경</Text>
                                    {/* 카테고리 변경 영역 */}
                                    <ScrollView 
                                        horizontal
                                        showsHorizontalScrollIndicator={true}
                                        style={styles.modalCategoryWrap}>
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
                                    </ScrollView>
                                </View>
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
            </KeyboardAvoidingView>
        </SafeAreaView>
    )

}

const styles = StyleSheet.create({
    layout: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    container: {
        flex: 1,
    },
    dateHeader: {
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#ECECEC',
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 16
    },


    dateSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    arrowButton: {
        paddingHorizontal: 20,
    },
    dateText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#444',
        width: 120,
        textAlign: 'center',
    },
    listContent: {
        padding: 20,
        flex: 1,
        backgroundColor: '#EBF1F5',
    },
    taskItemBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        height: 55,
        borderRadius: 12,
        paddingLeft: 12,
        paddingRight: 12,
        marginBottom: 15
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
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
        borderColor: '#FFB497',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    checkboxChecked: {
        backgroundColor: '#FFB497',
        borderColor: '#FFB497',
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
        marginBottom: 10
    },
    sectionHeaderText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#444',
    },

    // 하단 할 일 입력 영역
    inputContainer: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#ECECEC',
        marginBottom: 22
    },
    categoryScroll: {
        marginBottom: 10,
        flexDirection: 'row'
    },
    categoryChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#d2d2d2'
    },
    categoryChipSelected: {
        backgroundColor: '#60B9A6',
        borderColor: '#60B9A6'
    },
    categoryChipTextSelected: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    categoryChipText: {
        fontSize: 13,
        color: '#c1c1c1'
    },
    
    // 입력창 영역
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        borderRadius: 50,
        paddingLeft: 10,
        paddingRight: 6,
        borderColor: '#D9D9D9'
    },
    textInput: {
        flex: 1,
        height: 45
    },
    submitBtn: {
        backgroundColor: '#60B9A6',
        height: 35,
        width: 35,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50
    },
    submitBtnText: {
        color: '#FFFFFF',
        
    },
    taskActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },

    // 오늘의 달성률
    dateProgress: {
        flexDirection: 'column',
        gap: 10,
    },
    progressText: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    progressTit: {
        color: '#666',
    },
    progressTxt: {
        color: '#666'
    },
    progressNum: {
        color: '#60B9A6',
        fontWeight: 'bold'
    },

    // 프로그레스 바
    barBackground: {
        width: '100%',
        height: 15,
        backgroundColor: '#EFEFEF',
        borderRadius: 20,
        overflow: 'hidden'
    },
    barFill: {
        height: '100%',
        backgroundColor: '#60B9A6',
        borderRadius: 20
    },


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
        borderRadius: 12
    },
    modalTitle: {
        fontSize: 18,
        textAlign: 'center',
        color: '#444',
        fontWeight: 'bold',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ECECEC',
        padding: 14
    },
    modalList: {
        flexDirection: 'column',
        gap: 15,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 5
    },
    modalSubTit: {
        fontSize: 14,
        color: '#666'
    },
    modalTxtBox: {
        width: '100%',
        height: 45,
        borderWidth: 1,
        borderColor: '#ECECEC',
        backgroundColor: '#f4f4f4',
        borderRadius: 8,
        justifyContent: 'center',
        paddingLeft: 12,
        paddingRight: 12
    },
    modalListBox: {
        flexDirection: 'column',
        gap: 10,
    },
    modalDateBox: {
        flexDirection: 'column',
        gap: 5
    },
    modalDateSelector: {
        flexDirection: 'row',
        height: 35,
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalCategoryWrap: {
        flexWrap: 'wrap'
    },
    modalButtonGroup: {
        flexDirection: 'row',
        padding: 16,
        gap: 10,
        marginTop: 10
    },
    modalCancelBtn: {
        flex: 1,
        height: 45,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 60,
        backgroundColor: '#f9f9f9'
    },
    modalBtnText: {
        color: '#888'
    },
    modalSaveBtn: {
        flex: 1,
        height: 45,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 60,
        backgroundColor: '#FF7467',
    },
    modalBtnTextWhite: {
        color: '#fff'
    }

})