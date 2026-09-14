import { useState, useRef, useCallback, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
import { useCadStore } from "./cadStore";
import type { SceneAPI } from "./assemblyEngine";
import BlueprintView from "./BlueprintView";
import PartsTab from "./PartsTab";
import AssemblyTab from "./AssemblyTab";
import TutorialOverlay from "./TutorialOverlay";
import { TUTORIAL_STEPS } from "./tutorialSteps";

type Tab = "parts" | "assembly" | "blueprint";

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MiniCadPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const t = theme.palette.tokens.color;
  const [tab, setTab] = useState<Tab>("parts");
  // 조립 탭은 최초 진입 시에만 마운트하고 이후 유지 (three.js 씬 재생성 방지)
  const [assemblyMounted, setAssemblyMounted] = useState(false);
  const goTab = useCallback((next: Tab) => {
    setTab(next);
    if (next === "assembly") setAssemblyMounted(true);
  }, []);

  // Shared scene API ref (passed down to AssemblyTab)
  const assemblySceneAPIRef = useRef<SceneAPI | null>(null);

  // Demo control
  const [autoSelectPart, setAutoSelectPart] = useState<{
    partId: string;
    view3D: boolean;
  } | null>(null);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoStatus, setDemoStatus] = useState("");
  const demoRunningRef = useRef(false);

  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  const waitForScene = () =>
    new Promise<void>((r) => {
      const check = () =>
        assemblySceneAPIRef.current ? r() : setTimeout(check, 60);
      check();
    });

  const runDemo = async () => {
    if (demoRunningRef.current) return;
    demoRunningRef.current = true;
    setIsDemoRunning(true);

    const go = () => demoRunningRef.current;
    const step = async (msg: string, ms: number) => {
      if (!go()) return;
      setDemoStatus(msg);
      await sleep(ms);
    };

    const store = useCadStore.getState();

    // Clear existing 3D scene instances before reset
    if (assemblySceneAPIRef.current) {
      store.instances.forEach((inst) =>
        assemblySceneAPIRef.current?.removeInstance(inst.instanceId),
      );
    }
    store.resetAll();
    setAutoSelectPart(null);
    goTab("parts");
    await sleep(400);

    if (!go()) return;

    // ── Part 1: OD=130(r=65), ID=100(r=50), h=100 ──
    const p1 = useCadStore.getState().addPart();
    useCadStore.getState().renamePart(p1, "부품 1");
    useCadStore.getState().updateSketch(p1, {
      plane: "xy",
      points: [],
      lines: [],
      circles: [
        { id: `${p1}-o`, cx: 0, cy: 0, r: 65 },
        { id: `${p1}-i`, cx: 0, cy: 0, r: 50, isHole: true },
      ],
    });
    setAutoSelectPart({ partId: p1, view3D: false });
    await step("부품 1 스케치 — 외경 130, 내경 100", 2000);
    if (!go()) return;
    useCadStore
      .getState()
      .setExtrude(p1, { height: 100, loops: [], circleIds: [`${p1}-o`] });
    setAutoSelectPart({ partId: p1, view3D: true });
    await step("부품 1 돌출 100", 2000);

    // ── Part 2: OD=160(r=80), ID=130(r=65), h=30 ──
    if (!go()) return;
    const p2 = useCadStore.getState().addPart();
    useCadStore.getState().renamePart(p2, "부품 2");
    useCadStore.getState().updateSketch(p2, {
      plane: "xy",
      points: [],
      lines: [],
      circles: [
        { id: `${p2}-o`, cx: 0, cy: 0, r: 80 },
        { id: `${p2}-i`, cx: 0, cy: 0, r: 65, isHole: true },
      ],
    });
    setAutoSelectPart({ partId: p2, view3D: false });
    await step("부품 2 스케치 — 외경 160, 내경 130", 2000);
    if (!go()) return;
    useCadStore
      .getState()
      .setExtrude(p2, { height: 30, loops: [], circleIds: [`${p2}-o`] });
    setAutoSelectPart({ partId: p2, view3D: true });
    await step("부품 2 돌출 30", 2000);

    // ── Part 3: OD=100(r=50), ID=70(r=35), h=100 ──
    if (!go()) return;
    const p3 = useCadStore.getState().addPart();
    useCadStore.getState().renamePart(p3, "부품 3");
    useCadStore.getState().updateSketch(p3, {
      plane: "xy",
      points: [],
      lines: [],
      circles: [
        { id: `${p3}-o`, cx: 0, cy: 0, r: 50 },
        { id: `${p3}-i`, cx: 0, cy: 0, r: 35, isHole: true },
      ],
    });
    setAutoSelectPart({ partId: p3, view3D: false });
    await step("부품 3 스케치 — 외경 100, 내경 70", 2000);
    if (!go()) return;
    useCadStore
      .getState()
      .setExtrude(p3, { height: 100, loops: [], circleIds: [`${p3}-o`] });
    setAutoSelectPart({ partId: p3, view3D: true });
    await step("부품 3 돌출 100", 2000);

    // ── Part 4: OD=130(r=65), ID=100(r=50), 내경80(r=40) 그린 뒤 r=40 제거, h=80 ──
    if (!go()) return;
    const p4 = useCadStore.getState().addPart();
    useCadStore.getState().renamePart(p4, "부품 4");
    useCadStore.getState().updateSketch(p4, {
      plane: "xy",
      points: [],
      lines: [],
      circles: [
        { id: `${p4}-o`, cx: 0, cy: 0, r: 65 },
        { id: `${p4}-i`, cx: 0, cy: 0, r: 50, isHole: true },
        { id: `${p4}-x`, cx: 0, cy: 0, r: 40 }, // 삭제 예정
      ],
    });
    setAutoSelectPart({ partId: p4, view3D: false });
    await step("부품 4 스케치 — 외경 130, 내경 100, 내경 80 그리기", 2000);
    if (!go()) return;
    // 내경 80(r=40) 제거
    useCadStore.getState().updateSketch(p4, {
      plane: "xy",
      points: [],
      lines: [],
      circles: [
        { id: `${p4}-o`, cx: 0, cy: 0, r: 65 },
        { id: `${p4}-i`, cx: 0, cy: 0, r: 50, isHole: true },
      ],
    });
    await step("부품 4 — 내경 80 스케치 제거", 2000);
    if (!go()) return;
    useCadStore
      .getState()
      .setExtrude(p4, { height: 80, loops: [], circleIds: [`${p4}-o`] });
    setAutoSelectPart({ partId: p4, view3D: true });
    await step("부품 4 돌출 80", 2000);

    // ── 조립 탭 ──
    if (!go()) return;
    setAutoSelectPart(null);
    await step("조립 탭으로 이동", 500);
    goTab("assembly");
    await waitForScene();
    await sleep(500);

    const api = assemblySceneAPIRef.current!;
    const getPart = (id: string) =>
      useCadStore.getState().parts.find((p) => p.id === id)!;

    // 부품 1 배치 (고정)
    if (!go()) return;
    const i1 = useCadStore.getState().addInstance(p1, [0, 0, 0]);
    api.addInstance(
      { instanceId: i1, partId: p1, position: [0, 0, 0], rotX: 0, links: [] },
      getPart(p1),
    );
    api.setCameraPosition([350, 400, 700], [0, 50, 0]);
    await step("부품 1 배치", 2000);

    // 부품 3 배치
    if (!go()) return;
    const i3 = useCadStore.getState().addInstance(p3, [350, 0, 0]);
    api.addInstance(
      { instanceId: i3, partId: p3, position: [350, 0, 0], rotX: 0, links: [] },
      getPart(p3),
    );
    api.setCameraPosition([500, 350, 750], [175, 50, 0]);
    await step("부품 3 배치 — 조립 준비", 2000);

    // 카메라를 부품1 바닥 내경이 보이도록 (아래에서 올려보는 각도)
    if (!go()) return;
    api.setCameraPosition([200, -150, 400], [0, 0, 0]);
    await step("부품 1 바닥 내경이 보이도록 카메라 전환", 2000);

    // 부품1 내경 + 부품3 외경 결합
    if (!go()) return;
    const r13 = api.assemble(i1, "hole-0-bottom", i3, "circ-0-bottom");
    if (r13.success && r13.moverPos) {
      useCadStore.getState().setInstancePosition(i3, r13.moverPos);
      useCadStore.getState().setInstanceRotX(i3, 0);
      useCadStore.getState().linkInstances({
        ownerInstanceId: i3,
        myEdgeId: "circ-0-bottom",
        targetInstanceId: i1,
        targetEdgeId: "hole-0-bottom",
      });
    }
    api.setCameraPosition([250, 350, 600], [0, 50, 0]);
    await step("부품 1 내경 ↔ 부품 3 외경 결합", 2000);

    // 부품 2 배치
    if (!go()) return;
    const i2 = useCadStore.getState().addInstance(p2, [350, 0, 200]);
    api.addInstance(
      {
        instanceId: i2,
        partId: p2,
        position: [350, 0, 200],
        rotX: 0,
        links: [],
      },
      getPart(p2),
    );
    api.setCameraPosition([520, 320, 720], [150, 30, 80]);
    await step("부품 2 배치 — 조립 준비", 2000);

    // 부품2 바닥 내경 + 부품1 바닥 외경 결합
    if (!go()) return;
    const r12 = api.assemble(i1, "circ-0-bottom", i2, "hole-0-bottom");
    if (r12.success && r12.moverPos) {
      useCadStore.getState().setInstancePosition(i2, r12.moverPos);
      useCadStore.getState().setInstanceRotX(i2, 0);
      useCadStore.getState().linkInstances({
        ownerInstanceId: i2,
        myEdgeId: "hole-0-bottom",
        targetInstanceId: i1,
        targetEdgeId: "circ-0-bottom",
      });
    }
    api.setCameraPosition([300, 280, 620], [0, 30, 0]);
    await step("부품 2 바닥 내경 ↔ 부품 1 바닥 외경 결합", 2000);

    // 부품 4 배치
    if (!go()) return;
    const i4 = useCadStore.getState().addInstance(p4, [-350, 0, 0]);
    api.addInstance(
      {
        instanceId: i4,
        partId: p4,
        position: [-350, 0, 0],
        rotX: 0,
        links: [],
      },
      getPart(p4),
    );
    api.setCameraPosition([-200, 420, 720], [-80, 80, 0]);
    await step("부품 4 배치 — 조립 준비", 2000);

    // 부품1 위쪽 외경 + 부품4 바닥 외경 결합
    if (!go()) return;
    const r14 = api.assemble(i1, "circ-0-top", i4, "circ-0-bottom");
    if (r14.success && r14.moverPos) {
      useCadStore.getState().setInstancePosition(i4, r14.moverPos);
      useCadStore.getState().setInstanceRotX(i4, 0);
      useCadStore.getState().linkInstances({
        ownerInstanceId: i4,
        myEdgeId: "circ-0-bottom",
        targetInstanceId: i1,
        targetEdgeId: "circ-0-top",
      });
    }
    api.setCameraPosition([450, 550, 900], [0, 100, 0]);
    await step("부품 1 위쪽 외경 ↔ 부품 4 바닥 외경 결합", 2000);

    // 설계도 탭
    if (!go()) return;
    goTab("blueprint");
    await step("설계도 보기", 2000);

    setDemoStatus("");
    setIsDemoRunning(false);
    demoRunningRef.current = false;
  };

  const stopDemo = () => {
    demoRunningRef.current = false;
    setIsDemoRunning(false);
    setDemoStatus("");
    setAutoSelectPart(null);
  };

  // ── Tutorial ──────────────────────────────────────────────────────────────
  const [tutorialStep, setTutorialStep] = useState<number>(1);
  const tutorialPartIdRef = useRef<string | null>(null);
  const tutorialAdvancingRef = useRef(false);

  const exitTutorial = useCallback(() => {
    setTutorialStep(0);
    setAutoSelectPart(null);
    goTab("parts");
    const store = useCadStore.getState();
    if (assemblySceneAPIRef.current) {
      store.instances.forEach((inst) =>
        assemblySceneAPIRef.current?.removeInstance(inst.instanceId),
      );
    }
    store.resetAll();
    tutorialPartIdRef.current = null;
  }, [goTab]);

  const tutorialAnimCancelRef = useRef(false);

  // Runs BEFORE the step is shown (tab switches, initial setup)
  const runTutorialPreAction = async (toStep: number) => {
    if (toStep === 4) {
      goTab("parts");
      await sleep(300);
      const pid = useCadStore.getState().addPart();
      tutorialPartIdRef.current = pid;
      setAutoSelectPart({ partId: pid, view3D: false });
      await sleep(400);
    } else if (toStep === 5) {
      // Show only outer circle in sketch mode when spotlight first appears
      const pid = tutorialPartIdRef.current;
      if (pid) {
        useCadStore.getState().updateSketch(pid, {
          plane: "xy",
          points: [],
          lines: [],
          circles: [{ id: `${pid}-o`, cx: 0, cy: 0, r: 65 }],
        });
        setAutoSelectPart({ partId: pid, view3D: false });
        await sleep(300);
      }
    } else if (toStep === 6) {
      setAutoSelectPart(null);
      goTab("assembly");
      await waitForScene();
      await sleep(500);
    } else if (toStep === 7) {
      // Just switch to assembly — the instance placement & assembly happen in post-action
      goTab("assembly");
      await waitForScene();
      await sleep(400);
    } else if (toStep === 8) {
      goTab("blueprint");
      await sleep(500);
    }
  };

  // Runs AFTER the step spotlight appears (animations visible in the spotlight)
  const runTutorialPostAction = async (toStep: number) => {
    if (toStep === 5) {
      const pid = tutorialPartIdRef.current;
      if (!pid) return;

      // Scene 1: outer circle — already visible, hold
      await sleep(1000);
      if (tutorialAnimCancelRef.current) return;

      // Scene 2: add inner hole circle
      useCadStore.getState().updateSketch(pid, {
        plane: "xy",
        points: [],
        lines: [],
        circles: [
          { id: `${pid}-o`, cx: 0, cy: 0, r: 65 },
          { id: `${pid}-i`, cx: 0, cy: 0, r: 40, isHole: true },
        ],
      });
      await sleep(1000);
      if (tutorialAnimCancelRef.current) return;

      // Scene 3: extrude → 3D view
      useCadStore
        .getState()
        .setExtrude(pid, { height: 100, loops: [], circleIds: [`${pid}-o`] });
      setAutoSelectPart({ partId: pid, view3D: true });
    } else if (toStep === 7) {
      const pid = tutorialPartIdRef.current;
      if (!pid || !assemblySceneAPIRef.current) return;
      const api = assemblySceneAPIRef.current;
      const part = useCadStore.getState().parts.find((p) => p.id === pid);
      if (!part) return;

      // Scene 1: place first instance
      const iid1 = useCadStore.getState().addInstance(pid, [0, 0, 0]);
      api.addInstance(
        {
          instanceId: iid1,
          partId: pid,
          position: [0, 0, 0],
          rotX: 0,
          links: [],
        },
        part,
      );
      api.setCameraPosition([300, 300, 500], [0, 50, 0]);
      await sleep(900);
      if (tutorialAnimCancelRef.current) return;

      // Scene 2: place second instance offset
      const iid2 = useCadStore.getState().addInstance(pid, [250, 0, 0]);
      api.addInstance(
        {
          instanceId: iid2,
          partId: pid,
          position: [250, 0, 0],
          rotX: 0,
          links: [],
        },
        part,
      );
      api.setCameraPosition([400, 300, 600], [120, 50, 0]);
      await sleep(900);
      if (tutorialAnimCancelRef.current) return;

      // Scene 3: assemble
      const result = api.assemble(iid1, "circ-0-top", iid2, "circ-0-bottom");
      if (result.success && result.moverPos) {
        useCadStore.getState().setInstancePosition(iid2, result.moverPos);
        useCadStore.getState().setInstanceRotX(iid2, 0);
        useCadStore.getState().linkInstances({
          ownerInstanceId: iid2,
          myEdgeId: "circ-0-bottom",
          targetInstanceId: iid1,
          targetEdgeId: "circ-0-top",
        });
      }
      api.setCameraPosition([200, 350, 500], [0, 100, 0]);
    }
  };

  const restartTutorial = () => {
    tutorialAnimCancelRef.current = true;
    tutorialAdvancingRef.current = false;
    tutorialPartIdRef.current = null;
    const store = useCadStore.getState();
    if (assemblySceneAPIRef.current) {
      store.instances.forEach((inst) =>
        assemblySceneAPIRef.current?.removeInstance(inst.instanceId),
      );
    }
    store.resetAll();
    setAutoSelectPart(null);
    goTab('parts');
    setTutorialStep(1);
  };

  const advanceTutorial = async () => {
    if (tutorialAdvancingRef.current) return;
    tutorialAdvancingRef.current = true;
    tutorialAnimCancelRef.current = true; // cancel any running post-animation

    // Guarantee extrude exists when leaving step 5 (user may have skipped animation)
    if (tutorialStep === 5) {
      const pid = tutorialPartIdRef.current;
      if (pid) {
        const st = useCadStore.getState();
        const part = st.parts.find((p) => p.id === pid);
        if (part) {
          const hasOuter = part.sketch?.circles.some((c) => c.id === `${pid}-o`);
          if (!hasOuter) {
            st.updateSketch(pid, {
              plane: 'xy', points: [], lines: [],
              circles: [
                { id: `${pid}-o`, cx: 0, cy: 0, r: 65 },
                { id: `${pid}-i`, cx: 0, cy: 0, r: 40, isHole: true },
              ],
            });
          }
          if (!part.extrude) {
            st.setExtrude(pid, { height: 100, loops: [], circleIds: [`${pid}-o`] });
          }
        }
      }
    }

    const next = tutorialStep + 1;
    if (next > TUTORIAL_STEPS.length) {
      exitTutorial();
      tutorialAdvancingRef.current = false;
      return;
    }
    await runTutorialPreAction(next);
    setTutorialStep(next);
    tutorialAdvancingRef.current = false;
    // Launch post-animation (fire-and-forget, cancellable on next advance)
    tutorialAnimCancelRef.current = false;
    runTutorialPostAction(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && tutorialStep > 0) exitTutorial();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tutorialStep, exitTutorial]);

  const TAB_LABELS: Record<Tab, string> = {
    parts: "부품",
    assembly: "조립",
    blueprint: "설계도",
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        bgcolor: t.bgPrimary,
        height: "calc(100vh - 64px)",
        overflow: "hidden",
      }}
    >
      {/* Tutorial overlay */}
      {tutorialStep > 0 && !isDemoRunning && (
        <TutorialOverlay
          step={tutorialStep}
          onNext={advanceTutorial}
          onExit={exitTutorial}
        />
      )}

      {/* Demo status overlay */}
      {isDemoRunning && demoStatus && (
        <Box
          sx={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            bgcolor: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)",
            border: "1px solid #3B82F6",
            borderRadius: "8px",
            px: "20px",
            py: "10px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#3B82F6",
              flexShrink: 0,
              "@keyframes pulse": {
                "0%,100%": { opacity: 1 },
                "50%": { opacity: 0.3 },
              },
              animation: "pulse 1s ease-in-out infinite",
            }}
          />
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: isDark ? "#E2E8F0" : "#1E293B",
            }}
          >
            {demoStatus}
          </Typography>
        </Box>
      )}

      {/* Tab bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: `${tokens.spacing[4]}px`,
          px: `${tokens.spacing[16]}px`,
          height: 48,
          flexShrink: 0,
          borderBottom: `1px solid ${t.borderDefault}`,
          bgcolor: t.bgPrimary,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Typography
          sx={{
            fontSize: tokens.fontSize.sm,
            fontWeight: 700,
            color: t.textPrimary,
            mr: `${tokens.spacing[12]}px`,
          }}
        >
          미니 캐드
        </Typography>
        <Box
          data-tut="tabs"
          sx={{ display: "flex", gap: `${tokens.spacing[4]}px` }}
        >
          {(["parts", "assembly", "blueprint"] as Tab[]).map((m) => (
            <Box
              key={m}
              onClick={() => !isDemoRunning && goTab(m)}
              sx={{
                px: `${tokens.spacing[12]}px`,
                height: 30,
                display: "flex",
                alignItems: "center",
                borderRadius: `${tokens.radius.sm}px`,
                bgcolor: tab === m ? t.accentBlue : "transparent",
                color: tab === m ? t.textOnAccent : t.textSecondary,
                cursor: isDemoRunning ? "default" : "pointer",
                userSelect: "none",
                fontSize: tokens.fontSize.sm,
                fontWeight: tab === m ? 600 : 400,
                transition: "all 0.15s",
                "&:hover": {
                  bgcolor: isDemoRunning
                    ? "transparent"
                    : tab === m
                      ? t.accentBlue
                      : t.bgSurface,
                },
              }}
            >
              {TAB_LABELS[m]}
            </Box>
          ))}
        </Box>

        {/* Help + Demo buttons */}
        <Box sx={{ ml: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          {tutorialStep === 0 && !isDemoRunning && (
            <Box
              onClick={restartTutorial}
              sx={{
                width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: `${tokens.radius.sm}px`,
                border: `1px solid ${t.borderDefault}`,
                color: t.textSecondary,
                cursor: "pointer", fontSize: 13, fontWeight: 600,
                "&:hover": { borderColor: t.accentBlue, color: t.accentBlue },
              }}
            >
              ?
            </Box>
          )}
          {isDemoRunning ? (
            <Box
              onClick={stopDemo}
              sx={{
                px: "12px",
                height: 28,
                display: "flex",
                alignItems: "center",
                borderRadius: `${tokens.radius.sm}px`,
                border: "1px solid #EF4444",
                color: "#EF4444",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                "&:hover": { bgcolor: "rgba(239,68,68,0.08)" },
              }}
            >
              ■ 중지
            </Box>
          ) : (
            <Box
              data-tut="demo-btn"
              onClick={runDemo}
              sx={{
                px: "12px",
                height: 28,
                display: "flex",
                alignItems: "center",
                borderRadius: `${tokens.radius.sm}px`,
                border: "1px solid #A855F7",
                color: "#A855F7",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                "&:hover": { bgcolor: "rgba(168,85,247,0.08)" },
              }}
            >
              ▶ 데모
            </Box>
          )}
        </Box>
      </Box>  {/* end tab bar */}

      {tab === "parts" && (
        <Box sx={{ flex: 1, overflow: "hidden" }}>
          <PartsTab autoSelect={autoSelectPart} />
        </Box>
      )}

      {/* Lazy-mount assembly (first visit), then keep mounted to preserve Three.js scene */}
      {assemblyMounted && (
        <Box
          sx={{
            flex: 1,
            display: tab === "assembly" ? "flex" : "none",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          <AssemblyTab isDark={isDark} sceneAPIRef={assemblySceneAPIRef} />
        </Box>
      )}

      {tab === "blueprint" && (
        <Box sx={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
          <BlueprintView isDark={isDark} />
        </Box>
      )}
    </Box>
  );
}
