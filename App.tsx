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
      color: "#2f7c6f",
      background: "#dff2ea",
    };
  }

  if (score >= 56) {
    return {
      label: "Holding up",
      face: "o_o",
      mood: "Howee is okay, but the day is taking energy.",
      color: "#9a6a1f",
      background: "#f7e7c2",
    };
  }

  if (score >= 34) {
    return {
      label: "Drained",
      face: "-_-",
      mood: "Howee needs water, food, rest, or a softer pace.",
      color: "#a24c2a",
      background: "#f5d3c4",
    };
  }

  return {
    label: "Overloaded",
    face: "x_x",
    mood: "Howee is showing a real overload signal.",
    color: "#8f2e3b",
    background: "#f0c7ce",
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
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.controlRow}>
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
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmentBlock}>
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
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable style={styles.toggleRow} onPress={() => onChange(!value)}>
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
          <View style={styles.creatureWrap}>
            <View style={[styles.creatureBody, { borderColor: howee.color }]}>
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
            onChange={(value) => update("waterGlasses", value)}
          />
          <Stepper
            label="Sleep"
            value={checkIn.sleepHours}
            suffix="hours"
            min={0}
            max={14}
            onChange={(value) => update("sleepHours", value)}
          />
          <Stepper
            label="Work"
            value={checkIn.workHours}
            suffix="hours"
            min={0}
            max={16}
            onChange={(value) => update("workHours", value)}
          />
          <Stepper
            label="Energy drinks"
            value={checkIn.energyDrinks}
            suffix="today"
            min={0}
            max={6}
            onChange={(value) => update("energyDrinks", value)}
          />

          <SegmentedControl
            label="Work/life stress"
            value={checkIn.stress}
            options={stressOptions}
            onChange={(value) => update("stress", value)}
          />
          <Toggle
            label="Ate today"
            value={checkIn.ateToday}
            onChange={(value) => update("ateToday", value)}
          />
          <SegmentedControl
            label="Food quality"
            value={checkIn.food}
            options={foodOptions}
            onChange={(value) => update("food", value)}
          />
          <SegmentedControl
            label="Anxiety"
            value={checkIn.anxiety}
            options={anxietyOptions}
            onChange={(value) => update("anxiety", value)}
          />
          <Toggle
            label="Had real rest"
            value={checkIn.rested}
            onChange={(value) => update("rested", value)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8f4ee",
  },
  page: {
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  logo: {
    color: "#222831",
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: "#68717a",
    fontSize: 14,
    marginTop: 3,
  },
  modeSwitch: {
    backgroundColor: "#e8ded2",
    borderRadius: 8,
    flexDirection: "row",
    padding: 4,
  },
  modeButton: {
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modeButtonActive: {
    backgroundColor: "#222831",
  },
  modeText: {
    color: "#52616b",
    fontSize: 13,
    fontWeight: "700",
  },
  modeTextActive: {
    color: "#ffffff",
  },
  howeePanel: {
    borderRadius: 8,
    flexDirection: "row",
    gap: 18,
    marginBottom: 16,
    padding: 20,
  },
  creatureWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 122,
  },
  creatureBody: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderRadius: 56,
    borderWidth: 4,
    height: 112,
    justifyContent: "center",
    width: 104,
  },
  creatureFace: {
    fontSize: 28,
    fontWeight: "800",
  },
  creatureShadow: {
    borderRadius: 999,
    height: 10,
    marginTop: 10,
    opacity: 0.18,
    width: 78,
  },
  howeeCopy: {
    flex: 1,
    justifyContent: "center",
  },
  stateLabel: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
  },
  score: {
    color: "#222831",
    fontSize: 40,
    fontWeight: "900",
    marginBottom: 8,
  },
  mood: {
    color: "#3f4952",
    fontSize: 16,
    lineHeight: 22,
  },
  signalWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  signalPill: {
    backgroundColor: "#ffffff",
    borderColor: "#e5dbcf",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  signalText: {
    color: "#52616b",
    fontSize: 13,
    fontWeight: "700",
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#222831",
    fontSize: 23,
    fontWeight: "800",
  },
  sectionNote: {
    color: "#68717a",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 4,
  },
  controls: {
    gap: 12,
  },
  controlRow: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#eadfd1",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  controlLabel: {
    color: "#222831",
    fontSize: 15,
    fontWeight: "800",
  },
  controlValue: {
    color: "#68717a",
    fontSize: 14,
    marginTop: 4,
  },
  stepper: {
    flexDirection: "row",
    gap: 8,
  },
  stepButton: {
    alignItems: "center",
    backgroundColor: "#222831",
    borderRadius: 8,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  stepText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 27,
  },
  segmentBlock: {
    backgroundColor: "#ffffff",
    borderColor: "#eadfd1",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  segmentGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  segment: {
    backgroundColor: "#f4ede4",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  segmentActive: {
    backgroundColor: "#2f7c6f",
  },
  segmentText: {
    color: "#52616b",
    fontSize: 14,
    fontWeight: "700",
  },
  segmentTextActive: {
    color: "#ffffff",
  },
  toggleRow: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#eadfd1",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  toggle: {
    backgroundColor: "#d6cbbd",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    padding: 3,
    width: 58,
  },
  toggleActive: {
    backgroundColor: "#2f7c6f",
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
