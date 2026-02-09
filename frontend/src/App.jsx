import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { OnboardingProvider } from "./context/OnboardingContext";
import SignIn from "./screens/SignIn";
import AuthCallback from "./screens/AuthCallback";
import ConnectDatabases from "./screens/ConnectDatabases";
import SelectSchemas from "./screens/SelectSchemas";
import ConfigureExtraction from "./screens/ConfigureExtraction";
import GeneratingPrompts from "./screens/GeneratingPrompts";
import SetupComplete from "./screens/SetupComplete";

export default function App() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/connect" element={<ConnectDatabases />} />
          <Route path="/select-schemas" element={<SelectSchemas />} />
          <Route path="/configure" element={<ConfigureExtraction />} />
          <Route path="/generating" element={<GeneratingPrompts />} />
          <Route path="/complete" element={<SetupComplete />} />
        </Routes>
      </OnboardingProvider>
    </AuthProvider>
  );
}
