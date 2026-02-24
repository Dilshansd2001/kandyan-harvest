const API = "https://kandyan-harvest-backend-new.vercel.app/api";

async function login() {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {

    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      document.getElementById("error").innerText = data.message;
      return;
    }

    // 🔑 Save token
    localStorage.setItem("token", data.token);

    // 🎯 Redirect by role
    if (data.role === "farmer") {
      window.location = "farmer-dashboard.html";
    }

    else if (data.role === "supermarket") {
      window.location = "supermarket-dashboard.html";
    }

    else if (data.role === "driver") {
      window.location = "driver-dashboard.html";
    }

    else if (data.role === "admin") {
      window.location = "admin-dashboard.html";
    }

  } catch (err) {
    document.getElementById("error").innerText = "Login Failed";
  }
}

function logout() {
  localStorage.removeItem("token");
  window.location = "login.html";
}
