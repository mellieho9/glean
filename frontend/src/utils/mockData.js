export const mockUser = {
  name: "Mellie Ho",
  email: "mellie@example.com",
  avatar: null,
};

export const mockDatabases = [
  {
    id: "1",
    name: "Notion",
    description: "Sync video schemas to your Notion pages",
    icon: "description",
    connected: false,
  },
];

export const mockSchemas = [
  {
    id: "1",
    name: "Recipes",
    type: "Database",
    icon: "restaurant_menu",
    selected: true,
  },
  {
    id: "2",
    name: "Interesting Commentary",
    type: "Database",
    icon: "forum",
    selected: false,
  },
  {
    id: "3",
    name: "Places",
    type: "Database",
    icon: "location_on",
    selected: false,
  },
];

export const mockQuestions = [
  {
    id: "1",
    property: "Ingredients",
    question: "Do you want a list of just ingredients or ingredients & volume?",
    type: "select",
    options: [
      {
        value: "volume",
        label: "Ingredients & Volume",
        description: 'e.g., "250g Flour", "2 tbsp Olive Oil"',
        selected: true,
      },
      {
        value: "just-ingredients",
        label: "Just Ingredients",
        description: 'e.g., "Flour", "Olive Oil"',
        selected: false,
      },
    ],
  },
  {
    id: "2",
    property: "Instructions",
    question:
      "Should instructions be broken down by step or as a single block of text?",
    type: "card-select",
    options: [
      {
        value: "numbered",
        label: "Numbered Steps",
        icon: "format_list_numbered",
        selected: true,
      },
      {
        value: "block",
        label: "Single Block",
        icon: "notes",
        selected: false,
      },
    ],
  },
  {
    id: "3",
    property: "Source",
    question: "What is the source URL or name for these recipes?",
    type: "text",
    value: "",
    placeholder: "e.g., https://recipes.com or Grandma's Cookbook",
  },
];

export const mockLoadingSteps = [
  { label: "Connection established", done: true },
  { label: "Captured capture preferences", done: true },
  { label: "Freezing prompt logic", done: false, active: true },
];
