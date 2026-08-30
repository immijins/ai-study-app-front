import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../../store/useUserStore';

export default function MyPage() {
    const profile = useUserStore((state) => state.profile);
    const navigation = useNavigation();

    // 이동할 메뉴 리스트 정의
    const menuList = [
        {id: '1', title: '카테고리', screen: 'CategoryPage'},
        {id: '2', title: '공부시간 통계', screen: 'StudyGrassPage'},
        {id: '3', title: '플래너 달성률', screen: 'DailyTaskStatsPage'},
        {id: '4', title: '디데이', screen: 'DdayPage'}
    ];

    // 각 리스트 항목을 렌더링하는 함수
    const renderItem = ({ item }: {item: any}) => (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen as never)}
        >
            <Text style={styles.menuText}>{item.title}</Text>
            <Text style={styles.arrowIcon}>{'>'}</Text>
        </TouchableOpacity>
    )

    return (
        <View style={styles.container}>
            <View>
                <Text>{profile?.nickname}님</Text>
                <Text>현재 레벨: Lv. {profile?.level}</Text>
            </View>

            {/* 메뉴 리스트 렌더링 */}
            <FlatList
                data={menuList}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                style={styles.listContainer}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA'
    },
    listContainer: {
        marginTop: 12,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F3F5'
    },
    menuText: {
        fontSize: 16,
        color: '#343A40'
    },
    arrowIcon: {
        fontSize: 18,
        color: '#CED4DA'
    }
})