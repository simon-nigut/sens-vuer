import { Routes, Route } from "react-router-dom";
import Viewer from "./pages/Viewer";
import Demo from "./pages/Demo";
import LoginPage from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./lib/authContext";

function App() {
  return (
    <AuthProvider>
      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-0 h-screen w-screen">
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Viewer />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/about" element={<h1>About Page</h1>} />
          <Route path="/demo" element={<Demo />} />
        </Routes>
      </main>
    </AuthProvider>
  );
}

export default App;
