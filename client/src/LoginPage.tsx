import { useState } from "react";
import { Link } from "react-router-dom"; // imported for page navigation in React

export function LoginPage() {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => alert(`Logging in as ${role}`);
  const handleGoogleSignup = () => alert("Sign up with Google clicked!");
  const handleAppleSignup = () => alert("Sign up with Apple clicked!");

  return (
    <div
      style={{
       minHeight: "100vh",                  // full viewport height
        display: "flex",
        justifyContent: "center",            // horizontal center
        alignItems: "center",                // vertical center
        backgroundColor: "#5C1E26",          // optional page background
        padding: 24,
        boxShadow: "0px 4px 12px rgba(0,0,0,0.1)", // optional shadow
      }}
    >
      {/* The login BOX */}
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
        {/* Title */}
        <h1 // start tag
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

        
{/* Login title */}
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
  Login or Sign up{" "}
  <Link
    to="/signup" // the path to your signup page
    style={{ color: "#4285F4", textDecoration: "underline", cursor: "pointer" }}
  >
  here
  </Link>{" "}
  
</h2>

      

        {/* Prompt */}
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

        {/* Form container */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Role field */}
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

          {/* Password field */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              color: "black",
              fontSize: "15px",
              fontWeight: "490",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
              fontStyle: "italic",
              marginBottom: 5,
            }}
          >
            <label style={{ marginBottom: 6 }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: 283,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            />
          </div>

          {/* Forgotten password */}
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


          {/* Login button */}
          <button
            onClick={handleLogin}
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

          {/* OR separator */}
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

          {/* Sign up with Google */}
          <button
            onClick={handleGoogleSignup}
            style={{
              width: 300,
              padding: 10,
              backgroundColor: "#eeecec",
              fontWidth: "semi-bold",
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

          {/* Sign up with Apple */}
          <button
            onClick={handleAppleSignup}
            style={{
              width: 300,
              padding: 10,
              fontWidth: "semi-bold",
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

          {/* Title */}
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