import React, { useState, useCallback, useEffect } from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../../store/useUserStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from "../../api/api";

import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

// 오늘 날짜 반환(YYYY-MM-DD)
const getTodayKey = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// 초 -> MM:SS 또는 HH:MM:SS 형식으로 변환
const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
        return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export default function MyPage() {
    const profile = useUserStore((state) => state.profile);
    const navigation = useNavigation();

    const [todayTotalSeconds, setTodayTotalSeconds] = useState<number>(0);

    // 백엔드에서 오늘 누적 공부시간 불러오기
    const loadTodayStudyTime = useCallback(async () => {
        try {
            const todayKey = getTodayKey();
            const response = await api.get(`/api/studytime/today?date=${todayKey}`);
            setTodayTotalSeconds(response.data.totalSeconds || 0);
        } catch (error) {
            console.warn("오늘 공부 시간 불러오기 실패", error);
        }
    }, []);

    useEffect(() => {
        loadTodayStudyTime();
    }, [loadTodayStudyTime]);

    // 이동할 메뉴 리스트 정의
    const menuList = [
        { id: '1', title: '카테고리 관리', screen: 'CategoryPage', icon: 'list' },
        { id: '2', title: '디데이 관리', screen: 'DdayPage', icon: 'calendar' },
        { id: '3', title: '스터디 타이머', screen: 'TimerPage', icon: 'clock' }
    ];

    // 각 리스트 항목을 렌더링하는 함수
    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen as never)}
        >
            <View style={styles.menuLeft}>
                <FontAwesome5 name={item.icon} size={20} color="#60B9A6" />
                <Text style={styles.menuText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color="#999" />
        </TouchableOpacity>
    )

    return (
        <SafeAreaView
            style={styles.layout}
            edges={['top', 'left', 'right']}
        >
            <View style={styles.container}>
                <View style={styles.profileBox}>
                    <View style={styles.profileTopBox}>
                        <View style={styles.profileImgBox}>
                            <Image
                                source={require('../../../assets/mapScreen/profile.png')}
                                style={styles.profileImg}
                                resizeMode="stretch"
                            />
                        </View>
                        <View style={styles.profileInfoRight}>
                            <View style={styles.profileInfoTop}>
                                <Text style={styles.profileName}>{profile?.nickname}</Text>
                                <Text style={styles.profileNamePs}>님</Text>
                            </View>
                            <View style={styles.profileInfoMore}>
                                {/* 레벨 */}
                                <View style={styles.profileLevel}>
                                    <FontAwesome5 name="crown" size={14} color="#FFC800" />
                                    <Text style={styles.levelNum}>
                                        Lv. {profile?.level}
                                    </Text>
                                </View>
                                {/* 연속일자 */}
                                <View style={styles.profileDays}>
                                    <FontAwesome5 name="fire" size={14} color="#FF7467" />
                                    <Text style={styles.daysNum}>
                                        {profile?.streakDays} 일
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    <View style={styles.profileBottomBox}>
                        <Text style={styles.countTit}>오늘 누적 공부 시간</Text>
                        <Text style={styles.countNum}>{formatTime(todayTotalSeconds)}</Text>
                    </View>
                </View>


                {/* 메뉴 리스트 렌더링 */}
                <View style={styles.myListCat}>
                    <Text style={styles.myListCatTit}>바로가기</Text>
                    <FlatList
                        data={menuList}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        style={styles.listContainer}
                    />
                </View>

                <View style={styles.myListCat}>
                    <Text style={styles.myListCatTit}>통계</Text>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('StudyGrassPage' as never)}
                    >
                        <View style={styles.menuLeft}>
                            <FontAwesome5 name="braille" size={20} color="#FFA683" />
                            <Text style={styles.menuText}>100일 잔디심기</Text>
                        </View>
                        <Ionicons name="chevron-forward-outline" size={24} color="#999" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('DailyTaskStatsPage' as never)}
                    >
                        <View style={styles.menuLeft}>
                            <FontAwesome5 name="pencil-alt" size={20} color="#FFA683" />
                            <Text style={styles.menuText}>플래너 달성률</Text>
                        </View>
                        <Ionicons name="chevron-forward-outline" size={24} color="#999" />
                    </TouchableOpacity>
                </View>

            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    layout: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        padding: 16,
        paddingTop: 20
    },

    // 프로필 박스
    profileBox: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ECECEC',
        padding: 16
    },
    profileTopBox: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#ECECEC',
        paddingBottom: 12
    },
    profileImgBox: {
        width: 80,
        height: 80
    },
    profileImg: {
        width: '100%',
        height: '100%'
    },
    profileInfoRight: {
        flexDirection: 'column',
        gap: 10
    },
    profileInfoTop: {
        flexDirection: 'row',
        gap: 5,
        alignItems: 'flex-end'
    },
    profileName: {
        fontSize: 17,
        color: '#666666',
        fontWeight: 'bold'
    },
    profileNamePs: {
        color: '#333'
    },
    profileInfoMore: {
        flexDirection: 'row',
        gap: 10
    },
    profileLevel: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFC800',
        borderRadius: 30,
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 10,
        paddingRight: 10
    },
    levelNum: {
        color: '#555',
    },
    daysNum: {
        color: '#555',
    },
    profileDays: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 30,
        borderColor: '#FF7467',
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 10,
        paddingRight: 10
    },

    profileBottomBox: {
        paddingTop: 16,
        paddingLeft: 12,
        paddingRight: 12,
        paddingBottom: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10
    },
    countTit: {
        color: '#888',
        fontSize: 14
    },
    countNum: {
        fontWeight: '900',
        color: '#222',
        fontSize: 18
    },

    // 리스트 
    myListCat: {
        flexDirection: 'column',
        marginTop: 15
    },
    myListCatTit: {
        fontSize: 16,
        color: '#333',
        marginBottom: 15
    },
    listContainer: {
        flexDirection: 'column',
        gap: 10
    },
    menuItem: {
        backgroundColor: '#fff',
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 12,
        paddingRight: 12,
        height: 55,
        borderRadius: 12,
        alignItems: 'center'
    },
    menuText: {
        color: '#555',
        fontSize: 15
    },
    menuLeft: {
        flexDirection: 'row',
        gap: 8
    }

})