import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyCRcdy0OcGMINNR35WX8-kvOjfP4LfqWzI",
  authDomain: "mogibara-ai.firebaseapp.com",
  projectId: "mogibara-ai",
  storageBucket: "mogibara-ai.firebasestorage.app",
  messagingSenderId: "940458573012",
  appId: "1:940458573012:web:4c8b8e80bfab3cdd224f41",
  measurementId: "G-ZVTHCPQMZJ"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;


/* =========================
   AUTH
========================= */

window.showRegister = function () {

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("registerBox").style.display = "block";

};


window.showLogin = function () {

  document.getElementById("loginBox").style.display = "block";
  document.getElementById("registerBox").style.display = "none";

};


window.register = async function () {

  const name = document.getElementById("regName").value.trim();
  const age = document.getElementById("regAge").value.trim();
  const city = document.getElementById("regCity").value.trim();
  const anime = document.getElementById("regAnime").value.trim();

  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;

  if (!name || !email || !password) {
    alert("Name, email and password are required.");
    return;
  }

  try {

    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    await setDoc(
      doc(db, "users", result.user.uid),
      {
        uid: result.user.uid,
        name: name,
        age: age,
        city: city,
        favoriteAnime: anime,
        email: email,
        createdAt: new Date().toISOString()
      }
    );

    alert("Account created!");

  } catch (error) {

    alert(error.message);

  }

};


window.login = async function () {

  const email =
    document.getElementById("loginEmail").value.trim();

  const password =
    document.getElementById("loginPassword").value;

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  } catch (error) {

    alert(error.message);

  }

};


window.logout = async function () {

  await signOut(auth);

};


/* =========================
   AUTH STATE
========================= */

onAuthStateChanged(auth, async user => {

  if (user) {

    currentUser = user;

    document.getElementById("authScreen").style.display = "none";
    document.getElementById("app").style.display = "block";

    await showProfile();

    addMessage(
      "bot",
      "Hello! I am Mogibara-AI 🤖"
    );

  } else {

    currentUser = null;

    document.getElementById("authScreen").style.display = "block";
    document.getElementById("app").style.display = "none";

  }

});


/* =========================
   PROFILE
========================= */

window.showProfile = async function () {

  if (!currentUser) return;

  const snap =
    await getDoc(
      doc(db, "users", currentUser.uid)
    );

  if (!snap.exists()) {

    document.getElementById("profileInfo").innerHTML =
      "Profile not found.";

    return;

  }

  const p = snap.data();

  document.getElementById("profileInfo").innerHTML = `

    <p><b>Name:</b> ${escapeHTML(p.name || "")}</p>

    <p><b>Age:</b> ${escapeHTML(p.age || "")}</p>

    <p><b>City:</b> ${escapeHTML(p.city || "")}</p>

    <p><b>Favorite Anime:</b>
    ${escapeHTML(p.favoriteAnime || "")}</p>

    <p><b>Email:</b>
    ${escapeHTML(p.email || "")}</p>

  `;

};


/* =========================
   AI KNOWLEDGE
========================= */

async function findKnowledge(question) {

  const ref =
    doc(db, "aiKnowledge", question);

  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return snap.data();

}


async function saveKnowledge(question, answer) {

  const ref =
    doc(db, "aiKnowledge", question);

  const snap = await getDoc(ref);

  if (snap.exists()) {

    const data = snap.data();

    if (!data.answers.includes(answer)) {

      data.answers.push(answer);

      await updateDoc(ref, {
        answers: data.answers,
        updatedAt: new Date().toISOString()
      });

    }

  } else {

    await setDoc(ref, {

      question: question,

      answers: [answer],

      used: 0,

      createdAt: new Date().toISOString()

    });

  }

}


/* =========================
   CHAT
========================= */

window.sendMessage = async function () {

  const input =
    document.getElementById("messageInput");

  const question =
    input.value.trim().toLowerCase();

  if (!question) return;

  input.value = "";

  addMessage("user", question);

  const data =
    await findKnowledge(question);

  if (!data) {

    addMessage(
      "bot",
      "I don't know that yet. You can teach me below. 🧠"
    );

    await saveHistory(
      question,
      "I don't know that yet."
    );

    return;

  }

  if (!data.answers || data.answers.length === 0) {

    addMessage(
      "bot",
      "I don't know the answer yet."
    );

    return;

  }

  let answers = data.answers;

  let reply =
    answers[Math.floor(Math.random() * answers.length)];

  await updateDoc(
    doc(db, "aiKnowledge", question),
    {
      used: (data.used || 0) + 1
    }
  );

  addMessage("bot", reply);

  await saveHistory(question, reply);

};


