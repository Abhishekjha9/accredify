import axios from 'axios';

// Create an Axios instance
// Note: Vite proxy forwards /api to http://localhost:5000 in dev
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to attach JWT token and fix Content-Type for FormData
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // When sending FormData (e.g. file upload), let the browser set Content-Type
        // with the correct multipart boundary. Otherwise the server won't see the file.
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle common errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear token if it's invalid or expired
            localStorage.removeItem('token');
            // Potential redirect to login can be handled by the App/Auth context
        }
        return Promise.reject(error);
    }
);

// ------------- Auth API endpoints -------------
export const authAPI = {
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },
    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
};

// ------------- Project API endpoints -------------
export const projectAPI = {
    createProject: async (projectData) => {
        const response = await api.post('/projects', projectData);
        return response.data;
    },
    getProjectById: async (id) => {
        const response = await api.get(`/projects/${id}`);
        return response.data;
    },
    approveProject: async (id) => {
        const response = await api.patch(`/projects/${id}/approve`);
        return response.data;
    },
    addChangeRequest: async (id, changeRequestData) => {
        const response = await api.post(`/projects/${id}/change-requests`, changeRequestData);
        return response.data;
    },
    classifyChangeRequest: async (projectId, changeRequestId, data) => {
        const response = await api.patch(`/projects/${projectId}/change-requests/${changeRequestId}/classify`, data);
        return response.data;
    },
    incrementRevision: async (id) => {
        const response = await api.patch(`/projects/${id}/revisions`);
        return response.data;
    },
    // We'll need a route to fetch all projects for dashboard - adding a generic mock for now
    // Note: Backend might need an endpoint like `GET /api/projects` to fetch user's projects.
    // We will request backend to add it if it doesn't exist.
    getUserProjects: async () => {
        const response = await api.get('/projects');
        return response.data;
    },
    addDeliverable: async (projectId, payload) => {
        const response = await api.post(`/projects/${projectId}/deliverables`, payload);
        return response.data;
    },
    acceptDeliverable: async (projectId, deliverableId) => {
        const response = await api.patch(`/projects/${projectId}/deliverables/${deliverableId}/accept`);
        return response.data;
    },
    requestDeliverableRevision: async (projectId, deliverableId, feedback) => {
        const response = await api.patch(`/projects/${projectId}/deliverables/${deliverableId}/request-revision`, { feedback });
        return response.data;
    },
};

export default api;
