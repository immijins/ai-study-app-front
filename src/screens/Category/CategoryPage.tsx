import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ActivityIndicator, FlatList, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform  } from 'react-native';
import { api } from '../../api/api';
import { Category } from '../../types/Category';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        <SafeAreaView 
            style={styles.layout}
            edges={['left', 'right']}
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}    
            >
                <View style={styles.container}>
                    {/* 입력 영역 */}
                    <View style={styles.cateInputList}>
                        <Text style={styles.cateTit}>카테고리 추가</Text>

                        <View style={styles.inputContainer}>
                            <TextInput 
                                style={styles.cateInput}
                                placeholder="카테고리를 입력하세요"
                                value={inputText}
                                onChangeText={setInputText}
                            />
                            <TouchableOpacity style={styles.addButton} onPress={handleAddCategories}>
                                <Ionicons name="arrow-up" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.cateList}>
                        <Text style={styles.cateTit}>카테고리 목록</Text>
                        
                        {/* 목록 영역 */}
                        <FlatList
                            data={categories}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({item}: {item:Category}) => {
                                const isProtected = item.categoryName === '기타' || item.categoryName === 'ai 추천';

                                return (
                                    <View style={styles.listItem}>
                                    {/* 카테고리 수정 시 */}
                                    {editingId === item.id ? (
                                        <>
                                            <TextInput
                                                style={styles.editInput}
                                                value={editName}
                                                onChangeText={setEditName}
                                                autoFocus={true} // 키보드 자동 활성화
                                            />
                                            <View style={styles.buttonGroup}>
                                                <TouchableOpacity onPress={() => handleModifyCategories(item.id, editName)}>
                                                    <Ionicons name="checkmark-circle-outline" size={24} color="#FFA683" />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => setEditingId(null)}>
                                                    <Ionicons name="enter-outline" size={24} color="#aaa" />
                                                </TouchableOpacity>
                                            </View>
                                        </>
                                    ) : (
                                        <>
                                            <Text style={styles.categoryNameText}>{item.categoryName}</Text>
                                            <View style={styles.buttonGroup}>
                                                {!isProtected ? (
                                                    <>
                                                        <TouchableOpacity onPress={() => startEditing(item.id, item.categoryName)}>
                                                            <Ionicons name="pencil-outline" size={20} color="#999" />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity onPress={() => handleDeleteCategories(item.id)}>
                                                            <Ionicons name="close-outline" size={24} color="#FF0000" />
                                                        </TouchableOpacity>
                                                    </>) : (
                                                        <Ionicons name="lock-closed-outline" size={20} color="#ddd" />
                                                )}
                                            </View>
                                        </>
                                    )}
                                </View>
                                )
                            }}
                        >

                        </FlatList>
                    </View>
                </View>
            </KeyboardAvoidingView>
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
    cateInputList: {
        flexDirection: 'column',
        gap: 10,
    },
    cateTit: {
        fontSize: 14,
        color: "#888",
        marginBottom: 5
    },
    inputContainer: {
        flexDirection: 'row',
        
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D9D9D9',
        paddingLeft: 8,
        paddingRight: 8,
        borderRadius: 50
    },
    cateInput: {
        flex: 1,
        height: 50,
    },
    addButton: {
        backgroundColor: '#60B9A6',
        height: 35,
        width: 35,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50
    },

    // 목록 영역
    cateList: {
        marginTop: 30,

    },
    listItem: {
        flexDirection: 'row',
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#fff',
        justifyContent: 'space-between',
        height: 55,
        alignItems: 'center',
        paddingLeft: 12,
        paddingRight: 12
    },

    buttonGroup: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center'
    },
    categoryNameText: {
        color: "#333",
        fontSize: 14
    }
})