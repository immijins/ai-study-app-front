import React, { useMemo, useState, useEffect } from "react";
import { View, StyleSheet, Text,  } from "react-native";
import { ScrollView } from 'react-native-gesture-handler';
import { api } from "../../api/api";

import { SafeAreaView } from 'react-native-safe-area-context';

// 잔디 데이터 타입
interface DayData {
    date: string;
    totalSeconds: number;
}

// 공부 시간에 따른 잔디 색
const getGrassColor = (studyTime: number) => {
    if (studyTime === 0) return '#f0f0f0';
    if (studyTime < 3600) return '#1E4D2B';
    if (studyTime < 3600 * 3) return '#2D7A3E';
    if (studyTime < 3600 * 5) return '#3DA751';
    return '#4ED464';
};

const generateEmptyGrid = () => {
    const data = [];
    const today = new Date();
    for (let i = 99; i >= 0; i--) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - i);

        const dateString = targetDate.toISOString().split('T')[0];

        data.push({
            date: dateString,
            totalSeconds: 0,
        });
    }
    return data;
};

export default function StudyHeatmap() {
    
    const [heatmapData, setHeatmapData] = useState<DayData[]>(generateEmptyGrid());

    useEffect(() => {
        const fetchHeatmapData = async () => {
            try {
                const response = await api.get<DayData[]>(`/api/statistics/heatmap`);
                const serverData = response.data;

                setHeatmapData((prevGird) =>
                    prevGird.map((cell) => {
                        const record = serverData.find((d: any) => d.date === cell.date);
                        return record
                            ? { ...cell, totalSeconds: record.totalSeconds}
                            : cell;
                    })
                );
            } catch (error) {
                console.error("데이터를 불러오는데 실패했습니다 :", error);
            };
        }

        fetchHeatmapData();
    }, []);

    // 7개 열 단위로 쪼개기
    const weeks = useMemo(() => {
        const rows = [];
        let currentRow:any = [];

        const firstDay = new Date(heatmapData[0].date).getDay();
        for (let i = 0; i < firstDay; i++) {
            currentRow.push(null);
        }

        heatmapData.forEach((day) => {
            currentRow.push(day);
            if (currentRow.length === 7) {
                rows.push(currentRow);
                currentRow = [];
            }
        });

        if (currentRow.length > 0) {
            while (currentRow.length < 7) {
                currentRow.push(null);
            }
            rows.push(currentRow);
        }

        return rows;
    }, [heatmapData]);

    return (
        <SafeAreaView
            style={styles.layout}
            edges={['left', 'right']}
        >
            <View style={styles.container}>
                <View style={styles.topTitle}>
                    <Text style={styles.title}>
                    100일간 공부시간 통계
                    </Text>

                    {/* 라벨 */}
                    <View style={styles.legend}>
                        <Text style={styles.legendText}>Less</Text>
                        <View style={[styles.legendCell, { backgroundColor: getGrassColor(0) }]} />
                        <View style={[styles.legendCell, { backgroundColor: getGrassColor(1800) }]} />
                        <View style={[styles.legendCell, { backgroundColor: getGrassColor(4000) }]} />
                        <View style={[styles.legendCell, { backgroundColor: getGrassColor(12000) }]} />
                        <View style={[styles.legendCell, { backgroundColor: getGrassColor(20000) }]} />
                        <Text style={styles.legendText}>More</Text>
                    </View>
                </View>

                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={styles.scrollContent}>
                    {/* 요일 라벨 */}
                    <View style={styles.dayLabels}>
                        <Text style={styles.dayText}>일</Text>
                        <Text style={styles.dayText}>월</Text>
                        <Text style={styles.dayText}>화</Text>
                        <Text style={styles.dayText}>수</Text>
                        <Text style={styles.dayText}>목</Text>
                        <Text style={styles.dayText}>금</Text>
                        <Text style={styles.dayText}>토</Text>
                    </View>

                    {/* 잔디밭 */}
                    <View style={styles.grid}>
                        {weeks.map((week: (DayData | null)[], weekIndex: number) => (
                            <View key={weekIndex} style={styles.weekRow}>
                                {week.map((day: DayData | null, dayIndex: number) => {

                                    let dateText = "";
                                    if (day) {
                                        const parts = day.date.split('-');
                                        dateText = `${parseInt(parts[1])}/${parseInt(parts[2])}`;
                                    }

                                    return (
                                        <View
                                            key={dayIndex}
                                            style={[
                                                styles.cell,
                                                {
                                                    backgroundColor: day ? getGrassColor(day.totalSeconds) : 'transparent',
                                                    borderWidth: day ? 0 : 0
                                                },
                                            ]}
                                        >
                                            { day && (
                                                <Text style={styles.cellText}>{dateText}</Text>
                                            )}
                                        </View>
                                    )
                                })}
                            </View>
                        ))}
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
    },
    dayLabels: {
        flexDirection: 'row',
        paddingVertical: 2,
    },
    dayText: {
        color: '#999',
        fontSize: 12,
        flex: 1,
        textAlign: 'center',
        height: 25,
        justifyContent: 'center',
        alignItems: 'center'
    },
    grid: {
        width: '100%',
        gap: 6
    },
    weekRow: {
        flexDirection: 'row',
        gap: 6
    },
    cell: {
        flex: 1,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4
    },
    cellText: {
        fontSize: 10,
        color: '#cacaca',
        opacity: 0.8
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
    },
    legendText: {
        color: '#758390',
        fontSize: 12,
        marginHorizontal: 4,
    },
    legendCell: {
        width: 14,
        height: 14,
        borderRadius: 2,
    },
})