import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {/* The Auth0 Shield is back! */}
    <Auth0Provider
      domain="dev-z2tqbgv1uahuv0m2.us.auth0.com" 
      clientId="JmNjs4o8enzX9mQTjdT6l1OGOrYahsBk"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "https://api.diya.com" 
      }}
    >
      {/* Your teammate's page router */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Auth0Provider>
  </React.StrictMode>
);