import { Routes, Route } from "react-router-dom";
import { Landing } from "./components/Landing";
import { SetupModal } from "./components/SetupModal";
import { Screen as Interview } from "./index";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/setup" element={<SetupModal />} />
      <Route path="/interview" element={<Interview />} />
    </Routes>
  );
}

export default App;
