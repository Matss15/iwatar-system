// Kiosk prototype behavior: show changing local scan statuses without real hardware yet.
const fingerprintStatus = document.getElementById("fingerprintStatus");
const temperatureStatus = document.getElementById("temperatureStatus");

setInterval(() => {
  if (!fingerprintStatus || !temperatureStatus) return;

  fingerprintStatus.textContent = "Scanner ready";
  const temp = (36.3 + Math.random() * 1.1).toFixed(1);
  temperatureStatus.textContent = `${temp} C - ${temp >= 37.5 ? "Flagged" : "Normal"}`;
}, 5000);
