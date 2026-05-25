import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Mode = "live" | "daily";
type StressLevel = "low" | "medium" | "high" | "crisis";
type FoodQuality = "none" | "good" | "okay" | "bad";
type AnxietyLevel = "none" | "mild" | "strong";

type CheckIn = {
  waterGlasses: number;
  stress: StressLevel;
  ateToday: boolean;
  food: FoodQuality;
  anxiety: AnxietyLevel;
  sleepHours: number;
  rested: boolean;
  workHours: number;
  energyDrinks: number;
};

const initialCheckIn: CheckIn = {
  waterGlasses: 3,
  stress: "medium",
  ateToday: true,
  food: "okay",
  anxiety: "mild",
  sleepHours: 6,
  rested: false,
  workHours: 8,
  energyDrinks: 1,
};

const stressOptions: Array<{ label: string; value: StressLevel }> = [
  { label: "Calm", value: "low" },
  { label: "Tense", value: "medium" },
  { label: "Heavy", value: "high" },
  { label: "Crisis", value: "crisis" },
];

const foodOptions: Array<{ label: string; value: FoodQuality }> = [
  { label: "No food", value: "none" },
  { label: "Good", value: "good" },
  { label: "Okay", value: "okay" },
  { label: "Rough", value: "bad" },
];

const anxietyOptions: Array<{ label: string; value: AnxietyLevel }> = [
  { label: "No", value: "none" },
  { label: "A bit", value: "mild" },
  { label: "A lot", value: "strong" },
];

const stressImpact: Record<StressLevel, number> = {
  low: 10,
  medium: -4,
  high: -18,
  crisis: -30,
};

const foodImpact: Record<FoodQuality, number> = {
  none: -18,
  good: 14,
  okay: 2,
  bad: -10,
};

