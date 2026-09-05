import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import CreateProject from "./pages/CreateProject";
import Login from "./pages/Login";
import AdminRoute from "./components/AdminRoute";
import Register from "./pages/Register";
import CitizenDashboard from "./pages/CitizenDashboard";
import CitizenVerify from "./pages/CitizenVerify";
import Officers from "./pages/Officers";

import ProtectedRoute from "./components/ProtectedRoute";


function App() {

    return (
        <BrowserRouter>

            <Routes>

                {/* =========================
                    PUBLIC LOGIN
                ========================= */}

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />


                {/* =========================
                    PROTECTED DASHBOARD
                ========================= */}

                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    PROTECTED PROJECTS
                ========================= */}

                <Route
                    path="/projects"
                    element={
                        <ProtectedRoute>
                            <Projects />
                        </ProtectedRoute>
                    }
                />


                <Route
                    path="/projects/:projectId"
                    element={
                        <ProtectedRoute>
                            <ProjectDetails />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    PROTECTED CREATE PROJECT
                ========================= */}

                <Route
                    path="/projects/create"
                    element={
                         <ProtectedRoute>
                            <AdminRoute>
                                <CreateProject />
                            </AdminRoute>
                        </ProtectedRoute>
                    }
                />

            
                <Route
                    path="/citizen"
                    element={
                        <ProtectedRoute>
                            <CitizenDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/verify/:projectId"
                    element={<CitizenVerify />}
                />

                <Route
                    path="/officers"
                    element={<Officers />}
                />
                </Routes>


        </BrowserRouter>
    );
}

export default App;