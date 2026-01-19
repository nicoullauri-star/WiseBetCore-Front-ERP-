# Dynamic Navigation Implementation

## Overview
Updated the Sidebar component to dynamically load navigation menu items from the API based on user authentication and role permissions.

## Changes Made

### 1. API Configuration (`config/api.config.ts`)
- Added `NAVIGATION: '/api/auth/navigation/'` endpoint to `API_ENDPOINTS`

### 2. Navigation Types (`types/navigation.types.ts`)
Created TypeScript interfaces for the navigation API response:
- `NavigationSection`: Represents sub-items within a menu group
- `NavigationMenuItem`: Represents a menu item with optional children and sections
- `NavigationUser`: User information from the API
- `NavigationResponse`: Complete API response structure

### 3. API Client (`services/api.client.ts`)
- Added import for `NavigationResponse` type
- Added `getNavigation()` method that fetches navigation data with bearer token authentication

### 4. Sidebar Component (`components/Sidebar.tsx`)
Major refactoring to support dynamic navigation:

#### State Management
- `navigationItems`: Stores menu items from API
- `user`: Stores user information from API
- `loading`: Loading state for API call
- `openGroups`: Tracks which menu groups are expanded

#### Features
- **Dynamic Menu Loading**: Fetches navigation on component mount
- **Auto-expand Active Groups**: Automatically opens menu groups containing the current route
- **User Profile Display**: Shows user information from API (username, email)
- **Hierarchical Menu Rendering**: Supports nested menu structure with:
  - Parent items with children
  - Children with sections (3-level hierarchy)
  - Simple menu items
- **Logout Handling**: Detects `auth_logout` code and clears localStorage
- **Loading State**: Shows "Cargando menú..." while fetching data

#### Menu Structure Support
The component now handles the API response structure:
```
Menu Item (e.g., "Operaciones")
  └─ Children (e.g., "Picks EV+")
      └─ Sections (e.g., "Análisis", "EQS Quality")
```

## API Response Format
The component expects this structure from `GET /api/auth/navigation/`:
```json
{
  "user": {
    "id": 2,
    "username": "admin",
    "email": "admin@gmail.com",
    "nombre_completo": "Full Name",
    ...
  },
  "navigation": [
    {
      "id": 1,
      "name": "Menu Name",
      "code": "menu_code",
      "icon": "material_icon_name",
      "route": "/route",
      "order": 10,
      "children": [...],
      "sections": [...]
    }
  ]
}
```

## How It Works
1. On component mount, calls `apiClient.getNavigation()` with bearer token
2. API returns user-specific navigation based on their role
3. Component renders menu items dynamically
4. Groups auto-expand if they contain the current route
5. Logout menu item (code: `auth_logout`) clears tokens and redirects to login

## Benefits
- **Role-Based Access**: Menu items are controlled by backend permissions
- **Centralized Management**: Navigation structure managed in database
- **Scalable**: Easy to add/remove menu items without frontend changes
- **Secure**: Navigation permissions enforced by backend
