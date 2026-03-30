import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router-dom";

export function LoginPage() {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [role, setRole] = useState("student");
  const { loginWithRedirect } = useAuth0();



  // handleLogin will run when the Login button gets clicked
  const handleLogin = () => {
    void loginWithRedirect({ appState: { returnTo: "/", userRole: role } });
  };


  // Creating the main background.
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(to top, #a22237 0%, #5C1E26 25%, #4a1530 45%, #3d1542 65%, #2e1240 80%, #270115 100%)",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}





    
    >

{/* top wave */}
<svg

style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "50%", opacity: 0.3 }}

viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden="true"

>

<defs>

<linearGradient id="wave3" x1="0%" y1="100%" x2="100%" y2="0%">

<stop offset="0%" stopColor="#270115" />

<stop offset="40%" stopColor="#4a1340" />

<stop offset="100%" stopColor="#a22237" />

</linearGradient>

</defs>

<path d="M0 200 C200 60 500 320 720 180 C940 40 1200 280 1440 140 L1440 0 L0 0Z" fill="url(#wave3)" />

</svg>

      {/* middle wave */}
      <svg
        style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "55%", opacity: 0.5 }}
        viewBox="0 0 1440 500" preserveAspectRatio="none" aria-hidden="true"
      >
        <defs>
          <linearGradient id="wave2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c93050" />
            <stop offset="50%" stopColor="#6b1a30" />
            <stop offset="100%" stopColor="#42184a" />
          </linearGradient>
        </defs>
        <path d="M0 280 C360 400 600 160 900 300 C1100 400 1300 220 1440 340 L1440 500 L0 500Z" fill="url(#wave2)" />
      </svg>






   


{/* bottom wave */}

<svg

style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "70%", opacity: 0.3 }}

viewBox="0 0 1440 600" preserveAspectRatio="none" aria-hidden="true"

>

<defs>

<linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="100%">

<stop offset="0%" stopColor="#a22237" />

<stop offset="50%" stopColor="#5C1E26" />

<stop offset="100%" stopColor="#3d1542" />

</linearGradient>

</defs>

<path d="M0 320 C240 180 480 480 720 340 C960 200 1200 440 1440 300 L1440 600 L0 600Z" fill="url(#wave1)" />

</svg>



      
      {/* login card */}
      <div
        style={{
          color: "#5C1E26",
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
          Log in
        </h2>




        {/* Prompting user to enter their information */}
        <h3 style={{
          fontFamily: "Inter",
          fontWeight: 300,
          fontSize: "16px",
          color: "black",
          marginTop: 0,
          marginBottom: 16,
        }}>
          Choose your role to continue









        </h3>









        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            fontSize: "15px",
            fontStyle: "italic",
            fontWeight: "490",
            marginBottom: 24,
            color: "black",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          }}>
            <label style={{ marginBottom: 6 }}>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ width: 300, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            >
              <option value="student">Student</option>
              <option value="professor">Professor</option>
            </select>
          </div>

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
              backgroundColor: "#5C1E26",
              borderRadius: 12,
              marginTop: 8,
              color: "white",
              border: "none",
              cursor: "pointer",
              boxShadow: isPressed
                ? "inset 0px 4px 6px rgba(0,0,0,0.4)"
                : isHovered
                ? "inset 0px 2px 4px rgba(0,0,0,0.25)"
                : "none",
              transition: "all 0.1s ease",
              marginBottom: 28,
            }}
          >
            Log in
          </button>







          <div style={{ width: 300, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              fontFamily: "Inter",
              fontSize: "14px",
              color: "#4b4b4b",
              marginBottom: 12,
            }}>
              New to D.I.Y.A?
            </div>
            <Link
              to="/signup"
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 12,
                border: "1px solid #5C1E26",
                color: "#5C1E26",
                textDecoration: "none",
                textAlign: "center",
                fontFamily: "Inter",
                fontSize: "16px",
                fontWeight: 500,
                backgroundColor: "#fff",
                boxSizing: "border-box",
              }}
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
