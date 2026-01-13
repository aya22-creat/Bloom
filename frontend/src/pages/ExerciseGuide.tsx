import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { 
  Activity, 
  Play, 
  AlertTriangle, 
  ArrowLeft,
  Flower2,
  Bell,
  User as UserIcon,
  LogOut,
  CheckCircle2,
  Video
} from "lucide-react";
import { useState } from "react";

const ExerciseGuide = () => {
  const { userType } = useParams<{ userType: string }>();
  const navigate = useNavigate();
  const [painLevel, setPainLevel] = useState([3]);
  const [energyLevel, setEnergyLevel] = useState([7]);

  const exercises = [
    {
      id: 1,
      name: "Shoulder Blade Squeezes",
      description: "Gently squeeze your shoulder blades together and hold",
      duration: "10 reps",
      difficulty: "Easy",
      video: true,
    },
    {
      id: 2,
      name: "Arm Raises",
      description: "Slowly raise your arms to shoulder height",
      duration: "8 reps",
      difficulty: "Easy",
      video: true,
    },
    {
      id: 3,
      name: "Wall Push-ups",
      description: "Stand facing a wall and perform gentle push-ups",
      duration: "5 reps",
      difficulty: "Moderate",
      video: true,
    },
    {
      id: 4,
      name: "Pendulum Swings",
      description: "Lean forward and let your arm swing gently",
      duration: "10 swings each",
      difficulty: "Easy",
      video: true,
    },
    {
      id: 5,
      name: "Chest Stretch",
      description: "Place your arm against a wall and gently turn your body",
      duration: "Hold 30 sec",
      difficulty: "Easy",
      video: true,
    },
  ];

  const prohibitedMovements = [
    "Heavy lifting above shoulder height",
    "Sudden jerking motions",
    "Overhead exercises without clearance",
    "High-impact activities",
  ];

  return (
    <div className="min-h-screen gradient-blush">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/dashboard/${userType}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Flower2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Exercise Guide</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <UserIcon className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="exercises" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="exercises">Exercises</TabsTrigger>
            <TabsTrigger value="assessment">Fitness Assessment</TabsTrigger>
            <TabsTrigger value="warnings">Safety Guidelines</TabsTrigger>
          </TabsList>

          {/* Exercises Tab */}
          <TabsContent value="exercises" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Activity className="w-6 h-6 text-primary" />
                  Physical Therapy Exercises
                </h2>
                <p className="text-muted-foreground">
                  {userType === "fighter" || userType === "survivor"
                    ? "Approved exercises for post-surgery recovery and treatment support. Always consult your healthcare provider before starting."
                    : "General exercises to maintain breast health and overall wellness."}
                </p>
              </div>

              <div className="space-y-4">
                {exercises.map((exercise) => (
                  <Card key={exercise.id} className="p-4 bg-white shadow-soft hover:shadow-glow transition-smooth">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">{exercise.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded ${
                            exercise.difficulty === "Easy" 
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {exercise.difficulty}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{exercise.description}</p>
                        <p className="text-xs text-muted-foreground">Duration: {exercise.duration}</p>
                      </div>
                      {exercise.video && (
                        <Button variant="outline" size="icon">
                          <Video className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Play className="w-4 h-4 mr-2" />
                        Watch Video
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Start Exercise
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Fitness Assessment Tab */}
          <TabsContent value="assessment" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                  Fitness & Pain Level Assessment
                </h2>
                <p className="text-muted-foreground">
                  Assess your current fitness level and pain levels to personalize your exercise plan.
                </p>
              </div>

              <div className="space-y-6">
                <Card className="p-4 bg-blue-50 border border-blue-200">
                  <h3 className="font-semibold text-foreground mb-4">Pain Level (1-10)</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Level</span>
                      <span className="text-lg font-bold text-foreground">3/10</span>
                    </div>
                    <Progress value={30} className="h-3" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Lower is better. If pain increases during exercise, stop immediately.
                  </p>
                </Card>

                <Card className="p-4 bg-green-50 border border-green-200">
                  <h3 className="font-semibold text-foreground mb-4">Range of Motion</h3>
                  <div className="space-y-3">
                    {["Left Arm", "Right Arm", "Shoulder Flexibility"].map((item) => (
                      <div key={item} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{item}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Good</Button>
                          <Button variant="outline" size="sm">Limited</Button>
                          <Button variant="outline" size="sm">Restricted</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4 bg-amber-50 border border-amber-200">
                  <h3 className="font-semibold text-foreground mb-4">Energy Level</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Today's Energy</span>
                      <span className="text-lg font-bold text-foreground">7/10</span>
                    </div>
                    <Progress value={70} className="h-3" />
                  </div>
                </Card>

                <Button className="gradient-rose text-white w-full">
                  Save Assessment
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Safety Guidelines Tab */}
          <TabsContent value="warnings" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-primary" />
                  Safety Guidelines & Prohibited Movements
                </h2>
                <p className="text-muted-foreground">
                  Important safety information based on your individual needs and treatment stage.
                </p>
              </div>

              <div className="space-y-4">
                <Card className="p-4 bg-red-50 border border-red-200">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Movements to Avoid
                  </h3>
                  <ul className="space-y-2">
                    {prohibitedMovements.map((movement, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-red-600 mt-1">•</span>
                        <span>{movement}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-4 bg-blue-50 border border-blue-200">
                  <h3 className="font-semibold text-foreground mb-3">General Safety Tips</h3>
                  <ul className="space-y-2 text-sm text-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Always warm up before exercising</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Stop immediately if you feel pain or discomfort</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Start slowly and gradually increase intensity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Consult your healthcare provider before starting any new exercise</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Listen to your body and rest when needed</span>
                    </li>
                  </ul>
                </Card>

                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    ⚠️ <strong>Important:</strong> These exercises are approved by medical organizations, 
                    but individual needs vary. Always follow your healthcare provider's specific recommendations.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ExerciseGuide;

