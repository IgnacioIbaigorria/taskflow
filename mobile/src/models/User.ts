export interface User {
    id: string;
    email: string;
    name: string;
    created_at: string;
}

export interface AuthResponse {
    user: User;
    token: string;
    refresh_token: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
}
