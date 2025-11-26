// app/training.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Vibration,
  Alert,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { apiAuth } from "../lib/api";

const BASE_URL = "https://vitalgym.fit";

type Exercise = {
  id: number;
  nombre?: string;
  descripcion?: string;
  imagenUrl?: string;
  videoUrl?: string;
};

type RoutineExercise = {
  id: number;
  routineId: number;
  exerciseId: number;
  dia: number;
  series: string | number[];
  descansoSegundos: number;
  notas?: string;
  exercise?: Exercise;
};

type SerieData = {
  serieNum: number;
  reps: number;
  kg: string;
  completed: boolean;
};

export default function TrainingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const requestedDay = params.dia ? parseInt(String(params.dia), 10) : null;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Training state
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  
  // Series state for current exercise
  const [seriesData, setSeriesData] = useState<SerieData[]>([]);
  const [currentSerieIndex, setCurrentSerieIndex] = useState(0);
  
  // Timer state
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Completed exercises data for saving
  const [completedExercises, setCompletedExercises] = useState<any[]>([]);
  
  // User notes for current exercise
  const [exerciseNotes, setExerciseNotes] = useState<string>("");
  
  // Last exercise data (previous kg and notes)
  const [lastExerciseData, setLastExerciseData] = useState<Record<number, { seriesData: SerieData[], notas: string }>>({});
  
  // Instructions modal
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Helper to parse series
  function parseSeries(seriesStr: string | number[] | undefined): number[] {
    if (!seriesStr) return [];
    if (Array.isArray(seriesStr)) return seriesStr.map(Number);
    try {
      const arr = JSON.parse(seriesStr);
      return Array.isArray(arr) ? arr.map(Number) : [];
    } catch {
      return [];
    }
  }

  function getImageUrl(path?: string) {
    if (!path) return undefined;
    if (path.startsWith("http")) return path;
    return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  }

  // Load training data
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Use requested day if provided, otherwise get current training day
        let day: number;
        if (requestedDay && requestedDay > 0) {
          day = requestedDay;
        } else {
          const dayRes = await apiAuth.get("/client/current-training-day");
          day = dayRes.data.currentTrainingDay;
        }
        setCurrentDay(day);
        
        // Get exercises for this day
        const exRes = await apiAuth.get(`/client/training-day/${day}/exercises`);
        const dayExercises = exRes.data;
        
        if (!dayExercises || dayExercises.length === 0) {
          setError("No hay ejercicios para el día seleccionado.");
          return;
        }
        
        setExercises(dayExercises);
        initializeExerciseSeries(dayExercises[0]);
      } catch (e: any) {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "No se pudo cargar el entrenamiento."
        );
      } finally {
        setLoading(false);
      }
    })();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Initialize series for an exercise (with previous kg values if available)
  const initializeExerciseSeries = useCallback(async (exercise: RoutineExercise) => {
    const reps = parseSeries(exercise.series);
    
    // Try to fetch last exercise data for kg and notes
    let previousKg: Record<number, string> = {};
    let previousNotes = "";
    
    try {
      const lastDataRes = await apiAuth.get(`/client/last-exercise-data/${exercise.id}`);
      if (lastDataRes.data.found && lastDataRes.data.seriesData) {
        // Map series number to kg value
        for (const serie of lastDataRes.data.seriesData) {
          if (serie.kg) {
            previousKg[serie.serieNum] = serie.kg;
          }
        }
        previousNotes = lastDataRes.data.notas || "";
      }
    } catch (e) {
      // No previous data available - that's fine
      console.log("No previous exercise data found");
    }
    
    const initialSeries: SerieData[] = reps.map((rep, idx) => ({
      serieNum: idx + 1,
      reps: rep,
      kg: previousKg[idx + 1] || "", // Pre-fill with previous kg if available
      completed: false,
    }));
    setSeriesData(initialSeries);
    setCurrentSerieIndex(0);
    setIsResting(false);
    setRestTimeLeft(0);
    setExerciseNotes(previousNotes); // Pre-fill with previous notes
  }, []);

  // Timer effect
  useEffect(() => {
    if (isResting && restTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setRestTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer finished
            if (timerRef.current) clearInterval(timerRef.current);
            setIsResting(false);
            Vibration.vibrate([0, 500, 200, 500]); // Vibration pattern as alert
            Alert.alert("¡Descanso terminado!", "Es hora de la siguiente serie");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isResting, restTimeLeft]);

  // Complete a serie
  const completeSerie = (serieIndex: number) => {
    if (seriesData[serieIndex].completed) return;
    
    const newSeriesData = [...seriesData];
    newSeriesData[serieIndex].completed = true;
    setSeriesData(newSeriesData);
    
    const currentExercise = exercises[currentExerciseIndex];
    const restTime = currentExercise.descansoSegundos || 90;
    
    // Always start rest timer after completing a serie (even the last one)
    setRestTimeLeft(restTime);
    setIsResting(true);
    
    // Check if all series are completed
    const allCompleted = newSeriesData.every(s => s.completed);
    if (!allCompleted) {
      setCurrentSerieIndex(serieIndex + 1);
    }
  };

  // Update kg for a serie
  const updateKg = (serieIndex: number, value: string) => {
    const newSeriesData = [...seriesData];
    newSeriesData[serieIndex].kg = value;
    setSeriesData(newSeriesData);
  };

  // Move to next exercise
  const goToNextExercise = (skipCurrent: boolean = false) => {
    const currentExercise = exercises[currentExerciseIndex];
    
    // Save completed exercise data (even if skipped)
    setCompletedExercises((prev) => [
      ...prev,
      {
        routineExerciseId: currentExercise.id,
        nombre: currentExercise.exercise?.nombre || `Ejercicio #${currentExercise.exerciseId}`,
        seriesData: seriesData,
        notas: exerciseNotes,
        skipped: skipCurrent,
      },
    ]);
    
    if (currentExerciseIndex < exercises.length - 1) {
      // Go to next exercise
      const nextIndex = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextIndex);
      initializeExerciseSeries(exercises[nextIndex]);
    } else {
      // Workout complete - save and go back
      finishWorkout();
    }
  };

  // Finish workout
  const finishWorkout = async () => {
    try {
      setLoading(true);
      
      const currentExercise = exercises[currentExerciseIndex];
      const allExercisesData = [
        ...completedExercises,
        {
          routineExerciseId: currentExercise.id,
          nombre: currentExercise.exercise?.nombre || `Ejercicio #${currentExercise.exerciseId}`,
          seriesData: seriesData,
          notas: exerciseNotes,
          skipped: false,
        },
      ];
      
      await apiAuth.post("/client/complete-workout", {
        diaRutina: currentDay,
        ejercicios: allExercisesData,
      });
      
      Alert.alert(
        "¡Entrenamiento completado!",
        "Has terminado el entrenamiento del día. ¡Buen trabajo!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message || "No se pudo guardar el entrenamiento."
      );
    } finally {
      setLoading(false);
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Check if all series are completed
  const allSeriesCompleted = seriesData.length > 0 && seriesData.every((s) => s.completed);
  const isLastExercise = currentExerciseIndex === exercises.length - 1;

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0E0E0E",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#C6FF00" />
        <Text style={{ color: "#9a9a9a", marginTop: 8 }}>
          Cargando entrenamiento…
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0E0E0E", padding: 16 }}>
        <Text style={{ color: "#ff8a8a", marginBottom: 12 }}>{error}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: "white" }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  const exerciseName = currentExercise?.exercise?.nombre || `Ejercicio #${currentExercise?.exerciseId}`;
  const exerciseImage = getImageUrl(currentExercise?.exercise?.imagenUrl);
  const restSeconds = currentExercise?.descansoSegundos || 90;
  const exerciseDescription = currentExercise?.exercise?.descripcion || "";

  return (
    <View style={{ flex: 1, backgroundColor: "#0E0E0E" }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Header with image */}
        <View style={{ height: 200, backgroundColor: "#141414" }}>
          {exerciseImage ? (
            <Image
              source={{ uri: exerciseImage }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#666", fontSize: 40 }}>🏋️</Text>
            </View>
          )}

          {/* Back button */}
          <Pressable
            onPress={() => {
              Alert.alert(
                "Cancelar entrenamiento",
                "¿Estás seguro de que quieres salir? Se perderá el progreso.",
                [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Salir", style: "destructive", onPress: () => router.back() },
                ]
              );
            }}
            style={{ position: "absolute", top: 40, left: 16 }}
          >
            <Text style={{ color: "white", fontSize: 20 }}>←</Text>
          </Pressable>

          {/* Progress indicator */}
          <View
            style={{
              position: "absolute",
              top: 40,
              right: 16,
              backgroundColor: "rgba(0,0,0,0.6)",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
              Día {currentDay} • {currentExerciseIndex + 1}/{exercises.length}
            </Text>
          </View>

          {/* Title */}
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              padding: 16,
              backgroundColor: "rgba(14,14,14,0.7)",
            }}
          >
            <Text style={{ color: "white", fontSize: 20, fontWeight: "700" }}>
              {exerciseName}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ padding: 16, gap: 16 }}>
          {/* Action icons bar */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              alignItems: "center",
              paddingVertical: 12,
              backgroundColor: "#151515",
              borderRadius: 12,
            }}
          >
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={{ color: "white", fontSize: 18 }}>⏱</Text>
              <Text style={{ color: "white", fontSize: 12 }}>
                {formatTime(restSeconds)}
              </Text>
            </View>
            <Pressable 
              onPress={() => setShowInstructions(true)}
              style={{ alignItems: "center", gap: 4 }}
            >
              <Text style={{ color: "white", fontSize: 18 }}>▶</Text>
              <Text style={{ color: "white", fontSize: 12 }}>Instrucciones</Text>
            </Pressable>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={{ color: "white", fontSize: 18 }}>📊</Text>
              <Text style={{ color: "white", fontSize: 12 }}>Analíticas</Text>
            </View>
          </View>

          {/* Series */}
          <View style={{ gap: 12 }}>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
              Series ({seriesData.filter((s) => s.completed).length}/{seriesData.length} completadas)
            </Text>

            {seriesData.map((serie, index) => {
              // Check if timer should show on this row (show on next serie after completing one)
              const showTimerOnThisRow = isResting && index === currentSerieIndex;
              
              return (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {/* Serie number / completion button */}
                  <Pressable
                    onPress={() => !serie.completed && completeSerie(index)}
                    disabled={serie.completed || (index > 0 && !seriesData[index - 1].completed) || isResting}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: serie.completed ? "#C6FF00" : "#151515",
                      borderWidth: serie.completed ? 0 : 2,
                      borderColor: index === currentSerieIndex && !isResting ? "#C6FF00" : "#232323",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: serie.completed ? 0.8 : (index > 0 && !seriesData[index - 1].completed) ? 0.5 : 1,
                    }}
                  >
                    {serie.completed ? (
                      <Text style={{ color: "#0E0E0E", fontSize: 18, fontWeight: "800" }}>✓</Text>
                    ) : (
                      <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>{index + 1}</Text>
                    )}
                  </Pressable>

                  {/* Show timer inline on this row OR show reps/kg */}
                  {showTimerOnThisRow ? (
                    // Inline timer replaces reps and kg fields
                    <View
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: "#1a2e1a",
                          borderWidth: 2,
                          borderColor: "#C6FF00",
                          borderRadius: 12,
                          padding: 12,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: "#C6FF00", fontSize: 10, fontWeight: "600" }}>DESCANSO</Text>
                        <Text style={{ color: "#C6FF00", fontSize: 28, fontWeight: "800" }}>
                          {formatTime(restTimeLeft)}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          if (timerRef.current) clearInterval(timerRef.current);
                          setIsResting(false);
                          setRestTimeLeft(0);
                        }}
                        style={{
                          backgroundColor: "#333",
                          paddingHorizontal: 12,
                          paddingVertical: 16,
                          borderRadius: 12,
                        }}
                      >
                        <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>SALTAR</Text>
                      </Pressable>
                    </View>
                  ) : (
                    // Normal reps and kg display
                    <>
                      {/* Reps */}
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: "#151515",
                          borderWidth: 1,
                          borderColor: "#232323",
                          borderRadius: 12,
                          padding: 12,
                        }}
                      >
                        <Text style={{ color: "#BDBDBD", fontSize: 11 }}>REPS</Text>
                        <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                          {serie.reps}
                        </Text>
                      </View>

                      {/* Kg input - always editable */}
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: "#151515",
                          borderWidth: 1,
                          borderColor: serie.completed ? "#C6FF00" : "#232323",
                          borderRadius: 12,
                          padding: 12,
                        }}
                      >
                        <Text style={{ color: "#BDBDBD", fontSize: 11 }}>KG</Text>
                        <TextInput
                          style={{
                            color: "white",
                            fontSize: 16,
                            fontWeight: "600",
                            padding: 0,
                          }}
                          placeholder="0"
                          placeholderTextColor="#666"
                          keyboardType="numeric"
                          value={serie.kg}
                          onChangeText={(text) => updateKg(index, text)}
                        />
                      </View>
                    </>
                  )}
                </View>
              );
            })}
          </View>

          {/* Trainer Notes */}
          {currentExercise?.notas && (
            <View style={{ gap: 6 }}>
              <Text style={{ color: "white", fontWeight: "700" }}>Notas del entrenador</Text>
              <View
                style={{
                  backgroundColor: "#151515",
                  borderWidth: 1,
                  borderColor: "#232323",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <Text style={{ color: "#BDBDBD" }}>{currentExercise.notas}</Text>
              </View>
            </View>
          )}

          {/* User Notes */}
          <View style={{ gap: 6 }}>
            <Text style={{ color: "white", fontWeight: "700" }}>Mis notas</Text>
            <View
              style={{
                backgroundColor: "#151515",
                borderWidth: 1,
                borderColor: "#232323",
                borderRadius: 12,
                minHeight: 80,
                padding: 12,
              }}
            >
              <TextInput
                style={{
                  color: "white",
                  fontSize: 14,
                  padding: 0,
                  textAlignVertical: "top",
                }}
                placeholder="Escribe cómo te fue el ejercicio..."
                placeholderTextColor="#666"
                multiline
                value={exerciseNotes}
                onChangeText={setExerciseNotes}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Instructions Modal */}
      <Modal
        visible={showInstructions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInstructions(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#151515", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "70%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>Instrucciones</Text>
              <Pressable onPress={() => setShowInstructions(false)}>
                <Text style={{ color: "#C6FF00", fontSize: 16 }}>Cerrar</Text>
              </Pressable>
            </View>
            <ScrollView>
              <Text style={{ color: "#BDBDBD", fontSize: 15, lineHeight: 22 }}>
                {exerciseDescription || "No hay instrucciones disponibles para este ejercicio."}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom buttons */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: 16,
          backgroundColor: "rgba(14,14,14,0.95)",
          gap: 10,
        }}
      >
        {/* Timer after last series OR Skip exercise button */}
        {allSeriesCompleted && isResting ? (
          // Show timer when resting after last series
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "#1a2e1a",
                borderWidth: 2,
                borderColor: "#C6FF00",
                borderRadius: 9999,
                paddingVertical: 10,
                paddingHorizontal: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <Text style={{ color: "#C6FF00", fontSize: 14, fontWeight: "600" }}>DESCANSO</Text>
              <Text style={{ color: "#C6FF00", fontSize: 24, fontWeight: "800" }}>
                {formatTime(restTimeLeft)}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                if (timerRef.current) clearInterval(timerRef.current);
                setIsResting(false);
                setRestTimeLeft(0);
              }}
              style={{
                backgroundColor: "#333",
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderRadius: 9999,
              }}
            >
              <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>SALTAR</Text>
            </Pressable>
          </View>
        ) : !allSeriesCompleted ? (
          // Skip exercise button when not all series completed
          <Pressable
            onPress={() => {
              Alert.alert(
                "Saltar ejercicio",
                "¿Estás seguro de que quieres saltar este ejercicio?",
                [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Saltar", onPress: () => goToNextExercise(true) },
                ]
              );
            }}
            style={{
              backgroundColor: "transparent",
              borderWidth: 1,
              borderColor: "#444",
              paddingVertical: 12,
              borderRadius: 9999,
              alignItems: "center",
            }}
          >
            <Text style={{ fontWeight: "600", fontSize: 14, color: "#999" }}>
              SALTAR EJERCICIO →
            </Text>
          </Pressable>
        ) : null}
        
        {/* Main action button */}
        <Pressable
          onPress={() => goToNextExercise(false)}
          disabled={isResting}
          style={{
            backgroundColor: allSeriesCompleted && !isResting ? "#C6FF00" : "#333",
            paddingVertical: 14,
            borderRadius: 9999,
            alignItems: "center",
            opacity: isResting ? 0.5 : 1,
          }}
        >
          <Text style={{ fontWeight: "700", fontSize: 15, color: allSeriesCompleted && !isResting ? "#0E0E0E" : "#666" }}>
            {isLastExercise ? "FINALIZAR ENTRENAMIENTO" : "SIGUIENTE EJERCICIO →"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
