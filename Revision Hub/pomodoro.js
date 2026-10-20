
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const modes = {
    focus: { label: "FOCUS TIME", icon: "🍅", message: "One task at a time!" },
    short: { label: "SHORT BREAK", icon: "☕", message: "Relax and recharge." },
    long: { label: "LONG BREAK", icon: "🌱", message: "You've earned a longer rest!" }
  };

  let durations = { focus: 25, short: 5, long: 15 };
  let mode = "focus";
  let remaining = durations.focus * 60;
  let deadline = null;
  let running = false;
  let interval = null;
  let completed = 0;
  let target = 4;
  let focusSinceBreak = 0;

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function updateProgress() {
    $("completed-count").textContent = completed;
    $("target-count").textContent = target;
    $("progress-fill").style.width =
      `${Math.min(100, (completed / target) * 100)}%`;

    $("progress-message").textContent =
      completed === 0
        ? "Let's complete your first session!"
        : completed >= target
          ? "Amazing! You've reached your goal! 🎉"
          : `${target - completed} more focus session(s) to your goal.`;

    $("next-session").textContent =
      mode === "focus"
        ? `Focus for ${durations.focus} minutes, then take a ${
            focusSinceBreak + 1 >= target ? "long" : "short"
          } break.`
        : "When your break ends, you're ready to focus again.";
  }

  function updateDisplay() {
    $("timer-display").textContent = formatTime(remaining);
    $("timer-display").setAttribute(
      "aria-label",
      `${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds remaining`
    );

    $("current-mode").textContent = `${modes[mode].icon} ${modes[mode].label}`;
    $("timer-icon").textContent = modes[mode].icon;
    $("timer-message").textContent = modes[mode].message;

    const total = durations[mode] * 60;
    const progress = total ? (remaining / total) * 100 : 0;
    $("clock-ring").style.setProperty("--progress", `${progress}%`);

    $("start-pause").textContent = running
      ? "Ⅱ Pause"
      : remaining === 0
        ? "↻ Start again"
        : "▶ Start";

    document.title = `${formatTime(remaining)} · ${modes[mode].label} | Revision Hub`;
    updateProgress();
  }

  function stopInterval() {
    if (interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  }

  function pauseTimer() {
    if (!running) return;
    remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    running = false;
    deadline = null;
    stopInterval();
    updateDisplay();
    $("timer-status").textContent = "Paused. Take your time. 💜";
  }

  function playEndSound() {
    if (!$("sound-toggle").checked) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const context = new AudioContext();
      [660, 880, 660].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + index * 0.22;

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.15, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.2);
      });

      setTimeout(() => context.close(), 1200);
    } catch (error) {
      console.warn("The timer sound could not be played.", error);
    }
  }

  function notifyFinished() {
    playEndSound();

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Revision Hub 🐾", {
        body: mode === "focus"
          ? "Focus session complete! Time for a break."
          : "Your break is over. Ready when you are!"
      });
    }

    $("timer-status").textContent =
      mode === "focus"
        ? "🎉 Focus session complete! Take a well-deserved break."
        : "🐾 Break complete! Ready for another session?";
  }

  function finishTimer() {
    running = false;
    remaining = 0;
    deadline = null;
    stopInterval();

    if (mode === "focus") {
      completed++;
      focusSinceBreak++;
    }

    updateDisplay();
    notifyFinished();
  }

  function tick() {
    remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));

    if (remaining <= 0) {
      finishTimer();
      return;
    }

    updateDisplay();
  }

  function startTimer() {
    if (running) {
      pauseTimer();
      return;
    }

    if (remaining <= 0) remaining = durations[mode] * 60;

    running = true;
    deadline = Date.now() + remaining * 1000;
    $("timer-status").textContent = "You've got this, Study Paw! 💜";

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    stopInterval();
    interval = setInterval(tick, 250);
    updateDisplay();
  }

  function selectMode(nextMode) {
    if (!modes[nextMode]) return;

    running = false;
    deadline = null;
    stopInterval();

    mode = nextMode;
    remaining = durations[mode] * 60;

    document.querySelectorAll(".pom-mode").forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === mode);
    });

    $("timer-status").textContent = "Ready for your next session.";
    updateDisplay();
  }

  function resetTimer() {
    running = false;
    deadline = null;
    stopInterval();
    remaining = durations[mode] * 60;
    $("timer-status").textContent = "Timer reset. Ready when you are!";
    updateDisplay();
  }

  function skipSession() {
    running = false;
    deadline = null;
    stopInterval();

    if (mode === "focus") {
      selectMode(focusSinceBreak + 1 >= target ? "long" : "short");
    } else {
      selectMode("focus");
    }
  }

  function readMinutes(id, fallback, max) {
    const value = Number($(id).value);
    return Number.isInteger(value) && value >= 1 && value <= max
      ? value
      : fallback;
  }

  $("apply-settings").addEventListener("click", () => {
    durations.focus = readMinutes("focus-minutes", 25, 180);
    durations.short = readMinutes("short-minutes", 5, 60);
    durations.long = readMinutes("long-minutes", 15, 90);
    target = readMinutes("sessions-target", 4, 12);

    $("focus-minutes").value = durations.focus;
    $("short-minutes").value = durations.short;
    $("long-minutes").value = durations.long;
    $("sessions-target").value = target;

    resetTimer();
    updateProgress();
    $("timer-status").textContent = "Your timer settings are saved! 🐾";
  });

  document.querySelectorAll(".pom-mode").forEach((button) => {
    button.addEventListener("click", () => selectMode(button.dataset.mode));
  });

  $("start-pause").addEventListener("click", startTimer);
  $("reset-timer").addEventListener("click", resetTimer);
  $("skip-session").addEventListener("click", skipSession);

  window.addEventListener("pagehide", () => {
    stopInterval();
  });

  updateDisplay();
})();
