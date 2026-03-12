import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function LoginPage() {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();



  // handleLogin will run when the Login button gets clicked
  const handleLogin = () => {
    //If no role is chosen, will prompt you to choose a role
    if (!role) {
      alert("Please select a role to continue.");
      return;
    }
    // If student rols is chosen, you will be directed to the student groups page 
    if (role === "student") {
      navigate("/groups");
      return;
    }
    // Otherwise if a different role is chosen then an alternate output is given
    alert(`Logging in as ${role} (admin routes not wired yet)`);
  };

  // Runs when Google/Apple button is clicked
  const handleGoogleSignup = () => alert("Sign up with Google clicked!");
  const handleAppleSignup = () => alert("Sign up with Apple clicked!");


  // Creating the main background.
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#e8e8e8",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}





    >
      {/* green background circles */}
      <svg
        style={{ position: "absolute", top: -80, left: -120, width: 620, height: 580, opacity: 0.85 }}
        viewBox="0 0 600 560" aria-hidden="true"
      >
        <defs>
          <linearGradient id="blobTL" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6b8e68" />
            <stop offset="100%" stopColor="#7A9B76" />
          </linearGradient>
        </defs>
        <path d="M420 40 C540 80 580 220 530 340 C480 460 340 520 200 490 C60 460 -20 340 10 210 C40 80 180 -10 320 10 C360 16 390 24 420 40Z" fill="url(#blobTL)" />
      </svg>

      <svg
        style={{ position: "absolute", bottom: -100, right: -140, width: 660, height: 600, opacity: 0.8 }}
        viewBox="0 0 640 580" aria-hidden="true"
      >
        <defs>
          <linearGradient id="blobBR" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#7A9B76" />
            <stop offset="100%" stopColor="#8aad86" />
          </linearGradient>
        </defs>
        <path d="M480 60 C600 120 640 280 580 420 C520 540 360 580 220 530 C80 480 10 340 60 200 C110 60 280 -20 400 20 C430 28 460 42 480 60Z" fill="url(#blobBR)" />
      </svg>

      <svg
        style={{ position: "absolute", top: -40, right: -60, width: 340, height: 320, opacity: 0.45 }}
        viewBox="0 0 320 300" aria-hidden="true"
      >
        <path d="M240 30 C300 60 320 150 280 230 C240 300 150 310 80 260 C10 210 -10 120 40 60 C90 0 180 0 240 30Z" fill="#7A9B76" />
      </svg>

      <svg
        style={{ position: "absolute", bottom: -30, left: -50, width: 300, height: 280, opacity: 0.5 }}
        viewBox="0 0 280 260" aria-hidden="true"
      >
        <path d="M200 20 C260 50 280 140 240 200 C200 260 110 270 50 220 C-10 170 -20 80 30 30 C80 -20 140 -10 200 20Z" fill="#8aad86" />
      </svg>

      <svg
        style={{ position: "absolute", top: "40%", left: "55%", width: 260, height: 240, opacity: 0.2 }}
        viewBox="0 0 240 220" aria-hidden="true"
      >
        <path d="M180 20 C230 50 240 120 200 180 C160 230 80 240 30 190 C-20 140 -10 60 40 20 C90 -10 130 -5 180 20Z" fill="#7A9B76" />
      </svg>





      
      {/* login card */}
      <div
        style={{
          color: "#7A9B76",
          padding: 24,
          paddingTop: 25,
          alignItems: "center",
          border: "2px solid #D6D6D6",
          borderRadius: 16,
          width: 360,
          boxShadow: "0 16px 60px rgba(0,0,0,0.12)",
          backgroundColor: "#fff",
          position: "relative",
          zIndex: 1,
        }}



     
      >
        {/* D.I.Y.A title within Login card */}
        <h1 style={{
          fontFamily: "Italiana",
          fontSize: "78px",
          fontWeight: 300,
          marginTop: 0,
          marginBottom: 0,
        }}>
          
          D.I.Y.A 
        </h1>






        {/* Login or sign up option */}
        <h2 style={{
          fontFamily: "Inter",
          fontWeight: 480,
          fontSize: "20px",
          color: "black",
          marginTop: 0,
          marginBottom: 10,
        }}>
          Login or{" "}
          <Link to="/signup" style={{ color: "#4285F4", textDecoration: "underline", cursor: "pointer" }}>
            sign up
          </Link>
        </h2>




        {/* Prompting user to enter their information */}
        <h3 style={{
          fontFamily: "Inter",
          fontWeight: 300,
          fontSize: "16px",
          color: "black",
          marginTop: 0,
          marginBottom: 20,
        }}>
          Please enter your credentials to continue









        </h3>









        {/* Aligning role selection area within the Login box, Customizing Role title */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            fontSize: "15px",
            fontStyle: "italic",
            fontWeight: "490",
            marginBottom: 40,
            color: "black",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          }}>
            {/*Displayes Role label */}
            <label style={{ marginBottom: 6 }}>Role</label>
            {/* Dropdown menu: */}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ width: 300, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            >
              {/*Drop down menu with options */}
              <option value="" style={{ color: "#9C2727" }}>Select your role</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>






          {/* Password section: Password title and enter password box   */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            color: "black",
            fontSize: "15px",
            fontWeight: "490",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            fontStyle: "italic",
            marginBottom: 5,
          }}>
            <label style={{ marginBottom: 6 }}>Password</label>
            {/* Input area for password. 
            Setting placeholder and assigning text inside input box to variable: password
            setPassword changes what resides in password variable */}
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: 283, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            />
          </div>







          {/* Creates Forgot password text. Will later link to Forgot passwword page */}

          <h2 style={{
            fontFamily: "Inter",
            fontSize: "12px",
            fontWeight: 200,
            marginTop: 10,
            marginBottom: 0,
            color: "black",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}>
            Forgot your password?





          </h2>

          {/* Handles what happens when user hovers over, or clicks on Login button. what changes and what happens */}
          <button
            onClick={handleLogin}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => { setIsPressed(false); setIsHovered(false); }}
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







          <div style={{
            width: 300,
            fontSize: "12px",
            fontFamily: "Inter",
            textAlign: "center",
            marginTop: 80,
            marginBottom: 25,
            color: "#aaa",
          }}>
            ---—------------------- or —----------------------
          </div>

          {/* Handles what happens when login to Google is pressed. */}
          <button
            onClick={handleGoogleSignup}
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







          {/* Handles what happens when login with Apple is pressed */}
          <button
            onClick={handleAppleSignup}
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
        </div>
      </div>
    </div>
  );
}
