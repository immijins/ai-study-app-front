import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ActivityIndicator, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { api } from '../../api/api';
import { Category } from '../../types/Category';

export default function CategoryPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const [loding, setLoading] = useState<boolean>(true);

    // 카테고리 수정 상태
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState<string>('');

    // 카테고리 1번째(기타)는 수정이나 삭제 불가능하도록 추가 
    
    // 수정 버튼 눌렀을 때 실행
    const startEditing = (id: number, currentName: string) => {
        setEditingId(id);
        setEditName(currentName);
    }

    // Category 목록 불러오기 (GET)
    const fetchCategories = async () => {
        try {
            const response = await api.get<Category[]>('/api/category');
            setCategories(response.data);
        } catch (error) {
            console.error('불러오기 실패 :', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Category 추가하기(POST)
    const handleAddCategories = async () => {
        if (!inputText.trim()) return;

        try {
            const response = await api.post<Category>('/api/category', {categoryName: inputText.trim()});
            setCategories((prev) => [...prev, response.data]);
            setInputText('');
        } catch (error) {
            console.error('추가 실패 :', error);
        }
    }

    // category 수정 (PUT)
    const handleModifyCategories = async (id: number, newName: string) => {
        try {
            const response = await api.put<Category>(`/api/category/${id}`, {
                categoryName: newName
            });

            // 상태 업데이트
            setCategories((prev) => 
                prev.map((categories) => 
                    categories.id === id ? response.data : categories
                )
            );

            // 저장 후 수정 모드 벗어나기
            setEditingId(null);
            setEditName('');

            // Alert.alert("완료", "카테고리가 수정되었습니다.");
        } catch (error) {
            console.error("카테고리 수정 실패 :", error);
        }
    }

    // category 삭제 (DELETE)
    const handleDeleteCategories = async (id: number) => {
        try {
            await api.delete(`/api/category/${id}`); 
            setCategories((prev) => prev.filter((categories) => categories.id !== id));
        } catch (error) {
            console.error('삭제 실패 :', error);
        }
    }

    if (loding) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0000FF" />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Text>카테고리 목록</Text>

            {/* 입력 영역 */}
            <View style={styles.inputContainer}>
                <TextInput 
                    style={styles.input}
                    placeholder="카테고리를 입력하세요"
                    value={inputText}
                    onChangeText={setInputText}
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddCategories}>
                    <Text style={styles.addButtonText}>추가</Text>
                </TouchableOpacity>
            </View>

            {/* 목록 영역 */}
            <FlatList
                data={categories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({item}: {item:Category}) => (
                    <View style={styles.listItem}>
                        {/* 카테고리 수정 시 */}
                        {editingId === item.id ? (
                            <>
                                <TextInput
                                    style={styles.input}
                                    value={editName}
                                    onChangeText={setEditName}
                                    autoFocus={true} // 키보드 자동 활성화
                                />
                                <View style={styles.buttonGroup}>
                                    <TouchableOpacity onPress={() => handleModifyCategories(item.id, editName)}>
                                        <Text style={styles.saveText}>저장</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setEditingId(null)}>
                                        <Text style={styles.cancelText}>취소</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <>
                                <Text style={styles.categoryNameText}>{item.categoryName}</Text>
                                <View style={styles.buttonGroup}>
                                    <TouchableOpacity onPress={() => startEditing(item.id, item.categoryName)}>
                                        <Text style={styles.editText}>수정</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteCategories(item.id)}>
                                        <Text style={styles.deleteButtonText}>삭제</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                )}
            >

            </FlatList>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#F8F9FA' },
    inputContainer: {
        flexDirection: 'row',
        marginBottom: 20
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        height: 48,
        backgroundColor: '#fff'
    },
    addButton: {
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderRadius: 8,
        marginLeft: 10
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee'
    },
    categoryNameText: {
        fontSize: 16,
        color: '#333'
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 12
    },
    editText: {
        color: '#007AFF',
        fontSize: 14
    },
    saveText: {
        color: "#ff8000",
        fontSize: 14
    },
    cancelText: {
        color: "#868E96",
        fontSize: 14
    },
    textContainer: { flex: 1 },
    deleteButton: {
        backgroundColor: '#FF4D4D',
        padding: 8,
        borderRadius: 6
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold'
    }
})