import React, { useMemo } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import AiChatBubble from "../../../components/AiChat/AiChatBubble";
import type { ChatMessage } from "../../../features/aiChat/types";
import SlideFrame from "./SlideFrame";

// AI 여행 채팅 소개 슬라이드. 실제 AiChatBubble을 정적 메시지로 재사용한다.
// 데모용이라 onImagePress는 no-op.
export default function AiChatSlide() {
  const { t } = useTranslation();

  const messages: ChatMessage[] = useMemo(
    () => [
      { id: "demo-q1", role: "user", text: t("premiumIntro.slides.aiChat.q1"), createdAt: 0 },
      { id: "demo-a1", role: "assistant", text: t("premiumIntro.slides.aiChat.a1"), createdAt: 0 },
      { id: "demo-q2", role: "user", text: t("premiumIntro.slides.aiChat.q2"), createdAt: 0 },
      { id: "demo-a2", role: "assistant", text: t("premiumIntro.slides.aiChat.a2"), createdAt: 0 },
    ],
    [t]
  );

  return (
    <SlideFrame
      icon="💬"
      iconBg="#d4f4dd"
      title={t("premiumIntro.slides.aiChat.title")}
      desc={t("premiumIntro.slides.aiChat.desc")}
    >
      <View>
        {messages.map((m) => (
          <AiChatBubble key={m.id} message={m} onImagePress={() => {}} />
        ))}
      </View>
    </SlideFrame>
  );
}
