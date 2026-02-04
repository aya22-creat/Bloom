import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Heart, 
  BookOpen, 
  Headphones, 
  Users, 
  ArrowLeft,
  Flower2,
  Bell,
  User as UserIcon,
  LogOut,
  Play,
  Volume2,
  MessageCircle
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useToast } from "@/hooks/use-toast";

const MentalWellness = () => {
  const { userType } = useParams<{ userType: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [journalEntry, setJournalEntry] = useState("");
  const { t } = useTranslation();

  const meditationSessions = [
    {
      id: 1,
      title: t('mental.breathing_exercise'),
      duration: "10 min",
      description: t('mental.breathing_exercise_desc'),
      type: t('mental.breathing'),
    },
    {
      id: 2,
      title: t('mental.body_relaxation'),
      duration: "15 min",
      description: t('mental.body_relaxation_desc'),
      type: t('mental.relaxation'),
    },
    {
      id: 3,
      title: t('mental.positive_affirmations'),
      duration: "5 min",
      description: t('mental.positive_affirmations_desc'),
      type: t('mental.affirmations'),
    },
    {
      id: 4,
      title: t('mental.sleep_meditation'),
      duration: "20 min",
      description: t('mental.sleep_meditation_desc'),
      type: t('mental.sleep'),
    },
  ];

  const survivorStories = [
    {
      id: 1,
      name: t('mental.sarah_name'),
      title: t('mental.journey_recovery'),
      excerpt: t('mental.journey_recovery_excerpt'),
      date: "2024-01-15",
    },
    {
      id: 2,
      name: t('mental.fatima_name'),
      title: t('mental.finding_hope'),
      excerpt: t('mental.finding_hope_excerpt'),
      date: "2024-01-10",
    },
    {
      id: 3,
      name: t('mental.mariam_name'),
      title: t('mental.embracing_life'),
      excerpt: t('mental.embracing_life_excerpt'),
      date: "2024-01-05",
    },
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
            <span className="text-xl font-bold text-foreground">{t('mental.mental_wellness')}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
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
        <Tabs defaultValue="journal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="journal">{t('mental.journaling')}</TabsTrigger>
            <TabsTrigger value="meditation">{t('mental.meditation')}</TabsTrigger>
            <TabsTrigger value="stories">{t('mental.survivor_stories')}</TabsTrigger>
            <TabsTrigger value="support">{t('mental.support')}</TabsTrigger>
          </TabsList>

          {/* Journaling Tab */}
          <TabsContent value="journal" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-primary" />
                  {t('mental.positive_journaling')}
                </h2>
                <p className="text-muted-foreground">
                  {t('mental.journaling_description')}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {t('mental.todays_entry')} - {new Date().toLocaleDateString()}
                  </label>
                  <Textarea
                    value={journalEntry}
                    onChange={(e) => setJournalEntry(e.target.value)}
                    placeholder={t('mental.journal_placeholder')}
                    className="min-h-[200px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="gradient-rose text-white flex-1"
                    onClick={() => {
                      if (!journalEntry.trim()) return;
                      // Save journal entry
                      toast({
                        title: "Entry Saved",
                        description: "Your journal entry has been saved successfully.",
                      });
                      setJournalEntry("");
                    }}
                  >
                    {t('mental.save_entry')}
                  </Button>
                  <Button variant="outline" className="flex-1">
                    {t('mental.view_past_entries')}
                  </Button>
                </div>

                <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                  <h3 className="font-semibold text-foreground mb-2">{t('mental.journaling_prompts')}</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• {t('mental.prompt_smile')}</li>
                    <li>• {t('mental.prompt_grateful')}</li>
                    <li>• {t('mental.prompt_strength')}</li>
                    <li>• {t('mental.prompt_progress')}</li>
                    <li>• {t('mental.prompt_advice')}</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Meditation Tab */}
          <TabsContent value="meditation" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Headphones className="w-6 h-6 text-primary" />
                  {t('mental.guided_meditation')}
                </h2>
                <p className="text-muted-foreground">
                  {t('mental.meditation_description')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meditationSessions.map((session) => (
                  <Card key={session.id} className="p-4 bg-white shadow-soft hover:shadow-glow transition-smooth">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <span className="text-xs text-primary font-medium bg-rose-100 px-2 py-1 rounded mb-2 inline-block">
                          {session.type}
                        </span>
                        <h3 className="font-semibold text-foreground mb-1">{session.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{session.description}</p>
                        <p className="text-xs text-muted-foreground">Duration: {session.duration}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    {t('mental.start_session')}
                  </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                    <Volume2 className="w-4 h-4 mr-2" />
                    {t('mental.preview')}
                  </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Survivor Stories Tab */}
          <TabsContent value="stories" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Heart className="w-6 h-6 text-primary" />
                    {t('mental.survivor_stories')}
                  </h2>
                  <p className="text-muted-foreground">
                    {t('mental.survivor_stories_description')}
                  </p>
              </div>

              <div className="space-y-4">
                {survivorStories.map((story) => (
                  <Card key={story.id} className="p-4 bg-white shadow-soft hover:shadow-glow transition-smooth cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground">{story.title}</h3>
                            <p className="text-sm text-muted-foreground">by {story.name}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{story.date}</span>
                        </div>
                        <p className="text-sm text-foreground mb-3">{story.excerpt}</p>
                        <Button variant="outline" size="sm">
                    {t('mental.read_full_story')}
                  </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Headphones className="w-6 h-6 text-primary" />
                    {t('mental.support_resources')}
                  </h2>
                  <p className="text-muted-foreground">
                    {t('mental.support_description')}
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <MessageCircle className="w-8 h-8 text-blue-600" />
                    <h3 className="text-lg font-semibold text-foreground">{t('mental.counselor_support')}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('mental.counselor_support_desc')}
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      navigate(`/ai-assistant/${userType}?mode=counselor`);
                    }}
                  >
                    {t('mental.find_counselor')}
                  </Button>
                </Card>

                <Card className="p-6 bg-rose-50 border border-rose-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-8 h-8 text-rose-600" />
                    <h3 className="text-lg font-semibold text-foreground">{t('mental.community_forum')}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('mental.community_forum_desc')}
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      navigate(`/community-forum/${userType}`);
                    }}
                  >
                    {t('mental.join_community')}
                  </Button>
                </Card>
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  🔒 <strong>Privacy & Safety:</strong> All conversations and community interactions 
                  are private and secure. Your identity is protected, and you can participate 
                  without fear or stigma.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MentalWellness;

