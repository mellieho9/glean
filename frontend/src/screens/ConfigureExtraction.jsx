import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useOnboarding } from "../context/OnboardingContext";
import { generateQuestions } from "../utils/api";
import PageLayout from "../components/PageLayout";
import NavFooter from "../components/NavFooter";
import Icon from "../components/Icon";
import SchemaCard from "../components/SchemaCard";
import SelectOptions from "../components/SelectOptions";
import CardOptions from "../components/CardOptions";
import TextInput from "../components/TextInput";

export default function ConfigureExtraction() {
  const { accessToken } = useAuth();
  const { integration, selectedSources, setAnswers } = useOnboarding();
  const [sourceQuestions, setSourceQuestions] = useState({});
  const [userAnswers, setUserAnswers] = useState({});
  const [expandedSources, setExpandedSources] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch questions for each selected source
  useEffect(() => {
    if (!accessToken || selectedSources.length === 0) {
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = {};
        const defaults = {};
        for (const source of selectedSources) {
          const sourceId = source.id || source.source_id;
          const data = await generateQuestions(integration, sourceId, accessToken);
          const questions = (data.questions || []).map((q, i) => {
            const id = q.id || `q${i}`;
            const type = mapQuestionType(q.question_type);
            const options = q.options
              ? q.options.map((opt, j) => ({
                  value: typeof opt === "string" ? opt : opt.value || `opt${j}`,
                  label: typeof opt === "string" ? opt : opt.label || opt,
                  description: typeof opt === "string" ? "" : opt.description || "",
                  selected: j === 0,
                }))
              : undefined;

            // Pre-populate default answer
            if (options) {
              defaults[`${sourceId}:${id}`] = options[0].value;
            } else if (q.default_suggestion != null) {
              defaults[`${sourceId}:${id}`] = String(q.default_suggestion);
            }

            return {
              ...q,
              id,
              type,
              options,
              value: q.default_suggestion != null ? String(q.default_suggestion) : "",
              placeholder: q.why_asking || "",
            };
          });
          results[sourceId] = {
            tag: data.tag || source.title || source.name,
            questions,
          };
        }
        setSourceQuestions(results);
        setUserAnswers(defaults);
        // Expand all sources by default
        setExpandedSources(
          new Set(selectedSources.map((s) => s.id || s.source_id))
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [accessToken, integration, selectedSources]);

  // Sync answers to context whenever they change
  useEffect(() => {
    setAnswers(userAnswers);
  }, [userAnswers, setAnswers]);

  const toggleSource = (sourceId) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(sourceId)) next.delete(sourceId);
      else next.add(sourceId);
      return next;
    });
  };

  const selectOption = (sourceId, questionId, optionValue) => {
    setSourceQuestions((prev) => ({
      ...prev,
      [sourceId]: {
        ...prev[sourceId],
        questions: prev[sourceId].questions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                options: q.options?.map((o) => ({
                  ...o,
                  selected: o.value === optionValue,
                })),
              }
            : q
        ),
      },
    }));
    setUserAnswers((prev) => ({
      ...prev,
      [`${sourceId}:${questionId}`]: optionValue,
    }));
  };

  const updateTextValue = (sourceId, questionId, value) => {
    setSourceQuestions((prev) => ({
      ...prev,
      [sourceId]: {
        ...prev[sourceId],
        questions: prev[sourceId].questions.map((q) =>
          q.id === questionId ? { ...q, value } : q
        ),
      },
    }));
    setUserAnswers((prev) => ({
      ...prev,
      [`${sourceId}:${questionId}`]: value,
    }));
  };

  const iconForSource = (source) => {
    const name = (source.title || source.name || "").toLowerCase();
    if (name.includes("recipe")) return "restaurant_menu";
    if (name.includes("comment")) return "forum";
    if (name.includes("place")) return "location_on";
    return "database";
  };

  // Per-source answer progress
  const getSourceProgress = (sourceId) => {
    const data = sourceQuestions[sourceId];
    if (!data) return { answered: 0, total: 0 };
    const total = data.questions.length;
    const answered = data.questions.filter((q) => {
      const key = `${sourceId}:${q.id}`;
      const val = userAnswers[key];
      return val !== undefined && val !== "";
    }).length;
    return { answered, total };
  };

  // Check if all schemas have all questions answered
  const allAnswered = selectedSources.every((source) => {
    const sourceId = source.id || source.source_id;
    const { answered, total } = getSourceProgress(sourceId);
    return total > 0 && answered === total;
  });

  const totalSources = Object.keys(sourceQuestions).length;
  const plural = selectedSources.length !== 1;

  return (
    <PageLayout
      center
      step={2}
      title="Configure Data Extraction"
    >
      {loading ? (
        <div className="flex flex-col items-center py-8 gap-3">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full spinner" />
          <p className="text-sm text-slate-400">Generating questions…</p>
        </div>
      ) : error ? (
        <p className="text-sm text-red-500 text-center py-4">{error}</p>
      ) : (
        <>
          {totalSources > 1 && (
            <p className="text-xs text-slate-400 mb-4 text-center">
              {totalSources} schema{totalSources !== 1 ? "s" : ""} to configure
            </p>
          )}

          {selectedSources.map((source) => {
            const sourceId = source.id || source.source_id;
            const data = sourceQuestions[sourceId];
            if (!data) return null;
            const isExpanded = expandedSources.has(sourceId);
            const { answered, total } = getSourceProgress(sourceId);
            const isComplete = total > 0 && answered === total;

            return (
              <div key={sourceId} className="mb-6">
                <SchemaCard
                  as="button"
                  icon={iconForSource(source)}
                  title={data.tag}
                  subtitle={`${answered}/${total} answered`}
                  onClick={() => toggleSource(sourceId)}
                  action={
                    <div className="flex items-center gap-2">
                      {isComplete && (
                        <Icon name="check_circle" className="text-emerald-500 text-lg" />
                      )}
                      <Icon
                        name="expand_more"
                        filled={false}
                        className={`text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  }
                />

                <div
                  className="grid rounded-b  transition-[grid-template-rows] duration-300 ease-in-out"
                  style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
                >
                  <div className="bg-slate-50/50 overflow-hidden">
                    <div className="p-5 mt-6 space-y-8">
                      {data.questions.map((q, qi) => (
                        <div
                          key={q.id}
                          className={
                            qi > 0
                              ? "pt-8 border-t border-slate-100"
                              : undefined
                          }
                        >
                          <p className="text-slate-900 font-semibold mb-4 text-sm">
                            {q.question}
                          </p>

                          {q.type === "text" ? (
                            <TextInput
                              value={q.value}
                              placeholder={q.placeholder}
                              onChange={(e) =>
                                updateTextValue(sourceId, q.id, e.target.value)
                              }
                            />
                          ) : q.type === "select" && q.options ? (
                            <SelectOptions
                              question={q}
                              onSelect={(val) =>
                                selectOption(sourceId, q.id, val)
                              }
                            />
                          ) : q.options ? (
                            <CardOptions
                              question={q}
                              onSelect={(val) =>
                                selectOption(sourceId, q.id, val)
                              }
                            />
                          ) : (
                            <TextInput
                              value={q.value}
                              placeholder={q.placeholder}
                              onChange={(e) =>
                                updateTextValue(sourceId, q.id, e.target.value)
                              }
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      <NavFooter
        backTo="/select-schemas"
        nextTo="/generating"
        nextDisabled={!allAnswered || loading}
      />
    </PageLayout>
  );
}

function mapQuestionType(apiType) {
  switch (apiType) {
    case "select":
    case "boolean":
      return "select";
    case "multiselect":
      return "card-select";
    case "text":
    default:
      return "text";
  }
}
