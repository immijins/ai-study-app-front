import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ActivityIndicator, FlatList, TextInput, TouchableOpacity, Alert, Pressable, Platform, Modal } from 'react-native';
import { api } from '../../api/api';
import { Dday } from '../../types/Dday';

import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import DateTimePickerAndroid from '@react-native-community/datetimepicker';

// 날짜를 YYYY-MM-DD 형식의 문자열로 변환하는 함수
const formatDateToYYYYMMDD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`
}

export default function DdayPage() {
    const [ddayList, setDdayList] = useState<Dday[]>([]);
    
    // Dday 추가
    const [inputText, setInputText] = useState<string>('');
    const [dayDate, setDayDate] = useState<Date>(new Date());

    // 팝업
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // 수정
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDate, setEditDate] = useState(new Date());
    const [showEditDatePicker, setShowEditDatePicker] = useState(false);

    const [loding, setLoading] = useState<boolean>(true);

    // Dday 목록 불러오기 (GET)
    const fetchDdayList = async () => {
        try {
            const response = await api.get<Dday[]>('/api/dday');
            setDdayList(response.data);
        } catch (error) {
            console.error('불러오기 실패 :', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDdayList();
    }, []);

    // 날짜 닫기
    const onChangeDate = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setDayDate(selectedDate);
        }
    }

    // Dday 추가하기 (POST)
    const handleAddDday = async () => {
        if (!inputText.trim()) {
            Alert.alert('디데이명을 입력해주세요.');
            return
        }

        try {
            const dateString = formatDateToYYYYMMDD(dayDate);
        
            const response = await api.post<Dday>('/api/dday', {
                title: inputText,
                dayDate: dateString
            });

            // 디데이 추가
            setDdayList((prev) => [...prev, response.data]);

            // 입력창 초기화
            setIsModalVisible(false);
            setInputText('');
            setDayDate(new Date());
        } catch (error) {
            console.log("디데이 추가 실패 :", error);
        }

    }

    // Dday 수정하기 (PUT)
    const handleUpdateDday = async () => {
        if (!editTitle.trim()) {
            Alert.alert('디데이명을 입력해주세요.');
            return;
        }
        try {
            const dateString = formatDateToYYYYMMDD(editDate);

            const response = await api.put<Dday>(`/api/dday/${editId}`, {
                title: editTitle,
                dayDate: dateString
            })

            setDdayList((prev) => prev.map(ddayList =>
                ddayList.id === editId ? response.data : ddayList
            ))

            setEditModalVisible(false);
        } catch (error) {
            console.log("수정 실패 :", error);
        }
    }

    // 디데이 삭제
    const handleDeleteDday = () => {
        Alert.alert("디데이 삭제", "정말로 이 디데이를 삭제하시겠습니까?", [
            { text: "취소", style: 'cancel' },
            {
                text: "삭제",
                style: "destructive",
                onPress: async () => {
                    try {
                        await api.delete(`/api/dday/${editId}`);

                        setDdayList((prev) => prev.filter(dday => dday.id !== editId));
                        setEditModalVisible(false);
                    } catch (error) {
                        console.log("삭제 실패 :", error);
                    }
                }
            }
        ])
    }

    // 디데이 계산
    const calculateDay = (dateString: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(dateString);
        target.setHours(0, 0, 0, 0);
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'D-Day';
        return diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
    }

    // 수정 모달
    const openEditModal = (item: Dday) => {
        setEditId(item.id);
        setEditTitle(item.title);
        setEditDate(new Date(item.dayDate));
        setEditModalVisible(true);
    }

    if (loding) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0000FF" />
            </View>
        )
    }

    return (
        <SafeAreaView
            style={styles.layout}
            edges={['left', 'right']}
        >
            <View style={styles.container}>
                <View style={styles.dayAddList}>
                    <Text style={styles.listTit}>디데이 추가</Text>

                    <Pressable
                        style={styles.dayAddBtn}
                        onPress={() => setIsModalVisible(true)}
                    >
                        <Ionicons name="add" size={22} color="white" />
                        <Text style={styles.dayAddTxt}>디데이 추가하기</Text>
                    </Pressable>

                    {/* 디데이 추가 팝업 */}
                    <Modal
                        animationType='fade'
                        transparent={true}
                        visible={isModalVisible}
                        onRequestClose={() => setIsModalVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>디데이 추가하기</Text>
                                <View style={styles.modalList}>
                                    <View style={styles.modalListBox}>
                                        <Text style={styles.modalSubTit}>항목명</Text>
                                        {/* 디데이명 추가 */}
                                        <TextInput 
                                            style={styles.modalInput}
                                            placeholder='디데이명을 입력하세요.'
                                            value={inputText}
                                            onChangeText={setInputText}
                                        />
                                    </View>

                                    <View style={styles.modalListBox}>
                                        <Text style={styles.modalSubTit}>날짜 선택</Text>
                                        <View style={styles.modalDateBox}>
                                            <Text style={styles.modalDate}>{dayDate.toLocaleDateString()}</Text>
                                            {/* 날짜 선택 */}
                                            <Pressable
                                                style={styles.dateBtn}
                                                onPress={() => setShowDatePicker(true)}
                                            >
                                                <Ionicons name="calendar-outline" size={24} color="#60B9A6" />
                                            </Pressable>
                                        </View>
                                        

                                        {/* 실제 달력 */}
                                        {showDatePicker && (
                                            <DateTimePickerAndroid 
                                                value={dayDate}
                                                mode="date"
                                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                onChange={onChangeDate}
                                            />
                                        )}
                                    </View>

                                </View>

                                {/* 버튼 영역 */}
                                <View style={styles.modalButtonGroup}>
                                    <Pressable style={styles.modalCancelBtn} onPress={() => setIsModalVisible(false)}>
                                        <Text style={styles.modalBtnText}>취소</Text>
                                    </Pressable>
                                    <Pressable style={styles.modalSaveBtn} onPress={handleAddDday}>
                                        <Text style={styles.modalBtnTextWhite}>저장</Text>
                                    </Pressable>
                                </View>

                            </View>
                        </View>
                    </Modal>

                    {/* 디데이 수정/삭제 팝업 */}
                    <Modal
                        animationType='fade'
                        transparent={true}
                        visible={editModalVisible}
                        onRequestClose={() => setIsModalVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>디데이 수정하기</Text>
                                <View style={styles.modalList}>
                                    <View style={styles.modalListBox}>
                                        <Text style={styles.modalSubTit}>항목명</Text>
                                        {/* 디데이명 추가 */}
                                        <TextInput 
                                            style={styles.modalInput}
                                            placeholder='디데이명을 입력하세요.'
                                            value={editTitle}
                                            onChangeText={setEditTitle}
                                        />
                                    </View>

                                    <View style={styles.modalListBox}>
                                        <Text style={styles.modalSubTit}>날짜 선택</Text>
                                        <View style={styles.modalDateBox}>
                                            <Text style={styles.modalDate}>{editDate.toLocaleDateString()}</Text>
                                            {/* 날짜 선택 */}
                                            <Pressable
                                                style={styles.dateBtn}
                                                onPress={() => setShowEditDatePicker(true)}
                                            >
                                                <Ionicons name="calendar-outline" size={24} color="#60B9A6" />
                                            </Pressable>
                                        </View>
                                        

                                        {/* 실제 달력 */}
                                        {showEditDatePicker && (
                                            <DateTimePickerAndroid 
                                                value={editDate}
                                                mode="date"
                                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                onChange={(event: any, selectedDate?: Date) => {
                                                    if (Platform.OS === 'android') setShowEditDatePicker(false);
                                                    if (selectedDate) setEditDate(selectedDate);
                                                }}
                                            />
                                        )}
                                    </View>

                                </View>

                                {/* 버튼 영역 */}
                                <View style={styles.modalButtonGroup}>
                                    <Pressable style={styles.modalDelBtn} onPress={handleDeleteDday}>
                                        <Text style={styles.modalBtnTextWhite}>삭제</Text>
                                    </Pressable>
                                    <Pressable style={styles.modalCancelBtn} onPress={() => setEditModalVisible(false)}>
                                        <Text style={styles.modalBtnText}>취소</Text>
                                    </Pressable>
                                    <Pressable style={styles.modalSaveBtn} onPress={handleUpdateDday}>
                                        <Text style={styles.modalBtnTextWhite}>수정</Text>
                                    </Pressable>
                                </View>

                            </View>
                        </View>
                    </Modal>
                </View>

                <Text style={styles.listTit}>디데이 목록</Text>

                {/* 목록 영역 */}

                <FlatList
                    style={styles.daysList}
                    data={ddayList}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    columnWrapperStyle={styles.rowWrapper}
                    renderItem={({item}: {item:Dday}) => (
                        <TouchableOpacity 
                            style={styles.dayBox}
                            onPress={() => openEditModal(item)}
                            >
                            <Text style={styles.dayTit}>{item.title}</Text>
                            <Text style={styles.dayNum}>{calculateDay(item.dayDate)}</Text>
                        </TouchableOpacity>
                    )}
                >
                </FlatList>
            </View>
        </SafeAreaView>
        
    )
}



const styles = StyleSheet.create({
    layout: {
        flex: 1,
        backgroundColor: '#fff'
    },
    container: { 
        flex: 1, 
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 20,
        backgroundColor: '#F8F9FA',
    },

    listTit: {
        fontSize: 14,
        color: "#888",
        marginBottom: 15
    },

    daysList: {
        
    },
    rowWrapper: {
        justifyContent: 'space-between',
        marginBottom: 16
    },
    dayBox: {
        width: '48%',
        height: 100,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        justifyContent: 'space-between'
    },
    dayTit: {
        color: '#333',
        fontSize: 15,
    },
    dayNum: {
        textAlign: 'right',
        color: '#60B9A6',
        fontSize: 20,
        fontWeight: '800'
    },

    dayAddBtn: {
        width: '100%',
        height: 50,
        backgroundColor: '#60B9A6',
        flexDirection: 'row',
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 20
    },
    dayAddTxt: {
        color: '#fff',
        fontSize: 15
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
    modalButtonGroup: {
        flexDirection: 'row',
        padding: 16,
        gap: 10,
        marginTop: 10
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
    modalListBox: {
        flexDirection: 'column',
        gap: 10,
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
    modalInput: {
        width: '100%',
        height: 45,
        borderWidth: 1,
        borderColor: '#ECECEC',
        borderRadius: 4,
        paddingLeft: 10,
        paddingRight: 10
    },
    modalDateBox: {
        width: '100%',
        height: 45,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
        borderWidth: 1,
        borderColor: '#ECECEC',
        borderRadius: 4
    },
    modalBtnText: {
        color: '#888'
    },
    modalDelBtn: {
        flex: 1,
        height: 45,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 60,
        backgroundColor: "#e45959"
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