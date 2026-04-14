// Main entry point for the React application

import { Auth0Provider } from "@auth0/auth0-react";
import { createRoot } from 'react-dom/client';
import "./i18n/config.ts";
import './index.css';
import App from './App.tsx'; // here we render App.
// imported React Router for page navigation
import { BrowserRouter } from "react-router-dom";

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

if (!domain || !clientId) {
  throw new Error("Missing Auth0 environment variables");
}

createRoot(document.getElementById('root')!).render(
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    authorizationParams={{ redirect_uri: window.location.origin }}
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Auth0Provider>,
)