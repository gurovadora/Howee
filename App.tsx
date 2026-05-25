import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text style={styles.kicker}>Howee</Text>
        <Text style={styles.title}>A warm start for your mobile pet project.</Text>
        <Text style={styles.description}>
          This Expo app is ready for the first real feature: onboarding, auth, home screen,
          or whatever shape Howee wants to take.
        </Text>
        <TouchableOpacity style={styles.button} activeOpacity={0.82}>
          <Text style={styles.buttonText}>Start building</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7f3ed",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  kicker: {
    color: "#2f7c6f",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  title: {
    color: "#1f2933",
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 42,
    marginBottom: 18,
  },
  description: {
    color: "#52616b",
    fontSize: 17,
    lineHeight: 25,
    marginBottom: 32,
  },
  button: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#1f2933",
    borderRadius: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
