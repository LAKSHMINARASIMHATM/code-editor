import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import FluxIDE from "@/components/FluxIDE";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FluxIDE />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
