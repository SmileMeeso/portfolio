// 튜토리얼 스텝 정의 — 오버레이와 진행 로직 양쪽에서 쓰므로 데이터만 따로 둔다
export const TUTORIAL_STEPS: {
  targets: string[];
  text: string;
  pad?: number;
  textSide?: "left" | "right";
  textBelow?: boolean;
}[] = [
  { targets: ["demo-btn"], text: "데모를 사용하실 수 있습니다." },
  { targets: ["tabs"], text: "필요에 따라 모드를 바꿀 수 있습니다." },
  { targets: ["add-part-btn"], text: "클릭하여 부품을 추가할 수 있습니다." },
  { targets: ["sketch-tools"], text: "도형을 스케치 할 수 있습니다." },
  {
    targets: ["sketch-shapes", "part-3d-canvas"],
    text: "닫힌 도형으로 돌출 할 수 있습니다.",
    pad: 48,
  },
  { targets: ["assembly-parts-panel"], text: "방금 그린 부품이 나타납니다." },
  { targets: ["assembly-canvas"], text: "부품을 불러와 조립할 수 있습니다." },
  {
    targets: ["blueprint-parts-list"],
    text: "부품을 선택하여 설계도를 볼 수 있습니다.",
    textBelow: true,
  },
];
