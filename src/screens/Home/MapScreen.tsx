import React, { useState } from "react";
import { StyleSheet, View, Text, Image, Dimensions, TouchableOpacity  } from 'react-native';
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useUserStore } from '../../store/useUserStore';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MAP_WIDTH = 1024;
const MAP_HEIGHT = 1536;

const MIN_SCALE = 0.7;
const MAX_SCALE = 2;

export default function MapScreen() {
    const profile = useUserStore((state) => state.profile);

    const userLevel = profile?.level || 0;
    const streakDays = profile?.streakDays || 0;

    // 현재 확대/축소 비율
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);

    // 현재 맵 위치
    const translateX = useSharedValue(
        (SCREEN_WIDTH - MAP_WIDTH) / 2
    );
    const translateY = useSharedValue(
        (SCREEN_HEIGHT - MAP_HEIGHT) / 2
    );

    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    // 연속 일수에 따른 나무 성장도
    const getTreeImage = (days:number) => {
        if (days < 10) return require('../../../assets/mapScreen/tree_1.png');
        if (days < 20) return require('../../../assets/mapScreen/tree_2.png');
        return require('../../../assets/mapScreen/tree_1.png');
    };

    // 줌
    const pinchGesture = Gesture.Pinch()
        .onStart(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        })
        .onUpdate((event) => {
            const nextScale = 
                savedScale.value * event.scale;

                scale.value = Math.min(
                    Math.max(nextScale, MIN_SCALE),
                    MAX_SCALE
                );
        })
        .onEnd(() => {
            scale.value = withSpring(
                Math.min(
                    Math.max(scale.value, MIN_SCALE), 
                    MAX_SCALE
                ));
        });

        // 맵 이동
        const panGesture = Gesture.Pan()
        .onStart(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        })
        .onUpdate((event) => {
            const maxX = 
                Math.max(
                    0,
                    (MAP_WIDTH * scale.value - SCREEN_WIDTH) / 2
                );
            
            const maxY = 
                Math.max(
                    0,
                    (MAP_HEIGHT * scale.value - SCREEN_HEIGHT) / 2
                );

            const nextX =
                savedTranslateX.value + event.translationX;

            const nextY = 
                savedTranslateY.value + event.translationY;

            translateX.value = Math.min(
                Math.max(nextX, -maxX),
                maxX
            );

            translateY.value = Math.min(
                Math.max(nextY, -maxY),
                maxY
            )
        });

        // 두 손가락 줌 + 한 손가락 이동
        const composedGesture = Gesture.Simultaneous(
            pinchGesture, 
            panGesture
        );

        // 맵 애니메이션 스타일
        const animatedMapStyle = useAnimatedStyle(() => {
            return {
                transform: [
                    { translateX: translateX.value },
                    { translateY: translateY.value },
                    { scale: scale.value }
                ]
            };
        });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text>Lv. {userLevel}</Text>
                <Text>{streakDays}일 연속!</Text>
            </View>

            {/* 맵 */}
            <GestureDetector gesture={composedGesture}>
                <View style={styles.mapWrapper}>
                    <Animated.View 
                        style={[styles.mapCanvas, animatedMapStyle]}>
                        {/* 배경 이미지 */}
                        <Image 
                            source={require('../../../assets/mapScreen/bg_back0.png')}
                            style={styles.background}
                            resizeMode="stretch"
                        />

                        {/* 나무 */}
                        <Image 
                            source={getTreeImage(streakDays)}
                            style={[styles.gameObject, 
                                { left: 300, top: 400, zIndex: 400 }]}
                        />

                        {/* 건물(레벨따라 오픈) */}
                        {userLevel >= 1 && (
                            <Image 
                                source={require('../../../assets/mapScreen/building_lv1.png')}
                                style={[styles.gameObject, 
                                    {left: 200, top: 200, zIndex: 200}]}
                            />
                        )}
                        {userLevel >= 2 && (
                            <Image 
                                source={require('../../../assets/mapScreen/building_lv2.png')}
                                style={[styles.gameObject, 
                                    {left: 300, top: 600, zIndex: 600}]}
                            />
                        )}
                        {userLevel >= 3 && (
                            <Image 
                                source={require('../../../assets/mapScreen/building_lv3.png')}
                                style={[styles.gameObject, 
                                    {left: 300, top: 600, zIndex: 600}]}
                            />
                        )}
                        {userLevel >= 4 && (
                            <Image 
                                source={require('../../../assets/mapScreen/building_lv4.png')}
                                style={[styles.gameObject, 
                                    {left: 300, top: 600, zIndex: 600}]}
                            />
                        )}
                        {userLevel >= 5 && (
                            <Image 
                                source={require('../../../assets/mapScreen/building_lv5.png')}
                                style={[styles.gameObject, 
                                    {left: 300, top: 600, zIndex: 600}]}
                            />
                        )}


                        {/* 캐릭터 */}
                        <Image 
                            source={require('../../../assets/mapScreen/character1.png')}
                            style={[styles.gameObject, 
                                {left: 500, top: 450, zIndex: 450}]}
                        />
                    </Animated.View>
                </View>
            </GestureDetector>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        flex: 1,
    },

    header: {
        height: 60,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        position: 'absolute',
    },

    background: {
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        position: 'absolute',
        left: 0,
        top: 0,
    },
    gameObject: {
        position: 'absolute',
    },
});