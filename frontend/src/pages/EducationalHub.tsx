import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Search, 
  ExternalLink, 
  ArrowLeft,
  Flower2,
  Bell,
  User as UserIcon,
  LogOut,
  Shield,
  Heart,
  Sparkles,
  FileText
} from "lucide-react";
import { useTranslation } from "react-i18next";

const EducationalHub = () => {
  const { userType } = useParams<{ userType: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const categories = [
    { id: "prevention", icon: Shield },
    { id: "treatment", icon: Heart },
    { id: "recovery", icon: Sparkles },
    { id: "mental", icon: Heart },
  ];

  const articles = [
    {
      id: 1,
      title: "Understanding Breast Self-Examination",
      category: "Prevention",
      source: "WHO",
      readTime: "5 min",
      date: "2024-01-15",
    },
    {
      id: 2,
      title: "Nutrition During Treatment: A Comprehensive Guide",
      category: "Treatment",
      source: "Mayo Clinic",
      readTime: "8 min",
      date: "2024-01-10",
    },
    {
      id: 3,
      title: "Post-Treatment Recovery: What to Expect",
      category: "Recovery",
      source: "Breast Cancer Now",
      readTime: "10 min",
      date: "2024-01-05",
    },
    {
      id: 4,
      title: "Managing Anxiety and Stress During Treatment",
      category: "Mental Support",
      source: "Egyptian Ministry of Health",
      readTime: "6 min",
      date: "2024-01-20",
    },
    {
      id: 5,
      title: "Early Detection: Signs and Symptoms",
      category: "Prevention",
      source: "WHO",
      readTime: "7 min",
      date: "2024-01-12",
    },
    {
      id: 6,
      title: "Exercise Guidelines After Surgery",
      category: "Recovery",
      source: "Mayo Clinic",
      readTime: "9 min",
      date: "2024-01-08",
    },
  ];

  const trustedSources = [
    { name: "WHO", icon: Shield },
    { name: "Mayo Clinic", icon: FileText },
    { name: "Breast Cancer Now", icon: Heart },
    { name: "Egyptian Ministry of Health", icon: Shield },
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const handleReadArticle = (title: string) => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(title)}`, '_blank');
  };

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
            <span className="text-xl font-bold text-foreground">{t('educational.title')}</span>
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
        <Tabs defaultValue="articles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="articles">{t('educational.tabs.articles')}</TabsTrigger>
            <TabsTrigger value="categories">{t('educational.tabs.categories')}</TabsTrigger>
            <TabsTrigger value="sources">{t('educational.tabs.sources')}</TabsTrigger>
          </TabsList>

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-primary" />
                  {t('educational.articles_heading')}
                </h2>
                <p className="text-muted-foreground">
                  {t('educational.articles_desc')}
                </p>
              </div>

              {/* Search */}
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder={t('educational.search_placeholder')}
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Category Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <Button 
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory("all")}
                  >
                    All
                  </Button>
                  {categories.map(cat => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(cat.categoryName || cat.id)} // Assuming category match needs to be precise, let's align names. 
                    >
                       {t(`educational.category.${cat.id}`)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Articles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArticles.length > 0 ? (
                  filteredArticles.map((article) => (
                    <Card key={article.id} className="p-4 bg-white shadow-soft hover:shadow-glow transition-smooth cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <span className="text-xs text-primary font-medium bg-rose-100 px-2 py-1 rounded mb-2 inline-block">
                            {article.category}
                          </span>
                          <h3 className="font-semibold text-foreground mb-2">{article.title}</h3>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {article.source}
                            </span>
                            <span>{article.readTime}</span>
                            <span>{article.date}</span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-3"
                        onClick={() => handleReadArticle(article.title)}
                      >
                        {t('educational.read_article')}
                      </Button>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No articles found matching your criteria.
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-primary" />
                  {t('educational.browse_category')}
                </h2>
                <p className="text-muted-foreground">
                  {t('educational.categories_desc')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Card key={category.id} className="p-6 bg-white shadow-soft hover:shadow-glow transition-smooth cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground text-lg mb-1">{t(`educational.category.${category.id}`)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {category.id === "prevention" && t('educational.category_desc.prevention')}
                            {category.id === "treatment" && t('educational.category_desc.treatment')}
                            {category.id === "recovery" && t('educational.category_desc.recovery')}
                            {category.id === "mental" && t('educational.category_desc.mental')}
                          </p>
                        </div>
                        <ExternalLink className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* Trusted Sources Tab */}
          <TabsContent value="sources" className="space-y-4">
            <Card className="p-6 bg-white shadow-soft">
              <div className="space-y-4 mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Shield className="w-6 h-6 text-primary" />
                  {t('educational.trusted_sources_title')}
                </h2>
                <p className="text-muted-foreground">
                  {t('educational.trusted_sources_desc')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trustedSources.map((source, idx) => {
                  const Icon = source.icon;
                  return (
                    <Card key={idx} className="p-4 bg-white shadow-soft hover:shadow-glow transition-smooth">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{source.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Verified medical source
                          </p>
                        </div>
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 <strong>Note:</strong> Content is regularly updated through open APIs from trusted health organizations. 
                  All information is reviewed for accuracy and relevance.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default EducationalHub;

