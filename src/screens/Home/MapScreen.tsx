import React, { useState, useCallback, useEffect } from "react";
import { StyleSheet, View, Text, Image, Dimensions, TouchableOpacity  } from 'react-native';
import { useUserStore } from '../../store/useUserStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from "../../api/api";

import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

export default function MapScreen() {
    const [todayTotalSeconds, setTodayTotalSeconds] = useState<number>(0);

    const profile = useUserStore((state) => state.profile);

    const userLevel = profile?.level || 0;
    const streakDays = profile?.streakDays || 0;

    // 연속 일수에 따른 나무 성장도
    const getTreeImage = (days:number) => {
        if (days <= 0) return require('../../../assets/mapScreen/tree_6.png');
        if (days < 10) return require('../../../assets/mapScreen/tree_1.png');
        if (days < 20) return require('../../../assets/mapScreen/tree_2.png');
        if (days < 30) return require('../../../assets/mapScreen/tree_3.png');
        if (days < 40) return require('../../../assets/mapScreen/tree_4.png');
        if (days < 50) return require('../../../assets/mapScreen/tree_5.png');
        return require('../../../assets/mapScreen/tree_1.png');
    };

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

    return (
        <SafeAreaView
            style={styles.layout}
            edges={['top', 'left', 'right']}
        >
            <View style={styles.container}>
                <View style={styles.header}>
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

                    {/* 오늘 학습 시간 */}
                    <View style={styles.todayStudyTime}>
                        <Text style={styles.countTit}>Study</Text>
                        <Text style={styles.countNum}>{formatTime(todayTotalSeconds)}</Text>
                    </View>
                </View>

                {/* 맵 */}
                <View style={styles.mapWrapper}>
                    <View 
                        style={styles.mapCanvas}>

                        {/* 나무 */}
                        <Image 
                            source={getTreeImage(streakDays)}
                            style={[styles.gameObject, styles.treeImg, 
                                { left: '30%', top: '20%', zIndex: 400 }]}
                        />

                        {/* 건물(레벨따라 오픈) */}
                        {/* 집 */}
                        {userLevel >= 1 && (
                            <Image 
                                source={require('../../../assets/mapScreen/building_lv1.png')}
                                style={[styles.gameObject, styles.buildImg,
                                    {right: '3%', top: '35%', zIndex: 200}]}
                            />
                        )}
                        {/* 책장 */}
                        {userLevel >= 2 && (
                            <Image 
                                source={require('../../../assets/mapScreen/building_lv2.png')}
                                style={[styles.gameObject, styles.buildImg,
                                    {left: '5%', top: '10%', zIndex: 600}]}
                            />
                        )}
                        {/* 도서관 */}
                        {userLevel >= 3 && (
                            <Image 
                                source={require('../../../assets/mapScreen/building_lv3.png')}
                                style={[styles.gameObject, styles.buildImg,
                                    {left: '15%', bottom: '35%', zIndex: 600}]}
                            />
                        )}
                        {/* 연구소 */}
                        {userLevel >= 4 && (
                            <Image 
                                source={require('../../../assets/mapScreen/building_lv4.png')}
                                style={[styles.gameObject, styles.buildImg,
                                    {right: '8%', top: '4%', zIndex: 600}]}
                            />
                        )}
                        {/* 지구본 */}
                        {userLevel >= 5 && (
                            <Image 
                                source={require('../../../assets/mapScreen/building_lv5.png')}
                                style={[styles.gameObject, styles.buildImg,
                                    {right: '12%', bottom: '30%', zIndex: 600}]}
                            />
                        )}


                        {/* 캐릭터 */}
                        {userLevel >= 1 && (
                            <Image 
                                source={require('../../../assets/mapScreen/character1.png')}
                                style={[styles.gameObject, styles.character,
                                    {left: '28%', top: '40%', zIndex: 600}]}
                            />
                        )}
                        {userLevel >= 2 && (
                            <Image 
                                source={require('../../../assets/mapScreen/character2.png')}
                                style={[styles.gameObject, styles.character,
                                    {left: '28%', top: '40%', zIndex: 600}]}
                            />
                        )}
                        {userLevel >= 3 && (
                            <Image 
                                source={require('../../../assets/mapScreen/character3.png')}
                                style={[styles.gameObject, styles.character,
                                    {left: '28%', top: '40%', zIndex: 600}]}
                            />
                        )}
                        {userLevel >= 5 && (
                            <Image 
                                source={require('../../../assets/mapScreen/character4.png')}
                                style={[styles.gameObject, styles.character,
                                    {left: '28%', top: '40%', zIndex: 600}]}
                            />
                        )}
                    </View>
                </View>
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
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        flex: 1,
    },

    header: {
        height: 60,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#7EBCD5',
    },

    levelText: {
        fontSize: 18,
        fontWeight: 'bold',
    },

    streakText: {
        fontSize: 16,
    },

    mapWrapper: {
    flex: 1,
    overflow: 'hidden',
    },

    mapCanvas: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: '#7EBCD5',
        position: 'relative'
    },

    background: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        position: 'absolute',
        left: 0,
        top: 0,
    },
    gameObject: {
        position: 'absolute',
    },

    treeImg: {
        width: 160,
        height: 160
    },
    gameImg: {
        width: '100%',
        height: '100%'
    },
    character: {
        width: 120,
        height: 100
    },
    buildImg: {
        width: 90,
        height: 90
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
        paddingRight: 10,
        backgroundColor: '#9bc1cf'
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
        paddingRight: 10,
        backgroundColor: '#9bc1cf'
    },
    todayStudyTime: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5
    },


    countTit: {
        color: '#e9e9e9',
        fontSize: 14
    },
    countNum: {
        fontWeight: '900',
        color: '#222',
        fontSize: 18
    },

});