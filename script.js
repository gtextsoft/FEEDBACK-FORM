(function () {
  var form = document.getElementById("bgc-feedback");
  if (!form) return;

  var questions = [
    { id: "q1", names: ["overall_experience"], message: "Select a rating for your overall experience." },
    { id: "q2", names: ["expectations"], message: "Say whether the event met, exceeded, or fell short of your expectations." },
    { id: "q3", names: ["recommend_likelihood"], message: "Choose how likely you are to recommend BGC UK, from 0 to 10." },
    { id: "q4", names: ["message"], message: "Write your single biggest takeaway or moment." },
    { id: "q5", names: ["content_relevance"], message: "Rate how relevant and actionable the content was." },
    { id: "q6", names: ["enjoyed_most"], message: "Say what you enjoyed most." },
    { id: "q7", names: ["networking_satisfaction"], message: "Rate the networking opportunities." },
    { id: "q8", names: ["business_connections"], message: "Say whether you connected with clients, partners, or mentors." },
    {
      id: "q9",
      names: ["venue", "seating_comfort", "av_quality", "atmosphere"],
      message: "Rate the venue, seating comfort, audio-visual quality, and atmosphere."
    },
    { id: "q10", names: ["registration_experience"], message: "Rate registration and pre-event communication." },
    { id: "q11", names: ["event_pacing"], message: "Say how you found the pacing." },
    { id: "q12", names: ["improvements"], message: "Tell us what to improve for future editions." },
    { id: "q13", names: ["future_topics"], message: "Tell us what you want at the next BGC UK." },
    { id: "q14", names: ["future_attendance"], message: "Choose Yes, No, or Maybe for future events." }
  ];

  var progressCount = document.getElementById("progress-count");
  var progressBar = document.getElementById("progress-bar");
  var progressRoot = document.getElementById("progress");
  var summary = document.getElementById("form-error");
  var allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp", "pdf", "txt", "csv", "docx"];

  form.noValidate = true;

  function valueOf(name) {
    var fields = form.querySelectorAll('[name="' + name + '"]');
    if (!fields.length) return "";
    if (fields[0].type === "radio") {
      var checked = form.querySelector('[name="' + name + '"]:checked');
      return checked ? checked.value : "";
    }
    return fields[0].value.trim();
  }

  function questionById(id) {
    for (var i = 0; i < questions.length; i++) {
      if (questions[i].id === id) return questions[i];
    }
    return null;
  }

  function isAnswered(question) {
    for (var i = 0; i < question.names.length; i++) {
      if (!valueOf(question.names[i])) return false;
    }
    return true;
  }

  function updateProgress() {
    var done = 0;
    for (var i = 0; i < questions.length; i++) {
      if (isAnswered(questions[i])) done += 1;
    }
    if (progressCount) progressCount.textContent = String(done);
    if (progressBar) progressBar.style.width = (done / questions.length) * 100 + "%";
    if (progressRoot) progressRoot.setAttribute("aria-valuenow", String(done));

    var links = document.querySelectorAll(".section-nav a");
    for (var n = 0; n < links.length; n++) {
      var ids = (links[n].getAttribute("data-questions") || "").split(",");
      var complete = ids.length > 0;
      for (var k = 0; k < ids.length; k++) {
        var spec = questionById(ids[k]);
        if (!spec || !isAnswered(spec)) complete = false;
      }
      links[n].classList.toggle("is-done", complete);
    }
  }

  function clearField(id) {
    var field = document.getElementById(id);
    var error = document.getElementById(id + "-error");
    if (field) field.removeAttribute("aria-invalid");
    if (error) {
      error.hidden = true;
      error.textContent = "";
    }
  }

  function showFieldError(id, message) {
    var field = document.getElementById(id);
    var error = document.getElementById(id + "-error");
    if (field) field.setAttribute("aria-invalid", "true");
    if (error) {
      error.hidden = false;
      error.textContent = message;
    }
  }

  function fileError() {
    var input = form.querySelector('[name="attachment"]');
    if (!input || !input.files || !input.files.length || input.files[0].size === 0) return "";
    var name = input.files[0].name || "";
    var dot = name.lastIndexOf(".");
    var ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
    if (allowedExtensions.indexOf(ext) === -1) {
      return "Use a JPG, JPEG, PNG, GIF, WebP, PDF, TXT, CSV, or DOCX file.";
    }
    return "";
  }

  function validate() {
    var problems = [];
    if (summary) {
      summary.hidden = true;
      summary.textContent = "";
    }

    for (var i = 0; i < questions.length; i++) {
      var question = questions[i];
      if (isAnswered(question)) {
        clearField(question.id);
        if (question.id === "q9") {
          for (var s = 0; s < question.names.length; s++) {
            var doneSub = form.querySelector('[data-name="' + question.names[s] + '"]');
            if (doneSub) doneSub.removeAttribute("aria-invalid");
          }
        }
        continue;
      }
      problems.push(question.message);
      showFieldError(question.id, question.message);
      if (question.id === "q9") {
        for (var m = 0; m < question.names.length; m++) {
          var sub = form.querySelector('[data-name="' + question.names[m] + '"]');
          if (!sub) continue;
          if (valueOf(question.names[m])) sub.removeAttribute("aria-invalid");
          else sub.setAttribute("aria-invalid", "true");
        }
      }
    }

    var email = form.querySelector('[name="email"]');
    if (email) email.value = email.value.trim();
    if (!email || !email.value || !email.checkValidity()) {
      var emailMessage = "Enter a valid email address.";
      problems.push(emailMessage);
      showFieldError("email-field", emailMessage);
    } else {
      clearField("email-field");
    }

    var attachmentMessage = fileError();
    if (attachmentMessage) {
      problems.push(attachmentMessage);
      showFieldError("attachment-field", attachmentMessage);
    } else {
      clearField("attachment-field");
    }

    if (!problems.length) return true;

    if (summary) {
      summary.hidden = false;
      summary.textContent = problems.length === 1
        ? problems[0]
        : "Answer the remaining " + problems.length + " items before sending.";
    }

    var first = form.querySelector('[aria-invalid="true"]');
    if (first) {
      var control = first.matches("input, textarea, select")
        ? first
        : first.querySelector("input, textarea, select");
      if (control) control.focus();
      else if (summary) summary.focus();
    } else if (summary) {
      summary.focus();
    }
    return false;
  }

  form.addEventListener("submit", function (event) {
    var trap = form.querySelector('[name="website"]');
    if (trap && trap.value) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (!validate()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  form.addEventListener("input", function (event) {
    if (summary && !summary.hidden) summary.hidden = true;
    var holder = event.target.closest(".question, .field");
    if (holder && holder.id === "q9") {
      var venue = questionById("q9");
      if (venue) {
        for (var s = 0; s < venue.names.length; s++) {
          var sub = form.querySelector('[data-name="' + venue.names[s] + '"]');
          if (sub && valueOf(venue.names[s])) sub.removeAttribute("aria-invalid");
        }
      }
    }
    if (holder && holder.id === "email-field") {
      var email = form.querySelector('[name="email"]');
      if (email && email.value.trim() && email.checkValidity()) clearField("email-field");
    }
    if (holder && holder.id.indexOf("q") === 0) {
      var spec = questionById(holder.id);
      if (spec && isAnswered(spec)) clearField(holder.id);
    }
    updateProgress();
  });

  form.addEventListener("change", updateProgress);

  var areas = form.querySelectorAll("textarea[maxlength]");
  for (var a = 0; a < areas.length; a++) {
    (function (area) {
      var out = form.querySelector('[data-count-for="' + area.name + '"]');
      var update = function () {
        if (out) out.textContent = String(area.value.length);
      };
      area.addEventListener("input", update);
      update();
    })(areas[a]);
  }

  var sections = document.querySelectorAll("main section[id]");
  var links = document.querySelectorAll(".section-nav a");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        for (var i = 0; i < links.length; i++) {
          links[i].classList.toggle("is-current", links[i].getAttribute("href") === "#" + entry.target.id);
        }
      });
    }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });
    for (var p = 0; p < sections.length; p++) observer.observe(sections[p]);
  }

  updateProgress();
})();
