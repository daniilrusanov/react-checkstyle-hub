/**
 * Application Entry Point
 * 
 * This is the main entry file for the React application.
 * It initializes the React root and renders the main App part.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import './index.css'

// Create React root and render the application in StrictMode
// StrictMode helps identify potential problems in the application during development
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ThemeProvider>
            <AuthProvider>
                <App />
            </AuthProvider>
        </ThemeProvider>
    </React.StrictMode>,
)
