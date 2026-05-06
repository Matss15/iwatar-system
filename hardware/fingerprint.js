async function status() {
  return {
    connected: false,
    mode: "mock",
    message: "Fingerprint scanner adapter is ready for device integration.",
  };
}

async function enroll(studentId) {
  return {
    student_id: Number(studentId),
    fingerprint_id: `mock-${studentId}-${Date.now()}`,
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
