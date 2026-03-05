import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react"; // <-- Added Auth0 Import

export function SignUpPage() {
  const { loginWithRedirect } = useAuth0(); // <-- Brought in the Teleport tool
  
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [role, setRole] = useState("");

  // <-- The new Auth0 "Brain" -->
  const handleSignUp = (connectionName?: string) => {
    if (!role) {
      alert("Please select a role before continuing!");
      return;
    }
    
    // Save role to memory before leaving
    localStorage.setItem("userRole", role);

    // Set up the VIP pass request AND tell Auth0 to open the Sign Up tab
    const authParams: any = {
      audience: "https://api.diya.com",
      screen_hint: "signup", // <-- Forces Auth0 to the Sign Up screen!
    };

    // If they clicked Google or Apple
    if (connectionName) {
      authParams.connection = connectionName;
    }

    // Teleport!
    loginWithRedirect({ authorizationParams: authParams });
  };

  return (
    <div
      style={{
       minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#5C1E26",
        padding: 24,
        boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          color: "#7A9B76",
          padding: 24,
          paddingTop: 25,
          alignItems: "center",
          border: "2px solid #D6D6D6",
          borderRadius: 16,
          width: 360,
          boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
          backgroundColor: "#fff",
        }}
      >
        <h1
          style={{
            fontFamily: "Italiana",
            fontSize: "78px",
            fontWeight: 300,
            marginTop: 0,
            marginBottom: 0,
          }}
        >
          D.I.Y.A 
        </h1> 

        <h2
          style={{
            fontFamily: "Inter",
            fontWeight: 480,
            fontSize: "20px",
            color: "black",
            marginTop: 0,
            marginBottom: 10,
          }}
        >
          Sign up
        </h2>

        <h3
          style={{
            fontFamily: "Inter",
            fontWeight: 300,
            fontSize: "16px",
            color: "black",
            marginTop: 0,
            marginBottom: 20,
          }}
        >
          Please enter your credentials to continue
        </h3>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              marginTop: 0,
              fontSize: "15px",
              fontStyle: "italic",
              fontWeight: "490",
              marginBottom: 40,
              color: "black",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            }}
          >
            <label style={{ marginBottom: 6 }}>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: 300,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            >
              <option value="" style={{ color: "#9C2727" }}>
                Select your role
              </option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* NOTE: The password input box was securely removed from here! */}

          <button
            onClick={() => handleSignUp()} // <-- Wired up!
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => {
              setIsPressed(false);
              setIsHovered(false);
            }}
            onMouseEnter={() => setIsHovered(true)}
            style={{
              width: 300,
              padding: 10,
              backgroundColor: "#7A9B76",
              borderRadius: 12,
              marginTop: 40,
              color: "white",
              border: "none",
              cursor: "pointer",
              boxShadow: isPressed
                ? "inset 0px 4px 6px rgba(0,0,0,0.4)"
                : isHovered
                ? "inset 0px 2px 4px rgba(0,0,0,0.25)"
                : "none",
              transition: "all 0.1s ease",
              marginBottom: 20,
            }}
          >
            Sign up
          </button>

          <div
            style={{
              width: 300,
              fontSize: "12px",
              fontFamily: "Inter",
              textAlign: "center",
              marginTop: 80,
              marginBottom: 25,
              color: "#aaa",
            }}
          >
            ---—------------------- or —----------------------
          </div>

          <button
            onClick={() => handleSignUp("google-oauth2")} // <-- Wired for Google!
            style={{
              width: 300,
              padding: 10,
              backgroundColor: "#eeecec",
              fontSize: "15px",
              fontFamily: "Inter",
              color: "#000",
              borderRadius: 12,
              border: "1px solid #ccc",
              cursor: "pointer",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              fontWeight: 500,
            }}
          >
            <img src="/google.svg" alt="Google" style={{ width: 18, height: 18 }} />
            Sign up with Google
          </button>

          <button
            onClick={() => handleSignUp("apple")} // <-- Wired for Apple!
            style={{
              width: 300,
              padding: 10,
              fontSize: "15px",
              fontFamily: "Inter",
              backgroundColor: "#eeecec",
              color: "black",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              fontWeight: 500,
            }}
          >
            <img src="/apple.svg" alt="Apple" style={{ width: 18, height: 18 }} />
            Sign up with Apple
          </button>

          <h1
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
              fontSize: "17px",
              fontWeight: 200,
              marginTop: 20,
              marginBottom: 0,
              color: "#b0adad"
            }}
          >
            By clicking Log in, you agree to our Terms of Service and Privacy Policy
          </h1>
        </div>
      </div>
    </div>
  );
}