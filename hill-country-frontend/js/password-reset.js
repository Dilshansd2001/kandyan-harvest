const API = "http://localhost:5000/api";

function setMessage(el, message, isError = false) {
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("error", Boolean(isError));
}

async function submitForgotPassword() {
  const emailEl = document.getElementById("forgotEmail");
  const msgEl = document.getElementById("forgotMessage");
  const email = (emailEl?.value || "").trim();

  if (!email) {
    setMessage(msgEl, "Please enter your email.", true);
    return;
  }

  setMessage(msgEl, "Sending reset link...");
  try {
    const res = await fetch(`${API}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(msgEl, data.message || "Failed to send reset link.", true);
      return;
    }
    setMessage(msgEl, data.message || "Reset link sent. Check your inbox.");
  } catch (err) {
    setMessage(msgEl, "Failed to send reset link.", true);
  }
}

function getTokenFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const queryToken = params.get("token");
  if (queryToken) return queryToken;

  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts.length >= 2 && parts[0] === "reset-password") {
    return parts[1];
  }

  return "";
}

async function submitResetPassword() {
  const passEl = document.getElementById("newPassword");
  const confirmEl = document.getElementById("confirmPassword");
  const msgEl = document.getElementById("resetMessage");
  const token = getTokenFromQuery();

  const password = passEl?.value || "";
  const confirm = confirmEl?.value || "";

  if (!token) {
    setMessage(msgEl, "Reset token is missing.", true);
    return;
  }
  if (!password) {
    setMessage(msgEl, "Please enter a new password.", true);
    return;
  }
  if (password.length < 6) {
    setMessage(msgEl, "Password must be at least 6 characters.", true);
    return;
  }
  if (password !== confirm) {
    setMessage(msgEl, "Passwords do not match.", true);
    return;
  }

  setMessage(msgEl, "Updating password...");
  try {
    const res = await fetch(`${API}/auth/reset-password/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(msgEl, data.message || "Failed to update password.", true);
      return;
    }
    setMessage(msgEl, "Password updated successfully. Redirecting to login...");
    setTimeout(() => {
      window.location = "login.html";
    }, 1500);
  } catch (err) {
    setMessage(msgEl, "Failed to update password.", true);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const forgotBtn = document.getElementById("forgotBtn");
  if (forgotBtn) {
    forgotBtn.addEventListener("click", submitForgotPassword);
  }

  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", submitResetPassword);
  }
});
