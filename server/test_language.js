
const detectLanguage = (text) => {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text) ? "ar" : "en";
};

const generateSystemPrompt = (language) => {
  return language === "ar" 
    ? "LANGUAGE REQUIREMENT: Always respond in Arabic (العربية)."
    : "LANGUAGE REQUIREMENT: Always respond in English.";
};

const testCases = [
  "Hello, how are you?",
  "مرحبا، كيف حالك؟",
  "I need help",
  "أحتاج مساعدة"
];

console.log("Testing Language Detection and Prompt Generation:");
testCases.forEach(text => {
  const lang = detectLanguage(text);
  const prompt = generateSystemPrompt(lang);
  console.log(`Text: "${text}" -> Detected: ${lang} -> Prompt: ${prompt}`);
});
