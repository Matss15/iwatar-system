// Keep delete buttons simple and understandable for beginners.
document.querySelectorAll("form[action$='/delete']").forEach((form) => {
  form.addEventListener("submit", (event) => {
    if (!confirm("Delete this record?")) {
      event.preventDefault();
    }
  });
});
