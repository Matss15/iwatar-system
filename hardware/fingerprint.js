async function status() {
  return {
    connected: false,
    mode: "mock",
    message: "Fingerprint scanner adapter is ready for device integration.",
  };
}

async function enroll(studentId) {
  const enrollmentKey = String(studentId || "new").replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();

  return {
    student_id: Number(studentId) || null,
    fingerprint_id: `mock-${enrollmentKey}-${Date.now()}`,
    mode: "mock",
  };
}

async function scan() {
  return {
    matched: false,
    fingerprint_id: null,
    mode: "mock",
    message: "No physical scanner is connected yet.",
  };
}

module.exports = {
  status,
  enroll,
  scan,
};
