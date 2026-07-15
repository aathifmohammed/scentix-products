import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Showcase } from './pages/Showcase';
import { Admin } from './pages/Admin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Showcase />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
