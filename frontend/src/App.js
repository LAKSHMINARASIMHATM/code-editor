import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import FluxIDE from "./components/FluxIDE";
import { LandingPage } from "./components/LandingPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/ide" element={<FluxIDE />} />
        <Route path="/editor/:projectId" element={<FluxIDE />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
