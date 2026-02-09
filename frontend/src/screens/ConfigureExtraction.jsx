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
  const [expandedSource, setExpandedSource] = useState(null);
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
        for (const source of selectedSources) {
          const sourceId = source.id || source.source_id;
          const data = await generateQuestions(integration, sourceId, accessToken);
          results[sourceId] = {
            tag: data.tag || source.title || source.name,
            questions: (data.questions || []).map((q, i) => ({
              ...q,
              id: q.id || `q${i}`,
              type: mapQuestionType(q.question_type),
              options: q.options
                ? q.options.map((opt, j) => ({
                    value: typeof opt === "string" ? opt : opt.value || `opt${j}`,
                    label: typeof opt === "string" ? opt : opt.label || opt,
                    description: typeof opt === "string" ? "" : opt.description || "",
                    selected: j === 0,
                  }))
                : undefined,
              value: q.default_suggestion != null ? String(q.default_suggestion) : "",
              placeholder: q.why_asking || "",
            })),
          };
        }
        setSourceQuestions(results);
        // Expand the first source by default
        const firstId = selectedSources[0]?.id || selectedSources[0]?.source_id;
        setExpandedSource(firstId);
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

  return (
    <PageLayout
      center
      step={2}
      title="Configure Data Extraction"
      description="Our agent has generated some questions to help define the extraction rules for your selected schema."
    >
      {loading ? (
        <div className="flex flex-col items-center py-8 gap-3">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full spinner" />
          <p className="text-sm text-slate-400">Generating questions…</p>
        </div>
      ) : error ? (
        <p className="text-sm text-red-500 text-center py-4">{error}</p>
      ) : (
        selectedSources.map((source) => {
          const sourceId = source.id || source.source_id;
          const data = sourceQuestions[sourceId];
          if (!data) return null;
          const isExpanded = expandedSource === sourceId;

          return (
            <div key={sourceId} className="mb-6">
              <SchemaCard
                as="button"
                icon={iconForSource(source)}
                title={data.tag}
                onClick={() =>
                  setExpandedSource(isExpanded ? null : sourceId)
                }
                action={
                  <Icon
                    name="expand_more"
                    filled={false}
                    className={`text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                  />
                }
              />

              <div
                className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="mt-6 space-y-8">
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
        })
      )}

      <NavFooter backTo="/select-schemas" nextTo="/generating" />
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