const anxietyImpact: Record<AnxietyLevel, number> = {
  none: 8,
  mild: -6,
  strong: -18,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function calculateScore(data: CheckIn) {
  const sleepScore =
    data.sleepHours >= 7
      ? 16
      : data.sleepHours >= 6
        ? 2
        : -16;
  const waterScore =
    data.waterGlasses >= 7
      ? 14
      : data.waterGlasses >= 4
        ? 4
        : -10;
  const workScore =
    data.workHours <= 6
      ? 8
      : data.workHours <= 8
        ? -2
        : -16;
  const energyScore = data.energyDrinks === 0 ? 5 : -8 * data.energyDrinks;
  const restScore = data.rested ? 12 : -10;
  const mealScore = data.ateToday ? foodImpact[data.food] : -24;

  return clamp(
    52 +
      sleepScore +
      waterScore +
      workScore +
      energyScore +
      restScore +
      mealScore +
      stressImpact[data.stress] +
      anxietyImpact[data.anxiety],
    0,
    100,
  );
}

function getHoweeState(score: number) {
  if (score >= 78) {
    return {
      label: "Steady",
      face: "^-^",
      mood: "Howee feels grounded and cared for.",
      color: "#5f79d6",
      background: "#dce9ff",
      body: "#f8d8e6",
    };
  }

  if (score >= 56) {
    return {
      label: "Holding up",
      face: "o_o",
      mood: "Howee is okay, but the day is taking energy.",
      color: "#9073c7",
      background: "#efe1fb",
      body: "#ffe9a8",
    };
  }

  if (score >= 34) {
    return {
      label: "Drained",
      face: "-_-",
      mood: "Howee needs water, food, rest, or a softer pace.",
      color: "#c06f82",
      background: "#f7dce7",
      body: "#dce9ff",
    };
  }

  return {
    label: "Overloaded",
    face: "x_x",
    mood: "Howee is showing a real overload signal.",
    color: "#9d596b",
    background: "#f4cdd8",
    body: "#ffe9a8",
  };
}

function getSignals(data: CheckIn) {
  const signals: string[] = [];

  if (data.sleepHours < 7) signals.push("Low sleep");
  if (data.waterGlasses < 4) signals.push("Needs water");
  if (!data.ateToday || data.food === "none") signals.push("No meal logged");
  if (data.food === "bad") signals.push("Rough food");
  if (data.stress === "high" || data.stress === "crisis") signals.push("High stress");
  if (data.anxiety === "strong") signals.push("Anxious");
  if (!data.rested) signals.push("No rest");
  if (data.workHours > 8) signals.push("Long workday");
  if (data.energyDrinks > 0) signals.push("Caffeine load");

  return signals.length ? signals : ["Good baseline"];
}

function Stepper({
  label,
  value,
  suffix,
  min,
  max,
  tone,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  min: number;
  max: number;
  tone: "blue" | "pink" | "yellow" | "lilac";
  onChange: (value: number) => void;
}) {
  return (
    <View style={[styles.card, styles.controlRow, toneStyles[tone]]}>
      <View>
        <Text style={styles.controlLabel}>{label}</Text>
        <Text style={styles.controlValue}>
          {value} {suffix}
        </Text>
      </View>
      <View style={styles.stepper}>
        <Pressable
          style={styles.stepButton}
          onPress={() => onChange(clamp(value - 1, min, max))}
        >
          <Text style={styles.stepText}>-</Text>
        </Pressable>
        <Pressable
          style={styles.stepButton}
          onPress={() => onChange(clamp(value + 1, min, max))}
        >
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  tone,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ label: string; value: T }>;
  tone: "blue" | "pink" | "yellow" | "lilac";
  onChange: (value: T) => void;
}) {
  return (
    <View style={[styles.card, styles.segmentBlock, toneStyles[tone]]}>
      <Text style={styles.controlLabel}>{label}</Text>
      <View style={styles.segmentGroup}>
        {options.map((option) => {
          const active = option.value === value;

          return (
            <Pressable
              key={option.value}
              style={[styles.segment, active && styles.segmentActive]}
              onPress={() => onChange(option.value)}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Toggle({
  label,
  value,
  tone,
  onChange,
}: {
  label: string;
  value: boolean;
  tone: "blue" | "pink" | "yellow" | "lilac";
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      style={[styles.card, styles.toggleRow, toneStyles[tone]]}
      onPress={() => onChange(!value)}
    >
      <Text style={styles.controlLabel}>{label}</Text>
      <View style={[styles.toggle, value && styles.toggleActive]}>
        <View style={[styles.toggleKnob, value && styles.toggleKnobActive]} />
      </View>
    </Pressable>
  );
}

export default function App() {
  const [mode, setMode] = useState<Mode>("live");
  const [checkIn, setCheckIn] = useState(initialCheckIn);

  const score = useMemo(() => calculateScore(checkIn), [checkIn]);
  const howee = useMemo(() => getHoweeState(score), [score]);
  const signals = useMemo(() => getSignals(checkIn), [checkIn]);

  const update = <Key extends keyof CheckIn>(key: Key, value: CheckIn[Key]) => {
    setCheckIn((current) => ({ ...current, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>Howee</Text>
            <Text style={styles.subtitle}>A tiny mirror for your real state.</Text>
          </View>
          <View style={styles.modeSwitch}>
            {(["live", "daily"] as Mode[]).map((item) => (
              <Pressable
                key={item}
                style={[styles.modeButton, mode === item && styles.modeButtonActive]}
                onPress={() => setMode(item)}
              >
                <Text style={[styles.modeText, mode === item && styles.modeTextActive]}>
                  {item === "live" ? "Live" : "Daily"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.howeePanel, { backgroundColor: howee.background }]}>
          <View style={styles.panelOrbOne} />
          <View style={styles.panelOrbTwo} />
          <View style={styles.creatureWrap}>
            <View
              style={[
                styles.creatureBody,
                { backgroundColor: howee.body, borderColor: howee.color },
              ]}
            >
              <View style={[styles.creatureEar, styles.creatureEarLeft]} />
              <View style={[styles.creatureEar, styles.creatureEarRight]} />
              <Text style={[styles.creatureFace, { color: howee.color }]}>{howee.face}</Text>
            </View>
            <View style={[styles.creatureShadow, { backgroundColor: howee.color }]} />
          </View>
          <View style={styles.howeeCopy}>
            <Text style={[styles.stateLabel, { color: howee.color }]}>{howee.label}</Text>
            <Text style={styles.score}>{score}/100</Text>
            <Text style={styles.mood}>{howee.mood}</Text>
          </View>
        </View>

        <View style={styles.signalWrap}>
          {signals.map((signal) => (
            <View key={signal} style={styles.signalPill}>
              <Text style={styles.signalText}>{signal}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {mode === "live" ? "Update right now" : "Daily check-in"}
          </Text>
          <Text style={styles.sectionNote}>
            {mode === "live"
              ? "Change any input whenever your day shifts."
              : "Fill it once to summarize the whole day."}
          </Text>
        </View>

        <View style={styles.controls}>
          <Stepper
            label="Water"
            value={checkIn.waterGlasses}
            suffix="glasses"
            min={0}
            max={12}
            tone="blue"
            onChange={(value) => update("waterGlasses", value)}
          />
          <Stepper
            label="Sleep"
            value={checkIn.sleepHours}
            suffix="hours"
            min={0}
            max={14}
            tone="pink"
            onChange={(value) => update("sleepHours", value)}
          />
          <Stepper
            label="Work"
            value={checkIn.workHours}
            suffix="hours"
            min={0}
            max={16}
            tone="yellow"
            onChange={(value) => update("workHours", value)}
          />
          <Stepper
            label="Energy drinks"
            value={checkIn.energyDrinks}
            suffix="today"
            min={0}
            max={6}
            tone="lilac"
            onChange={(value) => update("energyDrinks", value)}
          />

          <SegmentedControl
            label="Work/life stress"
            value={checkIn.stress}
            options={stressOptions}
            tone="pink"
            onChange={(value) => update("stress", value)}
          />
          <Toggle
            label="Ate today"
            value={checkIn.ateToday}
            tone="yellow"
            onChange={(value) => update("ateToday", value)}
          />
          <SegmentedControl
            label="Food quality"
            value={checkIn.food}
            options={foodOptions}
            tone="blue"
            onChange={(value) => update("food", value)}
          />
          <SegmentedControl
            label="Anxiety"
            value={checkIn.anxiety}
            options={anxietyOptions}
            tone="lilac"
            onChange={(value) => update("anxiety", value)}
          />
          <Toggle
            label="Had real rest"
            value={checkIn.rested}
            tone="pink"
            onChange={(value) => update("rested", value)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const toneStyles = StyleSheet.create({
  blue: {
    backgroundColor: "#dce9ff",
  },
  pink: {
    backgroundColor: "#f7dce7",
  },
  yellow: {
    backgroundColor: "#ffe9a8",
  },
  lilac: {
    backgroundColor: "#efe1fb",
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#edf4ff",
  },
  page: {
    paddingBottom: 36,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  logo: {
    color: "#2d2a35",
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: "#7e7b8a",
    fontSize: 14,
    marginTop: 3,
  },
  modeSwitch: {
    backgroundColor: "#ffffff",
    borderColor: "#e7ddec",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  modeButton: {
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modeButtonActive: {
    backgroundColor: "#f0c6d6",
  },
  modeText: {
    color: "#7e7b8a",
    fontSize: 13,
    fontWeight: "700",
  },
  modeTextActive: {
    color: "#2d2a35",
  },
  howeePanel: {
    borderRadius: 34,
    gap: 14,
    marginBottom: 18,
    minHeight: 330,
    overflow: "hidden",
    paddingHorizontal: 22,
    paddingVertical: 26,
    position: "relative",
  },
  panelOrbOne: {
    backgroundColor: "rgba(255, 255, 255, 0.38)",
    borderRadius: 80,
    height: 160,
    position: "absolute",
    right: -54,
    top: -54,
    width: 160,
  },
  panelOrbTwo: {
    backgroundColor: "rgba(255, 255, 255, 0.38)",
    borderRadius: 70,
    bottom: -46,
    height: 140,
    left: -34,
    position: "absolute",
    width: 140,
  },
  creatureWrap: {
    alignItems: "center",
    alignSelf: "center",
    justifyContent: "center",
    width: 220,
  },
  creatureBody: {
    alignItems: "center",
    borderTopLeftRadius: 98,
    borderTopRightRadius: 76,
    borderBottomLeftRadius: 88,
    borderBottomRightRadius: 58,
    borderWidth: 4,
    height: 178,
    justifyContent: "center",
    position: "relative",
    transform: [{ rotate: "-3deg" }],
    width: 180,
  },
  creatureEar: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: 20,
    opacity: 0.8,
    position: "absolute",
    top: 34,
    width: 20,
  },
  creatureEarLeft: {
    left: 44,
  },
  creatureEarRight: {
    right: 44,
  },
  creatureFace: {
    fontSize: 42,
    fontWeight: "800",
  },
  creatureShadow: {
    borderRadius: 999,
    height: 10,
    marginTop: 10,
    opacity: 0.18,
    width: 132,
  },
  howeeCopy: {
    alignItems: "center",
    zIndex: 1,
  },
  stateLabel: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
  },
  score: {
    color: "#2d2a35",
    fontSize: 54,
    fontWeight: "900",
    marginBottom: 8,
  },
  mood: {
    color: "#5b5868",
    fontSize: 16,
    lineHeight: 22,
  },
  signalWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  signalPill: {
    backgroundColor: "#ffffff",
    borderColor: "#eaddea",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  signalText: {
    color: "#6e6a7d",
    fontSize: 13,
    fontWeight: "700",
  },
  sectionHeader: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    marginBottom: 12,
    padding: 18,
  },
  sectionTitle: {
    color: "#2d2a35",
    fontSize: 23,
    fontWeight: "800",
  },
  sectionNote: {
    color: "#7e7b8a",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 4,
  },
  controls: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    borderRadius: 24,
    minHeight: 118,
    padding: 16,
    width: "48.5%",
  },
  controlRow: {
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  controlLabel: {
    color: "#2d2a35",
    fontSize: 15,
    fontWeight: "800",
  },
  controlValue: {
    color: "#7e7b8a",
    fontSize: 14,
    marginTop: 4,
  },
  stepper: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  stepButton: {
    alignItems: "center",
    backgroundColor: "#dce9ff",
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  stepText: {
    color: "#5f79d6",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 27,
  },
  segmentBlock: {
    justifyContent: "space-between",
  },
  segmentGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  segment: {
    backgroundColor: "rgba(255, 255, 255, 0.62)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  segmentActive: {
    backgroundColor: "#f0c6d6",
  },
  segmentText: {
    color: "#6e6a7d",
    fontSize: 14,
    fontWeight: "700",
  },
  segmentTextActive: {
    color: "#2d2a35",
  },
  toggleRow: {
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  toggle: {
    backgroundColor: "#e9e0eb",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    marginTop: 18,
    padding: 3,
    width: 58,
  },
  toggleActive: {
    backgroundColor: "#f0c6d6",
  },
  toggleKnob: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: 26,
    width: 26,
  },
  toggleKnobActive: {
    transform: [{ translateX: 26 }],
  },
});
