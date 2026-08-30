import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { api } from "../../api/api";
import { ScrollView } from 'react-native-gesture-handler';

// 데이터 타입
interface TaskStat {
    planDate: string | number[];
    totalCount: number;
    completedCount: number;
}

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
        <View style={styles.container}>
            <Text style={styles.title}>최근 7일 달성률</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
                            <Text style={styles.dateText}>{dateText}</Text>
                        
                            {/* 퍼센트 텍스트 */}
                            <Text style={styles.percentText}>{percentage}%</Text>
                        
                            {/* 프로그레스 바 */}
                            <View style={styles.barBackground}>
                                <View
                                    style={[
                                        styles.barFill,
                                        { width: `${percentage}%` }
                                    ]}
                                >
                                    <Text style={styles.countText}>
                                        {stat.completedCount} / {stat.totalCount}
                                    </Text>
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
    )

}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1B1B1B', // 통계 카드 배경색
        padding: 20,
        borderRadius: 16,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#3F4042',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#E9E9EA',
        marginBottom: 15,
    },
    scrollContent: {
        flexDirection: 'row',
        gap: 12, // 카드 사이의 간격
    },
    card: {
        backgroundColor: '#252628',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        width: 80, // 카드 하나의 너비
    },
    dateText: {
        color: '#758390',
        fontSize: 12,
        marginBottom: 8,
    },
    percentText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    barBackground: {
        width: '100%',
        height: 8,
        backgroundColor: '#3F4042',
        borderRadius: 4,
        marginBottom: 8,
        overflow: 'hidden', // 게이지가 밖으로 삐져나가지 않게 함
    },
    barFill: {
        height: '100%',
        backgroundColor: '#4ED464', // 잔디와 동일한 초록색
        borderRadius: 4,
    },
    countText: {
        color: '#758390',
        fontSize: 10,
    },
    emptyText: {
        color: '#758390',
        fontSize: 14,
    }
});