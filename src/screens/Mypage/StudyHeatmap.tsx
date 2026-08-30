import React, { useMemo, useState, useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";
import { ScrollView } from 'react-native-gesture-handler';
import { api } from "../../api/api";

// 잔디 데이터 타입
interface DayData {
    date: string;
    totalSeconds: number;
}

// 공부 시간에 따른 잔디 색
const getGrassColor = (studyTime: number) => {
    if (studyTime === 0) return '#252628';
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
    const columns = useMemo(() => {
        const cols = [];
        let currentCol:any = [];

        const firstDay = new Date(heatmapData[0].date).getDay();
        for (let i = 0; i < firstDay; i++) {
            currentCol.push(null);
        }

        heatmapData.forEach((day) => {
            currentCol.push(day);
            if (currentCol.length === 7) {
                cols.push(currentCol);
                currentCol = [];
            }
        });

        if (currentCol.length > 0) {
            while (currentCol.length < 7) {
                currentCol.push(null);
            }
            cols.push(currentCol);
        }

        return cols;
    }, [heatmapData]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                최근 100일의 잔디
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
                    {columns.map((col: (DayData | null)[], colIndex: number) => (
                        <View key={colIndex} style={styles.column}>
                            {col.map((day: DayData | null, rowIndex: number) => {

                                let dateText = "";
                                if (day) {
                                    const parts = day.date.split('-');
                                    dateText = `${parseInt(parts[1])}/${parseInt(parts[2])}`;
                                }

                                return (
                                    <View
                                        key={rowIndex}
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
    },
    dayLabels: {
        justifyContent: 'space-between',
        paddingRight: 8,
        paddingVertical: 2,
    },
    dayText: {
        color: '#758390',
        fontSize: 10,
        height: 12,
    },
    grid: {
        flexDirection: 'row',
        gap: 4, // 열 사이 간격
    },
    column: {
        flexDirection: 'column',
        gap: 4, // 행 사이 간격
    },
    cell: {
        width: 28,
        height: 28,
        borderRadius: 4, // 살짝 둥근 네모
        justifyContent: 'center',
        alignItems: 'center'
    },
    cellText: {
        fontSize: 9,
        color: '#ffffff',
        opacity: 0.8
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 16,
        gap: 4,
    },
    legendText: {
        color: '#758390',
        fontSize: 10,
        marginHorizontal: 4,
    },
    legendCell: {
        width: 10,
        height: 10,
        borderRadius: 2,
    },
})