import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TaskDetail from './pages/TaskDetail';
import Teams from './pages/Teams';
import Settings from './pages/Settings';
import TeamMembers from './pages/TeamMembers';
import Achievements from './pages/Achievements';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/team-members" element={<TeamMembers />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/tasks/:id" element={<TaskDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
