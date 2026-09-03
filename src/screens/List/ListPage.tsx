import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SectionList, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserStore } from '../../store/useUserStore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { api } from '../../api/api';
import { Task } from '../../types/Task';
import { TaskStat } from '../../types/TaskStat';
import { Dday } from '../../types/Dday';

import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

// 날짜를 YYYY-MM-DD 형식의 문자열로 변환하는 함수
const formatDateToYYYYMMDD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`
}

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function ListPage() {
    // 오늘의 플래너 불러오기
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [tasks, setTasks] = useState<Task[]>([]); // 할 일 목록 

    // 통계
    const [stats, setStats] = useState<TaskStat[]>([]);

    // 디데이
    const [ddayList, setDdayList] = useState<Dday[]>([]);

    const profile = useUserStore((state) => state.profile);
    const navigation = useNavigation();

    // API 데이터 호출
    const fetchTasks = async (date: Date) => {
        const dateString = formatDateToYYYYMMDD(date);
        try {
            const response = await api.get<Task[]>(`/api/task?date=${dateString}`);
            setTasks(response.data);
        } catch (error) {
            console.error("할 일 목록 불러오기 실패 :", error);
        }
    };

    // currentDate가 변경될 때마다 fetchTasks 실행
    useFocusEffect(
        useCallback(() => {
            fetchTasks(currentDate);
        }, [currentDate])
    );

    useFocusEffect(
        useCallback(() => {
            const fetchTaskStats = async () => {
                try {
                    const response = await api.get('/api/statistics/tasklist');
                    setStats(response.data);
                } catch (error) {
                    console.error("할 일 통계를 불러오는데 실패했습니다. :", error);
                }
            };
            

            fetchTaskStats();
        }, [])
    );

    const weeklyStats = WEEK_DAYS.map((dayName, index) => {
        const foundStat = stats.find(stat => {
            let dayOfWeek = -1;

            if (Array.isArray(stat.planDate)) {
                const dateObj = new Date(stat.planDate[0], stat.planDate[1] - 1, stat.planDate[2]);
                dayOfWeek = dateObj.getDay();
            } else if (typeof stat.planDate === 'string') {
                const parts = stat.planDate.split('-');
                const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                dayOfWeek = dateObj.getDay();
            }
            return dayOfWeek === index;
        });

        return {
            dayName: dayName,
            totalCount: foundStat ? foundStat.totalCount : 0,
            completedCount: foundStat ? foundStat.completedCount : 0
        }
    });

    // Dday 목록 불러오기 (GET)
    const fetchDdayList = async () => {
        try {
            const response = await api.get<Dday[]>('/api/dday');
            setDdayList(response.data);
        } catch (error) {
            console.error('불러오기 실패 :', error);
        } 
    };

    useFocusEffect(
        useCallback(() => {
            fetchDdayList();
        }, [])
    );

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

    return (
        <SafeAreaView
            style={styles.layout}
            edges={['top', 'left', 'right']}
        >
            <View style={styles.container}>
                <ScrollView style={styles.scrollInner}>
                    {/* 헤더 영역 */}
                    <View style={styles.headerBar}>
                        <View style={styles.headerImg}>
                            <Image 
                                source={require('../../../assets/list/logo.png')}
                                style={styles.logoImg}
                                resizeMode="stretch"
                            />
                        </View>

                        <View style={styles.headerRight}>
                            {/* 레벨 */}
                            <View style={styles.levelBox}>
                                <FontAwesome5 name="crown" size={14} color="#FFC800" />
                                <Text style={styles.headerTit}>
                                    Lv. 
                                    <Text style={styles.headerTxt}>{profile?.level}</Text>
                                </Text>
                            </View>

                            {/* 연속출석 */}
                            <View style={styles.daysBox}>
                                <FontAwesome5 name="fire" size={14} color="#FF7467" />
                                <Text style={styles.headerTit}>
                                    <Text style={styles.headerTxt}>{profile?.streakDays}</Text>
                                    일
                                </Text>
                            </View>

                            {/* Chat 아이콘 - 링크 이동 */}
                            <TouchableOpacity 
                                style={styles.chatIcon}
                                onPress={() => navigation.navigate('Chat' as never)}
                            >
                                <Ionicons name="chatbubbles-outline" size={30} color="#60B9A6" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 타이머 이동버튼 */}
                    <LinearGradient 
                        colors={['#B9EFE4', '#E0DCFF']}
                        style={styles.timerMove}>
                        <View style={styles.timerMoveLeft}>
                            <View style={styles.timerMoveText}>
                                <Text style={styles.timerBtnTit}>오늘 공부 시작하기</Text>
                                <Text style={styles.timerBtnTxt}>연속 학습을 기록해보세요.</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.timerBtn}
                                onPress={() => navigation.navigate('TimerPage' as never)}
                            >
                                <Text style={styles.timerWTxt}>시작하기</Text>
                                <Ionicons name="chevron-forward-outline" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.timerMoveRight}>
                            <Image 
                                source={require('../../../assets/list/timerBtnImg.png')}
                                style={styles.timerBtnImg}
                                resizeMode="stretch"
                            />
                        </View>
                    </LinearGradient>

                    {/* 스터디플래너 현황 */}
                    <View style={styles.gridList}>
                        <View style={styles.gridTitles}>
                            <Text style={styles.gridTit}>스터디플래너 현황</Text>
                            <TouchableOpacity
                                style={styles.gridTitMove}
                                onPress={() => navigation.navigate('Task' as never)}
                            >
                                <Text style={styles.gridMoveTxt}>더보기</Text>
                                <Ionicons name="add-sharp" size={18} color="#FFA683" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.taskInnerBox}>
                            {/* 주간 플래너 현황 */}
                            <View style={styles.taskWeekBox}>
                                {weeklyStats.map((stat, index) => {
                                    // 퍼센트 계산
                                    const percentage = stat.totalCount === 0
                                        ? 0 :
                                        Math.round((stat.completedCount / stat.totalCount) * 100);

                                    return (
                                        <View key={index} style={styles.weekCard}>
                                            <View style={styles.weekTop}>
                                                <View style={styles.weekBox}>
                                                    <Text style={styles.weekTit}>{stat.dayName}</Text>

                                                    {/* 100% 달성된 경우 체크 아이콘 표시 */}
                                                    {percentage === 100 && stat.totalCount > 0 ? (
                                                        <Ionicons 
                                                            name="checkmark-circle"
                                                            size={30}
                                                            color="#FFB497"
                                                        />
                                                        ) : (
                                                        <Ionicons 
                                                            name="close-circle"
                                                            size={30}
                                                            color="#E4E4E4"
                                                        />
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    )
                                })}
                            </View>
                            {/* 오늘의 플래너 */}
                            <View style={styles.taskTodayBox}>
                                <View style={styles.taskItemBox}>
                                    {tasks.length > 0 ? (
                                        tasks.map((task) => (
                                            <View key={task.id} style={styles.taskItem}>
                                                <View
                                                    style={[styles.checkbox, task.isComplete && styles.checkboxChecked]} 
                                                >
                                                    <Ionicons name="checkmark-sharp" size={20} color="white" />
                                                </View>
                                                <Text style={[styles.taskTitle, task.isComplete && styles.taskTitleCompleted]}>{task.title}</Text>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.emptyText}>오늘의 스터디 플랜을 등록해보세요!</Text>
                                    )}
                                </View>
                            </View>
                            {/* 버튼 */}
                            <TouchableOpacity
                                style={styles.taskMoveBtn}
                                onPress={() => navigation.navigate('Task' as never)}
                            >
                                <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                                <Text style={styles.taskMoveBtnTxt}>오늘 플래너 체크하기</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 디데이 현황 */}
                    <View style={styles.gridList}>
                        <View style={styles.gridTitles}>
                            <Text style={styles.gridTit}>디데이 현황</Text>
                            <TouchableOpacity
                                style={styles.gridTitMove}
                                onPress={() => navigation.navigate('DdayPage' as never)}
                            >
                                <Text style={styles.gridMoveTxt}>더보기</Text>
                                <Ionicons name="add-sharp" size={18} color="#FFA683" />
                            </TouchableOpacity>
                        </View>

                        {/* 디데이 항목 표출 */}
                        {ddayList.length === 0 ? (
                            <Text style={styles.emptyText}>디데이를 등록해보세요!</Text>
                        ) : (
                            <View style={styles.daysListContainer}>
                                {ddayList.map((item: Dday) => (
                                    <View 
                                        key={item.id.toString()} 
                                        style={styles.dayBox}
                                    >
                                        <Text style={styles.dayTit}>{item.title}</Text>
                                        <Text style={styles.dayNum}>{calculateDay(item.dayDate)}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                </ScrollView>
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
        backgroundColor: '#F8F9FA'
    },
    scrollInner: {
        flex: 1
    },

    // 헤더
    headerBar: {
        height: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerImg: {
        width: 110,
        height: 45,
        marginTop: 2
    },
    logoImg: {
        width: '100%',
        height: '100%'
    },
    headerRight: {
        flexDirection: 'row',
        gap: 14
    },
    levelBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    daysBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,

    },
    headerTit: {
        color: "#666",
        fontSize: 15
    },
    headerTxt: {
        color: "#333",
        fontWeight: '600'
    },

    // 타이머 이동버튼
    timerMove: {
        height: 150,
        borderRadius: 12,
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16
    },
    timerMoveLeft: {
        justifyContent: 'space-between',
        height: '100%'
    },
    timerMoveText: {
        gap: 6
    },
    timerBtnTit: {
        fontSize: 19,
        fontWeight: '900',
        color: '#333'
    },
    timerBtnTxt: {
        fontSize: 13,
        color: '#555'
    },

    timerBtn: {
        width: 110,
        height: 40,
        alignItems: 'center',
        backgroundColor: '#60B9A6',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 12,
        paddingRight: 6,
        borderRadius: 40
    },
    timerWTxt: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14
    },

    timerMoveRight: {
        width: 120,
        height: 120
    },
    timerBtnImg: {
        width: '100%',
        height: '100%'
    },

    // 스터디플래너 현황
    gridList: {
        marginTop: 24,
        gap: 10
    },
    gridTitles: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    gridTit: {
        fontSize: 16,
        color: '#222',
        fontWeight: '600'
    },
    gridTitMove: {
        flexDirection: 'row',
        gap: 3,
        alignItems: 'center'
    },
    gridMoveTxt: {
        color: '#FFA683',
        fontWeight: '600'
    },
    taskInnerBox: {
        width: '100%',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#fff'
    },

    taskWeekBox: {
        flexDirection: 'row',
        backgroundColor: '#F9F9F9',
        paddingTop: 8,
        paddingBottom: 8,
        borderWidth: 1,
        borderColor: '#ECECEC',
        borderRadius: 12
    },
    weekCard: {
        flex: 1,
        width: '14%',
    },
    weekBox: {

        justifyContent: 'center',
        alignItems: 'center'
    },
    weekTit: {
        color: '#999',
        fontSize: 12,
        flex: 1,
        textAlign: 'center',
        height: 25,
        justifyContent: 'center',
        alignItems: 'center'
    },

    // 오늘 플랜
    taskItemBox: {
        flexDirection: 'column',
        justifyContent: 'center',
        marginTop: 12
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        backgroundColor: '#ffffff',
        height: 40,
        borderRadius: 12,
        paddingRight: 12,
        marginBottom: 5
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FFB497',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    checkboxChecked: {
        backgroundColor: '#FFB497',
        borderColor: '#FFB497',
    },
    taskTitle: {
        fontSize: 16,
        color: '#343A40',
    },
    taskTitleCompleted: {
        color: '#ADB5BD',
        textDecorationLine: 'line-through',
    },
    emptyText: {
        textAlign: 'center',
        color: '#868E96',
        height: 40,
        alignItems: 'center',
        justifyContent: 'center'
    },

    taskMoveBtn: {
        flexDirection: 'row',
        height: 45,
        backgroundColor: '#60B9A6',
        borderRadius: 50,
        marginTop: 5,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5
    },
    taskMoveBtnTxt: {
        color: '#fff',
        fontSize: 15,
        marginBottom: 3,
        fontWeight: '500'
    },

    // 디데이
    daysListContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 26
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
})