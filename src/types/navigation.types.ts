/**
 * Navigation Types
 * Tipos para la estructura de navegación dinámica
 */

export interface NavigationSection {
    id: number;
    name: string;
    code: string;
    icon: string | null;
    route: string | null;
    order: number;
}

export interface NavigationMenuItem {
    id: number;
    name: string;
    code: string;
    icon: string | null;
    route: string | null;
    order: number;
    children: NavigationMenuItem[];
    sections: NavigationSection[];
}

export interface NavigationUser {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    numero_contacto: string | null;
    rol: number;
    nombre_completo: string | null;
    created_at: string;
}

export interface NavigationResponse {
    user: NavigationUser;
    navigation: NavigationMenuItem[];
}
