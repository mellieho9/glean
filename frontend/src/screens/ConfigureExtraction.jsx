import { useState } from "react";
import PageLayout from "../components/PageLayout";
import NavFooter from "../components/NavFooter";
import Icon from "../components/Icon";
import SchemaCard from "../components/SchemaCard";
import SelectOptions from "../components/SelectOptions";
import CardOptions from "../components/CardOptions";
import TextInput from "../components/TextInput";
import { mockQuestions } from "../utils/mockData";

export default function ConfigureExtraction() {
  const [questions, setQuestions] = useState(mockQuestions);
  const [expanded, setExpanded] = useState(false);

  const selectOption = (questionId, optionValue) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((o) => ({
                ...o,
                selected: o.value === optionValue,
              })),
            }
          : q
      )
    );
  };

  const updateTextValue = (questionId, value) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, value } : q))
    );
  };

  return (
    <PageLayout
      center
      step={2}
      title="Configure Data Extraction"
      description="Our agent has generated some questions to help define the extraction rules for your selected schema."
    >
      {/* Target Schema Toggle */}
      <SchemaCard
        as="button"
        icon="restaurant_menu"
        title="Recipes"
        onClick={() => setExpanded(!expanded)}
        action={
          <Icon
            name="expand_more"
            filled={false}
            className={`text-slate-400 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          />
        }
      />

      {/* Questions (collapsible with animation) */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-6 space-y-8">
            {questions.map((q, qi) => (
              <div
                key={q.id}
                className={qi > 0 ? "pt-8 border-t border-slate-100" : undefined}
              >
                <p className="text-slate-900 font-semibold mb-4 text-sm">
                  {q.question}
                </p>

                {q.type === "text" ? (
                  <TextInput
                    value={q.value}
                    placeholder={q.placeholder}
                    onChange={(e) => updateTextValue(q.id, e.target.value)}
                  />
                ) : q.type === "select" ? (
                  <SelectOptions
                    question={q}
                    onSelect={(val) => selectOption(q.id, val)}
                  />
                ) : (
                  <CardOptions
                    question={q}
                    onSelect={(val) => selectOption(q.id, val)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <NavFooter backTo="/select-schemas" nextTo="/generating" />
    </PageLayout>
  );
}
