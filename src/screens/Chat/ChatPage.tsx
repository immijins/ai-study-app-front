import React, { useState } from 'react';
import { StyleSheet, View, Text, KeyboardAvoidingView, Platform, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';

import { api } from "../../api/api";
import { Message } from '../../types/Message';
import { create } from 'axios';
import { TextInput } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Layout } from 'react-native-reanimated';

export default function ChatPage() {
    const [message, setMessage] = useState<Message[]>([
        { id: '1', text: '안녕하세요! 오늘은 무엇을 공부해볼까요?😊', sender: 'ai'}
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        // 사용자 메시지 화면에 먼저 추가
        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
        };
        setMessage(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await api.post('/api/ai/chat', {
                userId: 1,
                message: userMessage.text
            });

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: response.data.reply,
                sender: 'ai'
            };
            setMessage(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('API 통신 에러:', error);
            setMessage(prev => [...prev, {
                id: Date.now().toString(),
                text: '네트워크 연결에 문제가 발생했습니다.',
                sender: 'ai'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessageItem = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        return (
        <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperAi]}>
            <View style={[styles.messageBubble, isUser ? styles.messageBubbleUser : styles.messageBubbleAi]}>
            <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextAi]}>
                {item.text}
            </Text>
            </View>
        </View>
        );
    };

    return (
        <SafeAreaView
            style={styles.layout}
            edges={['top', 'left', 'right']}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}    
            >
                <FlatList 
                    data={message}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessageItem}
                    contentContainerStyle={styles.chatList}
                />
            
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder='오늘의 공부 계획을 알려주세요!'
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={sendMessage}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={isLoading || !inputText.trim()}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.sendButtonText}>전송</Text>
                        )}
                    </TouchableOpacity>

                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    layout: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    container: { 
        flex: 1, 
        backgroundColor: '#F8F9FA',
    },
    chatList: { 
        padding: 16, 
        paddingBottom: 20 
    },
    messageWrapper: { 
        marginBottom: 16, 
        flexDirection: 'row' 
    },
    messageWrapperUser: { 
        justifyContent: 'flex-end' 
    },
    messageWrapperAi: { 
        justifyContent: 'flex-start' 
    },
    messageBubble: { 
        maxWidth: '80%', 
        padding: 12, 
        borderRadius: 16 },
    messageBubbleUser: { 
        backgroundColor: '#FFA683', 
        borderBottomRightRadius: 4 
    },
    messageBubbleAi: { 
        backgroundColor: '#FFFFFF', 
        borderBottomLeftRadius: 4, 
        borderWidth: 1, 
        borderColor: '#E9ECEF' },
    messageText: { 
        fontSize: 15, 
        lineHeight: 22 
    },
    messageTextUser: { 
        color: '#FFFFFF' 
    },
    messageTextAi: { 
        color: '#333333' 
    },
    inputContainer: { 
        flexDirection: 'row', 
        padding: 12, 
        backgroundColor: '#FFFFFF', 
        borderTopWidth: 1, 
        borderColor: '#E9ECEF' },
    textInput: { 
        flex: 1, 
        height: 40, 
        backgroundColor: '#F1F3F5', 
        borderRadius: 20, 
        paddingHorizontal: 16, 
        marginRight: 8 },
    sendButton: { 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#60B9A6', 
        borderRadius: 20, 
        paddingHorizontal: 16 },
    sendButtonDisabled: { 
        backgroundColor: '#cae6e0' 
    },
    sendButtonText: { 
        color: '#FFFFFF', 
        fontWeight: 'bold' 
    },
})