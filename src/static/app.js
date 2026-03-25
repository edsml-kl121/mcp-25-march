document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");

  // Show an inline message inside a card
  function showCardMessage(card, message, type) {
    const msgDiv = card.querySelector(".card-message");
    msgDiv.textContent = message;
    msgDiv.className = `card-message ${type}`;
    msgDiv.classList.remove("hidden");
    setTimeout(() => msgDiv.classList.add("hidden"), 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          <div class="card-actions">
            <button class="register-btn" data-activity="${name}"${spotsLeft === 0 ? " disabled" : ""}>
              Register Student
            </button>
            <form class="register-form hidden">
              <input type="email" class="register-email" placeholder="student-email@mergington.edu" required />
              <div class="register-form-buttons">
                <button type="submit" class="submit-register-btn" data-activity="${name}">Sign Up</button>
                <button type="button" class="cancel-register-btn">Cancel</button>
              </div>
            </form>
            <div class="card-message hidden" role="status"></div>
          </div>
        `;

        activitiesList.appendChild(activityCard);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      // Toggle register form visibility
      document.querySelectorAll(".register-btn").forEach((button) => {
        button.addEventListener("click", () => {
          const card = button.closest(".activity-card");
          button.classList.add("hidden");
          card.querySelector(".register-form").classList.remove("hidden");
          card.querySelector(".register-email").focus();
        });
      });

      // Cancel registration
      document.querySelectorAll(".cancel-register-btn").forEach((button) => {
        button.addEventListener("click", () => {
          const card = button.closest(".activity-card");
          card.querySelector(".register-form").classList.add("hidden");
          card.querySelector(".register-email").value = "";
          card.querySelector(".register-btn").classList.remove("hidden");
        });
      });

      // Submit per-card registration form
      document.querySelectorAll(".register-form").forEach((form) => {
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          const card = form.closest(".activity-card");
          const activity = card.querySelector(".submit-register-btn").getAttribute("data-activity");
          const email = card.querySelector(".register-email").value.trim();
          await handleRegister(card, activity, email);
        });
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle per-card registration
  async function handleRegister(card, activity, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const result = await response.json();

      if (response.ok) {
        showCardMessage(card, "Registered successfully!", "success");
        setTimeout(() => fetchActivities(), 1200);
      } else {
        showCardMessage(card, result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showCardMessage(card, "Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");
    const card = button.closest(".activity-card");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (response.ok) {
        showCardMessage(card, result.message || "Unregistered successfully!", "success");
        setTimeout(() => fetchActivities(), 1200);
      } else {
        showCardMessage(card, result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showCardMessage(card, "Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Initialize app
  fetchActivities();
});