window.handleEnter = function (event) {

  if (event.key === "Enter") {
    sendMessage();
  }

};


function addMessage(type, text) {

  const box =
    document.getElementById("messages");

  const div =
    document.createElement("div");

  div.className =
    "message " + type;

  div.textContent =
    (type === "user" ? "You: " : "Bot: ") + text;

  box.appendChild(div);

  box.scrollTop = box.scrollHeight;

}


/* =========================
   TRAIN AI
========================= */

window.teachAI = async function () {

  if (!currentUser) return;

  const question =
    document.getElementById("teachQuestion")
      .value.trim().toLowerCase();

  const answer =
    document.getElementById("teachAnswer")
      .value.trim();

  if (!question || !answer) {

    alert("Enter question and answer.");

    return;

  }

  await saveKnowledge(question, answer);

  await addDoc(
    collection(db, "trainingRecords"),
    {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      question: question,
      answer: answer,
      time: new Date().toISOString()
    }
  );

  document.getElementById("teachQuestion").value = "";
  document.getElementById("teachAnswer").value = "";

  alert("Mogibara-AI learned something new! 🧠");

};


/* =========================
   HISTORY
========================= */

async function saveHistory(userMessage, botMessage) {

  if (!currentUser) return;

  await addDoc(
    collection(db, "history"),
    {
      userId: currentUser.uid,
      user: userMessage,
      bot: botMessage,
      time: new Date().toISOString()
    }
  );

}


/* =========================
   MASTER CONTROL
========================= */

window.openMaster = function () {

  document.getElementById("masterPanel")
    .style.display = "block";

};


window.closeMaster = function () {

  document.getElementById("masterPanel")
    .style.display = "none";

};


/*
IMPORTANT:
Master permissions should NOT be protected
by a password inside JavaScript.

Firebase Security Rules should decide
who is actually an admin.
*/


window.showUsers = async function () {

  const box =
    document.getElementById("masterContent");

  box.innerHTML = "<h2>👤 Users</h2>";

  const snapshot =
    await getDocs(collection(db, "users"));

  snapshot.forEach(docSnap => {

    const p = docSnap.data();

    const div =
      document.createElement("div");

    div.className = "record";

    div.innerHTML = `

      <b>Name:</b> ${escapeHTML(p.name || "")}<br>
      <b>Email:</b> ${escapeHTML(p.email || "")}<br>
      <b>City:</b> ${escapeHTML(p.city || "")}<br>
      <b>Anime:</b>
      ${escapeHTML(p.favoriteAnime || "")}<br>
      <b>Created:</b>
      ${escapeHTML(p.createdAt || "")}

    `;

    box.appendChild(div);

  });

};


window.showKnowledge = async function () {

  const box =
    document.getElementById("masterContent");

  box.innerHTML = "<h2>🧠 AI Knowledge</h2>";

  const snapshot =
    await getDocs(collection(db, "aiKnowledge"));

  snapshot.forEach(docSnap => {

    const data = docSnap.data();

    const div =
      document.createElement("div");

    div.className = "record";

    div.innerHTML = `

      <b>Question:</b>
      ${escapeHTML(data.question || "")}

      <br><br>

      <b>Answers:</b>

      <ul>

        ${(data.answers || [])
          .map(a =>
            `<li>${escapeHTML(a)}</li>`
          )
          .join("")}

      </ul>

      <b>Used:</b> ${data.used || 0}

    `;

    box.appendChild(div);

  });

};


window.showTraining = async function () {

  const box =
    document.getElementById("masterContent");

  box.innerHTML =
    "<h2>📚 Training Records</h2>";

  const snapshot =
    await getDocs(
      collection(db, "trainingRecords")
    );

  snapshot.forEach(docSnap => {

    const d = docSnap.data();

    const div =
      document.createElement("div");

    div.className = "record";

    div.innerHTML = `

      <b>User:</b>
      ${escapeHTML(d.userEmail || "")}

      <br>

      <b>Question:</b>
      ${escapeHTML(d.question || "")}

      <br>

      <b>Answer:</b>
      ${escapeHTML(d.answer || "")}

      <br>

      <b>Time:</b>
      ${escapeHTML(d.time || "")}

    `;

    box.appendChild(div);

  });

};


/* =========================
   SECURITY HELPER
========================= */

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent = String(text);

  return div.innerHTML;

}
