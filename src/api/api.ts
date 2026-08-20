import { Platform } from 'react-native';
import axios from 'axios';

// 현재 IP 주소
const PC_IP = '192.168.45.15';

// 실행 환경(웹 vs 앱)에 따라 URL 자동 변경
const BASE_URL = Platform.OS === 'web'
    ? 'http://localhost:8080' // 웹 환경에서는 로컬호스트 사용
    : `http://${PC_IP}:8080`; // 앱 환경에서는 PC의 IP 주소 사용

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 5000, // 요청 제한 시간 설정 (5초)
})