import { Routes, Route } from "react-router-dom";
import { Landing } from "./components/Landing";
import { SetupModal } from "./components/SetupModal";
import { Screen as Interview } from "./index";
import { EvaluationModal } from "./components/EvaluationModal";
import { InterviewContext } from "./core/state";
import "./App.css";

function App() {
  return (
    <InterviewContext.Provider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/setup" element={<SetupModal />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/evaluation" element={<EvaluationModal />} />
      </Routes>
    </InterviewContext.Provider>
  );
}

export default App;
