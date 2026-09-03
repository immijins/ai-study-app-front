import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { api } from "../../api/api";
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TaskStat } from '../../types/TaskStat';

export default function DailyTaskStats() {
    const [stats, setStats] = useState<TaskStat[]>([]);

    useEffect(() => {
        const fetchTaskStats = async () => {
            try {
                const response = await api.get('/api/statistics/tasklist');
                setStats(response.data);
            } catch (error) {
                console.error("할 일 통계를 불러오는데 실패했습니다. :", error);
            }
        };

        fetchTaskStats();
    }, []);

    return (
        <SafeAreaView
            style={styles.layout}
            edges={['left', 'right']}
        >
            <View style={styles.container}>
                <View style={styles.topTitle}>
                    <Text style={styles.title}>
                        최근 7일 플래너 달성률
                    </Text>
                </View>

                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {stats.map((stat, index) => {
                        // 날짜 포맷
                        let dateText = "";
                        if (Array.isArray(stat.planDate)) {
                            dateText = `${stat.planDate[1]}/${stat.planDate[2]}`;
                        } else if (typeof stat.planDate === 'string') {
                            const parts = stat.planDate.split('-');
                            dateText = `${parseInt(parts[1])}/${parseInt(parts[2])}`;
                        }

                        // 퍼센트 계산
                        const percentage = stat.totalCount === 0
                            ? 0 
                            : Math.round((stat.completedCount / stat.totalCount) * 100);
                        
                        return (
                            <View key={index} style={styles.card}>
                                <View style={styles.cardTop}>
                                    <Text style={styles.dateText}>{dateText}</Text>
                            
                                    {/* 퍼센트 텍스트 */}
                                    <Text style={styles.countText}>
                                        {stat.completedCount} / {stat.totalCount} ({percentage}%)
                                    </Text>
                                </View>
                            
                                {/* 프로그레스 바 */}
                                <View style={styles.barBackground}>
                                    <View
                                        style={[
                                            styles.barFill,
                                            { width: `${percentage}%` }
                                        ]}
                                    >
                                        
                                    </View>
                                </View>
                            </View>
                        );
                    })}

                    {/* 데이터 없는 경우 */}
                    {stats.length === 0 && (
                        <Text style={styles.emptyText}>최근 기록이 없습니다.</Text>
                    )}
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
        paddingTop: 20,
        backgroundColor: '#F8F9FA',
        marginBottom: 50
    },
    topTitle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },

    title: {
        fontSize: 14,
        color: '#333',
    },
    scrollContent: {
        flexDirection: 'column',
        gap: 12
    },

    card: {
        width: '100%',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#Ececec'
    },
    cardTop: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    dateText: {
        color: '#999',
        fontSize: 12,
        marginBottom: 8,
        fontWeight: '600'
    },
    percentText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    barBackground: {
        width: '100%',
        height: 12,
        backgroundColor: '#dddddd',
        borderRadius: 12,
        marginBottom: 8,
        overflow: 'hidden', // 게이지가 밖으로 삐져나가지 않게 함
    },
    barFill: {
        height: '100%',
        backgroundColor: '#60B9A6', // 잔디와 동일한 초록색
        borderRadius: 4,
    },
    countText: {
        color: '#60B9A6',
        fontSize: 12,
    },
    emptyText: {
        color: '#999',
        fontSize: 14,
    }
});