import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from "../../api/api";

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

const POMODORO_WORK_TIME = 25 * 60;
const POMODORO_REST_TIME = 5 * 60;

export default function Timer() {
    const [timerMode, setTimerMode] = useState<"standard" | "pomodoro">("standard");

    // 일반 타이머 상태
    const [standardSeconds, setStandardSeconds] = useState<number>(0);
    const [isStandardRunning, setIsStandardRunning] = useState<boolean>(false);

    // 뽀모도로 타이머 상태
    const [pomoSeconds, setPomoSeconds] = useState<number>(POMODORO_WORK_TIME);
    const [isPomoRunning, setIsPomoRunning] = useState<boolean>(false);
    const [pomoPhase, setPomoPhase] = useState<"work" | "rest">("work");
    const [pomoStudiedSeconds, setPomoStudiedSeconds] = useState<number>(0);

    // 공부 시작 시간 기록 상태
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

    // 공부 시간 DB로 전송
    const saveStudyTime = async (addedSeconds: number) => {
        if (addedSeconds <= 0) return;

        // 종료 시간은 현재 시간
        const endedAt = new Date();
        // 시작 시간이 만약 누락되었다면, 종료시간에서 공부한 초만큼 뺀 시간을 사용
        const startedAt = sessionStartTime || new Date(endedAt.getTime() - addedSeconds * 1000);

        try {
            // API POST 요청
            await api.post('/api/studytime', {
                durationSeconds: addedSeconds,
                startedAt: startedAt.toISOString(),
                endedAt: endedAt.toISOString(),
                studyDate: getTodayKey()
            });

            // 화면 즉시 갱신
            setTodayTotalSeconds((prev) => prev + addedSeconds);
            setSessionStartTime(null); // 다음 측정을 위해 시작 시간 초기화

            const mins = Math.floor(addedSeconds / 60);
            const secs = addedSeconds % 60;
            Alert.alert("저장 완료", `오늘 공부한 시간을 저장했습니다: ${mins}분 ${secs}초`);
        } catch (error) {
            Alert.alert("오류", "공부 시간 저장에 실패했습니다.");
        }
    };

    useEffect(() => {
        if (isStandardRunning) {
            intervalRef.current = setInterval(() => {
                setStandardSeconds((prev) => prev + 1);
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isStandardRunning]);

    useEffect(() => {
        if (isPomoRunning) {
            intervalRef.current = setInterval(() => {
                setPomoSeconds ((prev) => (prev > 0 ? prev - 1 : 0));

                if (pomoPhase === "work") {
                    setPomoStudiedSeconds((prev) => prev + 1);
                }
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPomoRunning, pomoPhase]);

    useEffect(() => {
        if (pomoSeconds === 0 && isPomoRunning) {
            if (pomoPhase === "work") {
                Alert.alert("뽀모도로 완료!", "25분 집중이 끝났습니다. 5분간 휴식시간!");
                setPomoPhase("rest");
                setPomoSeconds(POMODORO_REST_TIME);
            } else {
                Alert.alert("휴식 종료!", "5분 휴식이 끝났습니다. 다시 공부해볼까요!");
                setPomoPhase("work");
                setPomoSeconds(POMODORO_WORK_TIME);
            }
        }
    }, [pomoSeconds, isPomoRunning, pomoPhase]);

    const handleModeSwitch = (mode: "standard" | "pomodoro") => {
        if (isStandardRunning || isPomoRunning) {
            Alert.alert("경고", "타이머가 실행 중입니다. 모드를 전환하려면 타이머를 정지해주세요.");
            return;
        }
        setTimerMode(mode);
    };

    const toggleStandardTimer = () => {
        // 처음 시작 시간 기록
        if (!isStandardRunning && standardSeconds === 0) {
            setSessionStartTime(new Date());
        }
        setIsStandardRunning((prev) => !prev);
    };

    const resetStandardTimer = () => {
        if (standardSeconds === 0) return;
        Alert.alert("타이머 리셋", "기록을 저장하지 않고 타이머를 초기화할까요?", [
            { text: "취소", style: "cancel" },
            {
                text: "초기화",
                style: "destructive",
                onPress: () => {
                    setIsStandardRunning(false);
                    setStandardSeconds(0);
                    setSessionStartTime(null);
                }
            }
        ])
    };

    const stopAndSaveStandardTimer = () => {
        setIsStandardRunning(false);
        if (standardSeconds > 0) {
            Alert.alert("공부 종료", "현재까지 측정한 공부 시간을 저장할까요?", [
                { text: "취소", style: "cancel" },
                {
                    text: "저장 및 초기화",
                    onPress: () => {
                        saveStudyTime(standardSeconds);
                        setStandardSeconds(0);
                    }
                }
            ])
        }
    };

    const togglePomoTimer = () => {
        if (!isPomoRunning && pomoStudiedSeconds === 0 && pomoPhase === "work") {
            setSessionStartTime(new Date());
        }
        setIsPomoRunning((prev) => !prev);
    };

    const resetPomoTimer = () => {
        if (pomoSeconds === POMODORO_WORK_TIME && pomoStudiedSeconds === 0 && pomoPhase === "work") {
            return;
        }
        Alert.alert("뽀모도로 리셋", "기록을 저장하지 않고 초기화할까요?", [
            { text: "취소", style: "cancel" },
            {
                text: "초기화",
                style: "destructive",
                onPress: () => {
                    setIsPomoRunning(false);
                    setPomoSeconds(POMODORO_WORK_TIME);
                    setPomoPhase("work");
                    setPomoStudiedSeconds(0);
                    setSessionStartTime(null);
                }
            }
        ])
    };

    const stopAndSavePomoTimer = () => {
        setIsPomoRunning(false);
        if (pomoStudiedSeconds > 0) {
            Alert.alert("뽀모도로 종료", "오늘 공부한 뽀모도로 시간을 저장할까요?", [
                { text: "취소", style: "cancel" },
                {
                    text: "저장 및 초기화",
                    onPress: () => {
                        saveStudyTime(pomoStudiedSeconds);
                        setPomoStudiedSeconds(0);
                        setPomoSeconds(POMODORO_WORK_TIME);
                        setPomoPhase("work");
                    }
                }
            ])
        }
    };

    return (
        <SafeAreaView style={styles.timerContainer}>
        {/* 탭 전환 (일반 타이머/뽀모도로) */}
        <View style={styles.tabContainer}>
            <TouchableOpacity
            style={[
                styles.tabButton,
                timerMode === "standard" && styles.activeTab,
            ]}
            onPress={() => handleModeSwitch("standard")}
            >
            <Text
                style={[
                styles.tabText,
                timerMode === "standard" && styles.activeTabText,
                ]}
            >
                타이머
            </Text>
            </TouchableOpacity>
            <TouchableOpacity
            style={[
                styles.tabButton,
                timerMode === "pomodoro" && styles.activeTab,
            ]}
            onPress={() => handleModeSwitch("pomodoro")}
            >
            <Text
                style={[
                styles.tabText,
                timerMode === "pomodoro" && styles.activeTabText,
                ]}
            >
                뽀모도로
            </Text>
            </TouchableOpacity>
        </View>

        {/* 1. 일반 타이머 화면 */}
        {timerMode === "standard" ? (
            <View style={styles.timerDisplayContainer}>
            <View style={styles.timerDisplayBox}>
                <Text style={styles.modeSubTitle}>스톱워치 모드</Text>
                <Text style={styles.timeText}>{formatTime(standardSeconds)}</Text>
            </View>

            <View style={styles.buttonGroup}>
                <TouchableOpacity
                style={[
                    styles.actionButton,
                    isStandardRunning ? styles.pauseButton : styles.startButton,
                ]}
                onPress={toggleStandardTimer}
                >
                <Text style={styles.actionButtonText}>
                    {isStandardRunning ? "일시정지" : "시작"}
                </Text>
                </TouchableOpacity>

                <TouchableOpacity
                style={[styles.actionButton, styles.resetButton]}
                onPress={resetStandardTimer}
                >
                <Text style={styles.resetButtonText}>리셋</Text>
                </TouchableOpacity>

                <TouchableOpacity
                style={[styles.actionButton, styles.stopButton]}
                onPress={stopAndSaveStandardTimer}
                >
                <Text style={styles.actionButtonText}>종료/저장</Text>
                </TouchableOpacity>
            </View>
            </View>
        ) : (
            /* 2. 뽀모도로 타이머 화면 */
            <View style={styles.timerDisplayContainer}>
            <Text style={styles.modeSubTitle}>
                {pomoPhase === "work" ? "집중 시간" : "휴식 시간"}
            </Text>
            <Text
                style={[
                styles.timeText,
                pomoPhase === "work" ? styles.workTimeText : styles.restTimeText,
                ]}
            >
                {formatTime(pomoSeconds)}
            </Text>

            <Text style={styles.pomoSubText}>
                현재 이번 세션 공부 시간 : {formatTime(pomoStudiedSeconds)}
            </Text>

            <View style={styles.buttonGroup}>
                <TouchableOpacity
                style={[
                    styles.actionButton,
                    isPomoRunning ? styles.pauseButton : styles.startButton,
                ]}
                onPress={togglePomoTimer}
                >
                <Text style={styles.actionButtonText}>
                    {isPomoRunning ? "일시정지" : "시작"}
                </Text>
                </TouchableOpacity>

                <TouchableOpacity
                style={[styles.actionButton, styles.resetButton]}
                onPress={resetPomoTimer}
                >
                <Text style={styles.resetButtonText}>리셋</Text>
                </TouchableOpacity>

                <TouchableOpacity
                style={[styles.actionButton, styles.stopButton]}
                onPress={stopAndSavePomoTimer}
                >
                <Text style={styles.actionButtonText}>종료/저장</Text>
                </TouchableOpacity>
            </View>
            </View>
        )}

        {/* 오늘 총 공부 시간 요약 */}
        <View style={styles.todaySummaryCard}>
            <Text style={styles.todaySummaryLabel}>오늘 누적 공부 시간</Text>
            <Text style={styles.todaySummaryValue}>
            {formatTime(todayTotalSeconds)}
            </Text>
        </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    timerContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#0E1233",
        paddingTop: 5,
    },

    tabContainer: {
        flexDirection: "row",
        borderRadius: 16,
        padding: 4,
        backgroundColor: "#252628",
    },
    tabButton: {
        flex: 1,
        height: 50,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    activeTab: {
        backgroundColor: "#3F4042",
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    tabText: {
        fontSize: 15,
        color: "#E9E9EA",
    },
    activeTabText: {
        color: "#7eb7ec",
        fontWeight: "600",
    },
    todaySummaryCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#464646",
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#626264",
    },
    todaySummaryLabel: {
        fontSize: 14,
        color: "#9a9a9a",
    },
    todaySummaryValue: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#F6C453",
    },
    timerDisplayContainer: {
        borderRadius: 20,
        paddingVertical: 40,
        paddingHorizontal: 20,
        alignItems: "center",
        flex: 1,
        gap: 25,
    },
    modeSubTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#636d7b",
        marginBottom: 16,
    },

    timerDisplayBox: {
        minWidth: 260,
        minHeight: 260,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 400,
        borderWidth: 1,
        backgroundColor: "#1B1B1B",
        borderStyle: "dashed",
        borderColor: "#758390",
    },

    timeText: {
        fontSize: 52,
        fontWeight: "bold",
        color: "#dfdfdf",
        letterSpacing: 2,
        marginBottom: 24,
    },
    restTimeText: {
        color: "#10b981", // 휴식 모드 시 초록색 표시
    },
    pomoSubText: {
        fontSize: 13,
        color: "#9ca3af",
        marginBottom: 20,
    },
    buttonGroup: {
        flexDirection: "row",
        gap: 12,
        width: "100%",
    },
    actionButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    startButton: {
        backgroundColor: "#5AA9E6",
    },
    pauseButton: {
        backgroundColor: "#F6C453",
    },
    resetButton: {
        backgroundColor: "#f3f4f6",
        borderWidth: 1,
        borderColor: "#d1d5db",
    },
    resetButtonText: {
        color: "#374151",
        fontSize: 16,
        fontWeight: "bold",
    },

    stopButton: {
        backgroundColor: "#e45959",
    },
    actionButtonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "bold",
    },
});