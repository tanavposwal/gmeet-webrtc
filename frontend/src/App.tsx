import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { LandingPage } from "./page/LandingPage";
import { MeetingPage } from "./page/MeetingPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/meeting/:roomId" element={<MeetingPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
