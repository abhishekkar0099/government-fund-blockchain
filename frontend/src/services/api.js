import axios from "axios";

const API = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api"
});


// ==========================================
// ATTACH JWT TOKEN TO EVERY REQUEST
// ==========================================

API.interceptors.request.use(
    (config) => {

        const token =
            localStorage.getItem("token");

        if (token) {

            config.headers.Authorization =
                `Bearer ${token}`;

        }

        return config;

    },
    (error) => {
        return Promise.reject(error);
    }
);


// ==========================================
// HANDLE AUTHENTICATION ERRORS
// ==========================================

API.interceptors.response.use(

    (response) => {
        return response;
    },

    (error) => {

        if (
            error.response &&
            error.response.status === 401
        ) {

            localStorage.removeItem("token");
            localStorage.removeItem("userRole");
            localStorage.removeItem("username");
            localStorage.removeItem("isLoggedIn");

            // Don't redirect if already on login
            if (
                window.location.pathname !==
                "/login"
            ) {

                window.location.href =
                    "/login";

            }

        }

        return Promise.reject(error);

    }
);


export default API;