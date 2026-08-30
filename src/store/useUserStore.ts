import { create } from "zustand";
import { api } from "../api/api";

// 보관할 데이터 타입 정의
interface UserProfile {
    nickname: string;
    level: number;
    streakDays: number;
    exp: number;
}

// 행동 정의
interface UserStore {
    profile: UserProfile | null;
    fetchProfile: () => Promise<void>;
    updateExp: (earnedExp: number) => void;
}

// 생성
export const useUserStore = create<UserStore>((set, get) => ({
    profile: null,

    fetchProfile: async () => {
        try {
            const response = await api.get('/api/users/info');
            set({ profile: response.data });
        } catch (error) {
            console.error("정보를 불러오는데 실패했습니다:", error);
        }
    },

    updateExp: (earnedExp) => {
        const currentProfile = get().profile;
        if (currentProfile) {
            set({
                profile: {
                    ...currentProfile,
                    exp: currentProfile.exp + earnedExp,
                }
            });
        }
    }
}));