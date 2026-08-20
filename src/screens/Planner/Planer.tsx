import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { api } from '../../api/api';
import { Todo } from '../../types/Todo';

export default function Planner() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    // Todo 목록 불러오기 (GET)
    const fetchTodos = async () => {
        try {
            const response = await api.get<Todo[]>('/api/todos');
            setTodos(response.data);
        } catch (error) {
            console.error('불러오기 실패 :', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodos();
    }, []);

    // Todo 추가하기 (POST)
    const handleAddTodo = async () => {
        if (!inputText.trim()) return;

        try {
            const response = await api.post<Todo>('/api/todos', {title: inputText.trim()} );
            setTodos((prev) => [...prev, response.data]);
            setInputText('');
        } catch (error) {
            console.error('추가 실패 :', error);
        }
    };

    // 완료 상태 토글 (PATCH)
    const handleToggleTodo = async (id: number) => {
        try {
            const response = await api.patch<Todo>(`/api/todos/${id}/toggle`);
            setTodos((prev) => 
                prev.map((todo) => (todo.id === id ? response.data : todo))
            )
        } catch (error) {
            console.error('상태 변경 실패 :', error);
        }
    };

    // 삭제하기 (DELETE)
    const handleDeleteTodo = async (id: number) => {
        try {
            await api.delete(`/api/todos/${id}`);
            setTodos((prev) => prev.filter((todo) => todo.id !== id));
        } catch (error) {
            console.error('삭제 실패 :', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Text>Supabase DB Todo 목록</Text>

            {/* 입력 영역 */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="할 일을 입력하세요"
                    value={inputText}
                    onChangeText={setInputText}
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddTodo}>
                    <Text style={styles.addButtonText}>추가</Text>
                </TouchableOpacity>
            </View>

            {/* 목록 영역 */}
            <FlatList
                data={todos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({item}: {item: Todo}) => (
                    <View style={styles.todoItem}>
                        <TouchableOpacity
                            style={styles.todoTextContainer}
                            onPress={() => handleToggleTodo(item.id)}
                        >
                            <Text
                                style={[
                                    styles.todoText,
                                    item.completed && styles.completedText
                                ]}
                            >
                                {item.completed ? '완료' : '미완료'} - {item.title}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteTodo(item.id)}
                        >
                            <Text style={styles.deleteButtonText}>삭제</Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>등록된 할 일이 없습니다.</Text>}
            />
        </View>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#F8F9FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    inputContainer: { flexDirection: 'row', marginBottom: 20 },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 15,
        height: 48,
        backgroundColor: '#FFF',
    },
    addButton: {
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderRadius: 8,
        marginLeft: 10,
    },
    addButtonText: { color: '#FFF', fontWeight: 'bold' },
    todoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    todoTextContainer: { flex: 1 },
    todoText: { fontSize: 16, color: '#333' },
    completedText: { textDecorationLine: 'line-through', color: '#AAA' },
    deleteButton: { backgroundColor: '#FF4D4D', padding: 8, borderRadius: 6 },
    deleteButtonText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    emptyText: { textAlign: 'center', color: '#888', marginTop: 40 },
});
