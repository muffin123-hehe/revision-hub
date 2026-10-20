
/* ==========================================
   Revision Hub — SUBJECTS PAGE
   Subject navigation, tabs and saved notes
   ========================================== */

(() => {
  "use strict";

  const revisionRoom = document.getElementById("revision-room");
  const selectedSubject = document.getElementById("selected-subject");
  const revisionContent = document.getElementById("revision-content");
  const notesArea = document.getElementById("subject-notes");

  let activeSubject = "";
  let activeTab = "notes";

  const subjects = {
    maths: "Maths",
    science: "Science",
    english: "English",
    history: "History",
    geography: "Geography",
    spanish: "Spanish"
  };

  const storageKey = subject => `studyPawsNotes_${subject}`;

  window.openLearning = function (keyStage, subject) {
    if (!subjects[subject]) return;

    activeSubject = subject;
    activeTab = "notes";

    if (selectedSubject) {
      selectedSubject.textContent = `${subjects[subject]} — ${keyStage.toUpperCase()}`;
    }

    if (revisionRoom) {
      revisionRoom.hidden = false;
      revisionRoom.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

    renderTab();
  };

  window.backToSubjects = function () {
    if (revisionRoom) revisionRoom.hidden = true;

    document.querySelector(".subjects-grid")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  window.showTab = function (tab) {
    const validTabs = [
      "notes",
      "flashcards",
      "checklist",
      "facts",
      "practice"
    ];

    if (!validTabs.includes(tab)) return;

    activeTab = tab;
    renderTab();
  };

  window.saveSubjectNotes = function () {
    if (!activeSubject || !notesArea) return;

    try {
      localStorage.setItem(
        storageKey(activeSubject),
        notesArea.value
      );

      const saveButton = revisionContent?.querySelector(
        "[data-save-notes]"
      );

      if (saveButton) {
        saveButton.textContent = "Saved! ♡";
        setTimeout(() => {
          saveButton.textContent = "Save notes ♡";
        }, 1500);
      }
    } catch (error) {
      alert("Sorry! Your notes could not be saved in this browser.");
    }
  };

  function renderTab() {
    if (!revisionContent || !activeSubject) return;

    if (activeTab === "notes") {
      let savedNotes = "";

      try {
        savedNotes =
          localStorage.getItem(storageKey(activeSubject)) || "";
      } catch (error) {
        console.warn("Saved notes could not be loaded.", error);
      }

      revisionContent.innerHTML = `
        <h3>Your ${subjects[activeSubject]} notes 📝</h3>
        <textarea
          id="subject-notes"
          placeholder="Write your notes here..."
          rows="8"
        ></textarea>
        <button type="button" data-save-notes>
          Save notes ♡
        </button>
      `;

      revisionContent.querySelector("textarea").value = savedNotes;

      revisionContent.querySelector("[data-save-notes]")
        .addEventListener("click", window.saveSubjectNotes);

      return;
    }

    const content = {
      flashcards: `
        <h3>Flashcards 🃏</h3>
        <p>Create question-and-answer cards as you revise.</p>
        <label for="new-card-question">Question</label>
        <input id="new-card-question" placeholder="Enter a question">
        <label for="new-card-answer">Answer</label>
        <textarea id="new-card-answer" placeholder="Enter the answer"></textarea>
        <button type="button" id="add-card">Add flashcard ♡</button>
        <div id="my-flashcards"></div>
      `,
      checklist: `
        <h3>Revision checklist ✅</h3>
        <p>Add the things you want to revise, then tick them off!</p>
        <form id="checklist-form">
          <input id="checklist-item" placeholder="What will you revise?" required>
          <button type="submit">Add task +</button>
        </form>
        <ul id="checklist-items"></ul>
      `,
      facts: `
        <h3>Key facts ⭐</h3>
        <p>Write down the important facts you want to remember.</p>
        <textarea id="key-facts" rows="8"
          placeholder="Add your key facts here..."></textarea>
        <button type="button" id="save-facts">Save key facts ♡</button>
        <p id="facts-status" aria-live="polite"></p>
      `,
      practice: `
        <h3>Practice time ✏️</h3>
        <p>Test your understanding of ${subjects[activeSubject]}.</p>
        <textarea id="practice-answer" rows="8"
          placeholder="Write a question, then explain your answer from memory..."></textarea>
        <button type="button" id="reveal-practice">
          Show a study prompt
        </button>
        <p id="practice-prompt" aria-live="polite"></p>
      `
    };

    revisionContent.innerHTML = content[activeTab];

    if (activeTab === "flashcards") setupFlashcards();
    if (activeTab === "checklist") setupChecklist();
    if (activeTab === "facts") setupFacts();
    if (activeTab === "practice") setupPractice();
  }

  function setupFlashcards() {
    const question = document.getElementById("new-card-question");
    const answer = document.getElementById("new-card-answer");
    const list = document.getElementById("my-flashcards");

    const key = `studyPawsCards_${activeSubject}`;
    let cards = [];

    try {
      cards = JSON.parse(localStorage.getItem(key) || "[]");
      if (!Array.isArray(cards)) cards = [];
    } catch {
      cards = [];
    }

    function drawCards() {
      list.innerHTML = "";

      cards.forEach((card, index) => {
        const item = document.createElement("details");
        const summary = document.createElement("summary");
        const answerText = document.createElement("p");

        summary.textContent = card.question;
        answerText.textContent = card.answer;
        item.append(summary, answerText);
        list.appendChild(item);
      });
    }

    document.getElementById("add-card").addEventListener("click", () => {
      if (!question.value.trim() || !answer.value.trim()) {
        alert("Add both a question and an answer first!");
        return;
      }

      cards.push({
        question: question.value.trim(),
        answer: answer.value.trim()
      });

      try {
        localStorage.setItem(key, JSON.stringify(cards));
      } catch {
        alert("The flashcard could not be saved.");
        return;
      }

      question.value = "";
      answer.value = "";
      drawCards();
    });

    drawCards();
  }

  function setupChecklist() {
    const form = document.getElementById("checklist-form");
    const input = document.getElementById("checklist-item");
    const list = document.getElementById("checklist-items");
    const key = `studyPawsChecklist_${activeSubject}`;

    let tasks = [];

    try {
      tasks = JSON.parse(localStorage.getItem(key) || "[]");
      if (!Array.isArray(tasks)) tasks = [];
    } catch {
      tasks = [];
    }

    function drawTasks() {
      list.innerHTML = "";

      tasks.forEach((task, index) => {
        const li = document.createElement("li");
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        const remove = document.createElement("button");

        checkbox.type = "checkbox";
        checkbox.checked = task.done;
        checkbox.addEventListener("change", () => {
          tasks[index].done = checkbox.checked;
          saveTasks();
        });

        label.append(checkbox, document.createTextNode(" " + task.text));
        remove.type = "button";
        remove.textContent = "Remove";
        remove.addEventListener("click", () => {
          tasks.splice(index, 1);
          saveTasks();
        });

        li.append(label, remove);
        list.appendChild(li);
      });
    }

    function saveTasks() {
      try {
        localStorage.setItem(key, JSON.stringify(tasks));
      } catch {
        alert("Your checklist could not be saved.");
      }

      drawTasks();
    }

    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!input.value.trim()) return;

      tasks.push({ text: input.value.trim(), done: false });
      input.value = "";
      saveTasks();
    });

    drawTasks();
  }

  function setupFacts() {
    const area = document.getElementById("key-facts");
    const status = document.getElementById("facts-status");
    const key = `studyPawsFacts_${activeSubject}`;

    try {
      area.value = localStorage.getItem(key) || "";
    } catch {}

    document.getElementById("save-facts").addEventListener("click", () => {
      try {
        localStorage.setItem(key, area.value);
        status.textContent = "Key facts saved! ♡";
      } catch {
        status.textContent = "Sorry, the facts could not be saved.";
      }
    });
  }

  function setupPractice() {
    const prompts = [
      "What are the three most important things you learned?",
      "Can you explain today's topic without looking at your notes?",
      "What is one example that proves you understand this topic?",
      "What part would you like to practise again?"
    ];

    document.getElementById("reveal-practice")
      .addEventListener("click", () => {
        const prompt = prompts[Math.floor(Math.random() * prompts.length)];
        document.getElementById("practice-prompt").textContent = prompt;
      });
  }
})();
