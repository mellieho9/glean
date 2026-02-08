import { useState } from "react";
import PageLayout from "../components/PageLayout";
import NavFooter from "../components/NavFooter";
import SchemaCard from "../components/SchemaCard";
import { mockSchemas } from "../utils/mockData";

export default function SelectSchemas() {
  const [schemas, setSchemas] = useState(mockSchemas);

  const toggleSchema = (id) => {
    setSchemas((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const selectedCount = schemas.filter((s) => s.selected).length;

  return (
    <PageLayout
      center
      step={1}
      title="Select Schemas"
      description="Choose the databases you want to access from your workspace."
    >
      <div className="space-y-4">
        {schemas.map((schema) => (
          <SchemaCard
            key={schema.id}
            as="label"
            icon={schema.icon}
            title={schema.name}
            subtitle={schema.type}
            action={
              <input
                type="checkbox"
                checked={schema.selected}
                onChange={() => toggleSchema(schema.id)}
                className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary"
              />
            }
          />
        ))}
      </div>

      <NavFooter backTo="/connect" nextTo="/configure" nextDisabled={selectedCount === 0} />
    </PageLayout>
  );
}
