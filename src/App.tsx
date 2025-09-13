import { Routes, Route } from "react-router-dom";
import Viewer from "./pages/Viewer";
import Demo from "./pages/Demo";
import Toolbox from "./components/Toolbox";

function App() {
  return (
    <div className="flex flex-col h-screen w-screen">
      {/* Navbar */}
      <div className="p-4 bg-gray-100 flex justify-between">
        <span>Sens-Vuer</span>
        <Toolbox />
        <div></div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-0">
        <Routes>
          <Route path="/" element={<Viewer />} />
          <Route path="/about" element={<h1>About Page</h1>} />
          <Route path="/demo" element={<Demo />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
