import { createContext, useContext, useState } from "react";

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
  const [integration, setIntegration] = useState("notion");
  const [selectedSources, setSelectedSources] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [configResult, setConfigResult] = useState(null);

  const reset = () => {
    setIntegration("notion");
    setSelectedSources([]);
    setQuestions([]);
    setAnswers({});
    setConfigResult(null);
  };

  return (
    <OnboardingContext.Provider
      value={{
        integration,
        setIntegration,
        selectedSources,
        setSelectedSources,
        questions,
        setQuestions,
        answers,
        setAnswers,
        configResult,
        setConfigResult,
        reset,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
