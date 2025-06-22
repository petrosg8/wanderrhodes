import { HashRouter as Router, Routes, Route } from "react-router-dom";
import HomePage       from './pages/HomePage';
import FeaturesPage   from './pages/FeaturesPage';
import ChatRegionPage from './pages/ChatPage';
import PaywallPage    from './pages/PaywallPage';
import TravelPlansPage from './pages/TravelPlansPage';
import TravelPlanViewPage from './pages/TravelPlanViewPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"         element={<HomePage />}       />
        <Route path="/features" element={<FeaturesPage />}   />
        <Route path="/chat"     element={<ChatRegionPage />} />
        <Route path="/paywall"  element={<PaywallPage />}    />
        <Route path="/plans"    element={<TravelPlansPage />} />
        <Route path="/plans/:id" element={<TravelPlanViewPage />} />
      </Routes>
    </Router>
  );
}

export default App;
