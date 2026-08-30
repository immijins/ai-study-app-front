import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ActivityIndicator, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { api } from '../../api/api';
import { Dday } from '../../types/Dday';
import { diff } from 'react-native/types_generated/Libraries/ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload';

export default function DdayPage() {
    const [ddayList, setDdayList] = useState<Dday[]>([]);
    const [inputText, setInputText] = useState<string>('');
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

    // 디데이 계산
    const calculateDay = (dateString: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(dateString);
        target.setHours(0, 0, 0, 0);
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'D-Day';
        return diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)};`
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

            <Text>디데이 목록</Text>

            {/* 목록 영역 */}

            <FlatList
                data={ddayList}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({item}: {item:Dday}) => (
                    <View>
                        <Text>{item.title}</Text>
                        <Text>{calculateDay(item.dayDate)}</Text>
                    </View>
                )}
            >
            </FlatList>
        </View>
    )
}



const styles = StyleSheet.create({



}) 