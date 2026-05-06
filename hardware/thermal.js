async function status() {
  return {
    connected: false,
    mode: "mock",
    message: "Thermal scanner adapter is ready for device integration.",
  };
}

async function scan() {
  const temperature = Number((36.4 + Math.random() * 0.8).toFixed(1));

  return {
    temperature_c: temperature,
    status: temperature >= 37.5 ? "flagged" : "normal",
    mode: "mock",
  };
}

module.exports = {
  status,
  scan,
};
