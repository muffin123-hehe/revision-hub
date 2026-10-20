
/* ============================================
   Revision Hub 🐾
   Site interactions — homepage + subjects
   Keeps your existing HTML and design intact.
   ============================================ */

(() => {
  "use strict";

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const subjectNames = {
    maths: "Maths",
    science: "Science",
    english: "English",
    history: "History",
    geography: "Geography",
    spanish: "Spanish",
    korean: "Korean"
  };

  const storage = {
    get(key, fallback = "") {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
      } catch {
        return fallback;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },

    getJSON(key, fallback = []) {
      try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
      } catch {
        return fallback;
      }
    }
  };

  let currentSubject = "";
  let currentTab = "notes";

  /* --------------------------------------------
     HOMEPAGE
     Only adds gentle interaction. No redesign.
     -------------------------------------------- */

  function initHomepage() {
    const home = $("#home");
    if (!home) return;

    // Smooth scrolling for links pointing to sections.
    $$('a[href^="#"]').forEach(link => {
      link.addEventListener("click", event => {
        const target = $(link.getAttribute("href"));
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      });
    });
  }

  /* --------------------------------------------
     SUBJECT SELECTION
     -------------------------------------------- */

  function openLearning(keyStage, subject) {
    if (!subjectNames[subject]) {
      console.warn("Revision Hub: Unknown subject:", subject);
      return;
    }

    // Korean has its own page.
    if (subject === "korean") {
      window.location.href = "korean.html";
      return;
    }

    currentSubject = subject;
    currentTab = "notes";

    const room = $("#revision-room");
    const heading = $("#selected-subject");

    if (!room || !heading) {
      console.error(
        "Revision Hub: Could not find #revision-room or #selected-subject. " +
        "Check that the subjects page HTML contains these elements."
      );
      return;
    }

    heading.textContent =
      `${subjectNames[subject]} · ${String(keyStage).toUpperCase()}`;

    room.hidden = false;

    renderTab();

    room.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function backToSubjects() {
    const room = $("#revision-room");
    if (room) room.hidden = true;

    const grid = $(".subjects-grid");
    if (grid) {
      grid.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  /* --------------------------------------------
     REVISION TABS
     -------------------------------------------- */

  function showTab(tab) {
    const validTabs = [
      "notes",
      "flashcards",
      "checklist",
      "facts",
      "practice"
    ];

    if (!validTabs.includes(tab)) return;

    currentTab = tab;
    renderTab();
  }

  function renderTab() {
    const content = $("#revision-content");
    if (!content || !currentSubject) return;

    if (currentTab === "notes") renderNotes(content);
    if (currentTab === "flashcards") renderFlashcards(content);
    if (currentTab === "checklist") renderChecklist(content);
    if (currentTab === "facts") renderFacts(content);
    if (currentTab === "practice") renderPractice(content);
  }

  /* --------------------------------------------
     NOTES
     -------------------------------------------- */

  function renderNotes(content) {
    const key = `studyPaws_notes_${currentSubject}`;
    const notes = storage.get(key);

    content.innerHTML = `
      <h3>Your ${subjectNames[currentSubject]} notes 📝</h3>
      <textarea
        id="subject-notes"
        rows="8"
        placeholder="Write your notes here..."
      ></textarea>
      <button type="button" id="save-subject-notes">
        Save notes ♡
      </button>
      <p id="notes-status" aria-live="polite"></p>
    `;

    $("#subject-notes", content).value = notes;

    $("#save-subject-notes", content).addEventListener("click", () => {
      const value = $("#subject-notes", content).value;
      const status = $("#notes-status", content);

      status.textContent = storage.set(key, value)
        ? "Your notes are saved! ♡"
        : "Sorry, your notes could not be saved.";
    });
  }

  /* --------------------------------------------
     FLASHCARDS
     -------------------------------------------- */

  function renderFlashcards(content) {
    const key = `studyPaws_cards_${currentSubject}`;
    const cards = storage.getJSON(key, []);

    content.innerHTML = `
      <h3>Flashcards 🃏</h3>
      <p>Make your own question-and-answer cards.</p>

      <label for="flashcard-question">Question</label>
      <input id="flashcard-question" placeholder="Type a question">

      <label for="flashcard-answer">Answer</label>
      <textarea id="flashcard-answer" rows="3"
        placeholder="Type the answer"></textarea>

      <button type="button" id="add-flashcard">Add flashcard +</button>
      <p id="flashcard-status" aria-live="polite"></p>
      <div id="flashcard-list"></div>
    `;

    const list = $("#flashcard-list", content);

    function draw() {
      list.replaceChildren();

      if (!cards.length) {
        const empty = document.createElement("p");
        empty.textContent = "Your flashcards will appear here. ✨";
        list.appendChild(empty);
        return;
      }

      cards.forEach(card => {
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        const answer = document.createElement("p");

        summary.textContent = card.question;
        answer.textContent = card.answer;

        details.append(summary, answer);
        list.appendChild(details);
      });
    }

    $("#add-flashcard", content).addEventListener("click", () => {
      const question = $("#flashcard-question", content).value.trim();
      const answer = $("#flashcard-answer", content).value.trim();
      const status = $("#flashcard-status", content);

      if (!question || !answer) {
        status.textContent = "Add both a question and an answer first!";
        return;
      }

      cards.push({ question, answer });

      if (!storage.set(key, JSON.stringify(cards))) {
        cards.pop();
        status.textContent = "Couldn't save the flashcard.";
        return;
      }

      $("#flashcard-question", content).value = "";
      $("#flashcard-answer", content).value = "";
      status.textContent = "Flashcard added! ♡";
      draw();
    });

    draw();
  }

  /* --------------------------------------------
     REVISION CHECKLIST
     -------------------------------------------- */

  function renderChecklist(content) {
    const key = `studyPaws_checklist_${currentSubject}`;
    const tasks = storage.getJSON(key, []);

    content.innerHTML = `
      <h3>Revision checklist ✅</h3>
      <p>Little steps make big progress!</p>

      <form id="revision-checklist-form">
        <input id="revision-task"
          placeholder="What will you revise?" required>
        <button type="submit">Add task +</button>
      </form>

      <ul id="revision-task-list"></ul>
    `;

    const list = $("#revision-task-list", content);

    function saveAndDraw() {
      if (!storage.set(key, JSON.stringify(tasks))) {
        alert("Your checklist could not be saved.");
      }

      list.replaceChildren();

      tasks.forEach((task, index) => {
        const item = document.createElement("li");
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        const text = document.createElement("span");
        const remove = document.createElement("button");

        checkbox.type = "checkbox";
        checkbox.checked = Boolean(task.done);

        text.textContent = task.text;
        if (task.done) text.style.textDecoration = "line-through";

        checkbox.addEventListener("change", () => {
          tasks[index].done = checkbox.checked;
          saveAndDraw();
        });

        label.append(checkbox, text);

        remove.type = "button";
        remove.textContent = "Remove";
        remove.addEventListener("click", () => {
          tasks.splice(index, 1);
          saveAndDraw();
        });

        item.append(label, remove);
        list.appendChild(item);
      });
    }

    $("#revision-checklist-form", content).addEventListener(
      "submit",
      event => {
        event.preventDefault();

        const input = $("#revision-task", content);
        const value = input.value.trim();
        if (!value) return;

        tasks.push({ text: value, done: false });
        input.value = "";
        saveAndDraw();
      }
    );

    saveAndDraw();
  }

  /* --------------------------------------------
     KEY FACTS
     -------------------------------------------- */

  function renderFacts(content) {
    const key = `studyPaws_facts_${currentSubject}`;

    content.innerHTML = `
      <h3>Key facts ⭐</h3>
      <p>Keep your most important facts in one place.</p>
      <textarea id="subject-facts" rows="8"
        placeholder="Write your key facts here..."></textarea>
      <button type="button" id="save-subject-facts">
        Save key facts ♡
      </button>
      <p id="facts-status" aria-live="polite"></p>
    `;

    $("#subject-facts", content).value = storage.get(key);

    $("#save-subject-facts", content).addEventListener("click", () => {
      const value = $("#subject-facts", content).value;
      $("#facts-status", content).textContent =
        storage.set(key, value)
          ? "Key facts saved! ♡"
          : "Couldn't save your key facts.";
    });
  }

  /* --------------------------------------------
     PRACTICE PROMPTS
     -------------------------------------------- */

  function renderPractice(content) {
    const prompts = [
      "Explain today's topic without looking at your notes.",
      "What are the three most important facts you remember?",
      "Give an example that shows you understand the topic.",
      "What would you teach someone else about this subject?",
      "Which part do you need to practise again?"
    ];

    content.innerHTML = `
      <h3>Practice time ✏️</h3>
      <p>Practise remembering things without looking them up.</p>
      <button type="button" id="new-practice-prompt">
        Give me a study prompt ✨
      </button>
      <p id="practice-prompt" aria-live="polite"></p>
      <textarea id="practice-answer" rows="7"
        placeholder="Write your answer from memory..."></textarea>
      <button type="button" id="save-practice-answer">
        Save my answer ♡
      </button>
      <p id="practice-status" aria-live="polite"></p>
    `;

    $("#new-practice-prompt", content).addEventListener("click", () => {
      const prompt = prompts[Math.floor(Math.random() * prompts.length)];
      $("#practice-prompt", content).textContent = prompt;
    });

    const answerKey = `studyPaws_practice_${currentSubject}`;
    $("#practice-answer", content).value = storage.get(answerKey);

    $("#save-practice-answer", content).addEventListener("click", () => {
      const value = $("#practice-answer", content).value;
      $("#practice-status", content).textContent =
        storage.set(answerKey, value)
          ? "Answer saved! Keep up the great work. ♡"
          : "Couldn't save your answer.";
    });
  }

  /* --------------------------------------------
     CONNECT BUTTONS IN YOUR EXISTING HTML
     -------------------------------------------- */

  window.openLearning = openLearning;
  window.backToSubjects = backToSubjects;
  window.showTab = showTab;

  function initSubjects() {
    // Existing HTML buttons use onclick attributes.
    // The window functions above make those calls work.
    if (!$("#revision-room") || !$(".subjects-grid")) return;

    // Keep the revision room hidden until a subject is chosen.
    const room = $("#revision-room");
    if (room && !currentSubject) room.hidden = true;
  }

  function init() {
    initHomepage();
    initSubjects();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
