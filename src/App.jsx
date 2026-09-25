import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Footer from "./components/Footer";
import Loans from "./pages/Loans";
import About from "./pages/About";
import Help from "./pages/Help";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LoanApplication from "./pages/LoanApplication";
import AdminDashboard from "./pages/AdminDashboard";

import "./App.css";


// ==========================================
// USER PROTECTED ROUTE
// ==========================================

function ProtectedRoute({ children }) {

  const token =
    localStorage.getItem("token");

  const isAdmin =
    localStorage.getItem("isAdmin") === "true";


  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }



  return children;
}


// ==========================================
// ADMIN PROTECTED ROUTE
// ==========================================



// ==========================================
// APP CONTENT
// ==========================================

function AppContent() {

  const location =
    useLocation();


  const hideFooter =
    location.pathname === "/login" ||
    location.pathname === "/register";


  return (
    <>

      <Navbar />

      <Routes>

        {/* ================= HOME ================= */}

        <Route
          path="/"
          element={<Home />}
        />


        {/* ================= LOGIN ================= */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* ================= REGISTER ================= */}

        <Route
          path="/register"
          element={<Register />}
        />


        {/* ================= USER PAGES ================= */}

        <Route
          path="/loans"
          element={
            <ProtectedRoute>
              <Loans />
            </ProtectedRoute>
          }
        />


        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <About />
            </ProtectedRoute>
          }
        />


        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          }
        />


        <Route
          path="/contact"
          element={
            <ProtectedRoute>
              <Contact />
            </ProtectedRoute>
          }
        />


        {/* ================= LOAN APPLICATION ================= */}

        <Route
          path="/apply"
          element={
            <ProtectedRoute>
              <LoanApplication />
            </ProtectedRoute>
          }
        />


        {/* ================= ADMIN ================= */}

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        {/* ================= UNKNOWN URL ================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>


      {!hideFooter && <Footer />}

    </>
  );
}


// ==========================================
// APP
// ==========================================

function App() {

  return (

    <BrowserRouter>

      <AppContent />

    </BrowserRouter>

  );
}


export default App;