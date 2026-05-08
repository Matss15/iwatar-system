// Keep delete buttons simple and understandable for beginners.
document.querySelectorAll("form[action$='/delete']").forEach((form) => {
  form.addEventListener("submit", (event) => {
    if (!confirm("Delete this record?")) {
      event.preventDefault();
    }
  });
});

document.querySelectorAll(".js-register-fingerprint").forEach((button) => {
  button.addEventListener("click", async () => {
    const form = button.closest("form");
    const fingerprintInput = form.querySelector("[name='fingerprint_id']");
    const status = form.querySelector(".js-fingerprint-status");
    const studentId = form.querySelector("[name='id']")?.value || "";
    const lrn = form.querySelector("[name='lrn']")?.value || "";

    button.disabled = true;
    status.textContent = "Waiting for fingerprint scanner...";

    try {
      const response = await fetch("/admin/fingerprint/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: studentId,
          lrn,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to register fingerprint.");
      }

      const enrollment = await response.json();
      fingerprintInput.value = enrollment.fingerprint_id;
      status.textContent = "Fingerprint registered. Save the student to keep this ID.";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
});
