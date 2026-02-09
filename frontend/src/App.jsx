import { Routes, Route } from "react-router-dom";
import SignIn from "./screens/SignIn";
import ConnectDatabases from "./screens/ConnectDatabases";
import SelectSchemas from "./screens/SelectSchemas";
import ConfigureExtraction from "./screens/ConfigureExtraction";
import GeneratingPrompts from "./screens/GeneratingPrompts";
import SetupComplete from "./screens/SetupComplete";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SignIn />} />
      <Route path="/connect" element={<ConnectDatabases />} />
      <Route path="/select-schemas" element={<SelectSchemas />} />
      <Route path="/configure" element={<ConfigureExtraction />} />
      <Route path="/generating" element={<GeneratingPrompts />} />
      <Route path="/complete" element={<SetupComplete />} />
    </Routes>
  );
}
