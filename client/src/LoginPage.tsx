import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export function LoginPage() {
  const { loginWithRedirect } = useAuth0();
  
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [role, setRole] = useState("");

  const handleLogin = (connectionName?: string) => {
    if (!role) {
      alert("Please select a role before logging in!");
      return;
    }
    
    // Save role to memory before leaving
    localStorage.setItem("userRole", role);

    // Set up the VIP pass request
    const authParams: any = {
      audience: "https://api.diya.com",
    };

    // If they clicked Google or Apple, tell Auth0!
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

        {/* Updated clean Title */}
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
          Log in
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

          <h2
            style={{
               fontFamily: "inter",
               fontSize: "12px",
               fontWeight: 200,
               marginTop: 10,
               marginBottom: 0,
               color: "black",
               display: "flex",
               flexDirection: "column",
               alignItems: "flex-start",
            }}
          >
            Forgot your password?
          </h2>

          <button
            onClick={() => handleLogin()} 
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
            Log in
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
            onClick={() => handleLogin("google-oauth2")} 
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
            Log in with Google
          </button>

          <button
            onClick={() => handleLogin("apple")} 
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
            Log in with Apple
          </button>

          <h1
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
              fontSize: "17px",
              fontWeight: 200,
              marginTop: 20,
              marginBottom: 0,
              color: "#b0adad",
              textAlign: "center"
            }}
          >
            By clicking Log in, you agree to our Terms of Service and Privacy Policy
          </h1>

          {/* NEW: Clean Sign Up link shifted to the bottom */}
          <div style={{ marginTop: 25, fontSize: "14px", fontFamily: "Inter", color: "black" }}>
             Don't have an account?{" "}
             <Link to="/signup" style={{ color: "#7A9B76", fontWeight: "bold", textDecoration: "none" }}>
               Sign up
             </Link>
          </div>

        </div>
      </div>
    </div>
  );
}