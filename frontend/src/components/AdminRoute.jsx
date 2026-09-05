import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
    const role =
        localStorage.getItem("userRole");

    if (role !== "ADMIN") {
        return (
            <Navigate
                to="/projects"
                replace
            />
        );
    }

    return children;
}

export default AdminRoute;