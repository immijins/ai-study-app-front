import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function MyPage() {
    const navigation = useNavigation();

    // 이동할 메뉴 리스트 정의
    const menuList = [
        {id: '1', title: '카테고리', screen: 'CategoryPage'}
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