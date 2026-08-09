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
  query,
  orderBy
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================
   FIREBASE
========================= */

const firebaseConfig = {

  apiKey:
    "AIzaSyCRcdy0OcGMINNR35WX8-kvOjfP4LfqWzI",

  authDomain:
    "mogibara-ai.firebaseapp.com",

  projectId:
    "mogibara-ai",

  storageBucket:
    "mogibara-ai.firebasestorage.app",

  messagingSenderId:
    "940458573012",

  appId:
    "1:940458573012:web:4c8b8e80bfab3cdd224f41",

  measurementId:
    "G-ZVTHCPQMZJ"
};


const firebaseApp =
  initializeApp(firebaseConfig);

const auth =
  getAuth(firebaseApp);

const db =
  getFirestore(firebaseApp);


let currentUser = null;


/* =========================
   AUTH SCREEN
========================= */

window.showRegister = function () {

  document.getElementById("loginBox").hidden = true;
  document.getElementById("registerBox").hidden = false;

  clearAuthMessage();

};


window.showLogin = function () {

  document.getElementById("loginBox").hidden = false;
  document.getElementById("registerBox").hidden = true;

  clearAuthMessage();

};


function authMessage(text) {

  document.getElementById("authMessage")
    .textContent = text;

}


function clearAuthMessage() {

  authMessage("");

}


/* =========================
   CREATE ACCOUNT
========================= */

window.register = async function () {

  const name =
    document.getElementById("regName")
      .value.trim();

  const age =
    document.getElementById("regAge")
      .value.trim();

  const city =
    document.getElementById("regCity")
      .value.trim();

  const anime =
    document.getElementById("regAnime")
      .value.trim();

  const email =
    document.getElementById("regEmail")
      .value.trim();

  const password =
    document.getElementById("regPassword")
      .value;


  if (!name || !email || !password) {

    authMessage(
      "Name, email and password are required."
    );

    return;
  }


  if (password.length < 6) {

    authMessage(
      "Password must be at least 6 characters."
    );

    return;
  }


  try {

    authMessage("Creating account...");


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

        createdAt:
          new Date().toISOString()

      }
    );


    authMessage(
      "Account created successfully!"
    );


  } catch (error) {

    console.error(error);

    authMessage(
      getFriendlyError(error)
    );

  }

};


/* =========================
   LOGIN
========================= */

window.login = async function () {

  const email =
    document.getElementById("loginEmail")
      .value.trim();

  const password =
    document.getElementById("loginPassword")
      .value;


  if (!email || !password) {

    authMessage(
      "Enter your email and password."
    );

    return;
  }


  try {

    authMessage("Logging in...");


    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );


  } catch (error) {

    console.error(error);

    authMessage(
      getFriendlyError(error)
    );

  }

};


/* =========================
   LOGOUT
========================= */

window.logout = async function () {

  try {

    await signOut(auth);

  } catch (error) {

    console.error(error);

  }

};


/* =========================
   AUTH STATE
========================= */

onAuthStateChanged(
  auth,
  async user => {

    if (user) {

      currentUser = user;

      document.getElementById("authScreen")
        .hidden = true;

      document.getElementById("app")
        .hidden = false;


      await showProfile();

      addMessage(
        "bot",
        "Hello! I am Mogibara-AI 🤖"
      );


    } else {

      currentUser = null;

      document.getElementById("authScreen")
        .hidden = false;

      document.getElementById("app")
        .hidden = true;

      document.getElementById("masterPanel")
        .hidden = true;

    }

  }
);


/* =========================
   PROFILE
========================= */

window.showProfile = async function () {

  if (!currentUser) return;


  const snapshot =
    await getDoc(
      doc(
        db,
        "users",
        currentUser.uid
      )
    );


  const box =
    document.getElementById("profileInfo");


  if (!snapshot.exists()) {

    box.textContent =
      "Profile not found.";

    return;
  }


  const p =
    snapshot.data();


  box.innerHTML = `

    <p>
      <b>Name:</b>
      ${escapeHTML(p.name || "")}
    </p>

    <p>
      <b>Age:</b>
      ${escapeHTML(p.age || "")}
    </p>

    <p>
      <b>City:</b>
      ${escapeHTML(p.city || "")}
    </p>

    <p>
      <b>Favorite Anime:</b>
      ${escapeHTML(p.favoriteAnime || "")}
    </p>

    <p>
      <b>Email:</b>
      ${escapeHTML(p.email || "")}
    </p>

  `;

};


/* =========================
   FIND AI KNOWLEDGE
========================= */

async function findKnowledge(question) {

  const reference =
    doc(
      db,
      "aiKnowledge",
      encodeQuestion(question)
    );


  const snapshot =
    await getDoc(reference);


  if (!snapshot.exists()) {

    return null;

  }


  return snapshot.data();

}


/* =========================
   SAVE AI KNOWLEDGE
========================= */

async function saveKnowledge(
  question,
  answer
) {

  const id =
    encodeQuestion(question);


  const reference =
    doc(
      db,
      "aiKnowledge",
      id
    );


  const snapshot =
    await getDoc(reference);


  if (snapshot.exists()) {

    const data =
      snapshot.data();


    const answers =
      Array.isArray(data.answers)
        ? data.answers
        : [];


    if (!answers.includes(answer)) {

      answers.push(answer);


      await updateDoc(
        reference,
        {

          answers: answers,

          updatedAt:
            new Date().toISOString()

        }
      );

    }


  } else {

    await setDoc(
      reference,
      {

        question: question,

        answers: [answer],

        used: 0,

        createdAt:
          new Date().toISOString()

      }
    );

  }

}


/* =========================
   CHAT
========================= */

window.sendMessage = async function () {

  if (!currentUser) return;


  const input =
    document.getElementById(
      "messageInput"
    );


  const question =
    input.value
      .trim()
      .toLowerCase();


  if (!question) return;


  input.value = "";


  addMessage(
    "user",
    question
  );


  try {

    const data =
      await findKnowledge(question);


    if (!data) {

      const reply =
        "I don't know that yet. You can teach me using the Teach AI section. 🧠";


      addMessage(
        "bot",
        reply
      );


      await saveHistory(
        question,
        reply
      );


      return;
    }


    const answers =
      Array.isArray(data.answers)
        ? data.answers
        : [];


    if (answers.length === 0) {

      addMessage(
        "bot",
        "I don't know the answer yet."
      );

      return;
    }


    let reply;


    if (answers.length === 1) {

      reply = answers[0];

    } else {

      const available =
        answers.filter(
          answer =>
            answer !== data.last
        );


      const list =
        available.length
          ? available
          : answers;


      reply =
        list[
          Math.floor(
            Math.random() * list.length
          )
        ];

    }


    await updateDoc(
      doc(
        db,
        "aiKnowledge",
        encodeQuestion(question)
      ),
      {

        used:
          (data.used || 0) + 1,

        last:
          reply

      }
    );


    addMessage(
      "bot",
      reply
    );


    await saveHistory(
      question,
      reply
    );


  } catch (error) {

    console.error(error);

    addMessage(
      "bot",
      "Something went wrong. Please try again."
    );

  }

};


/* =========================
   ENTER KEY
========================= */

window.handleEnter =
function (event) {

  if (event.key === "Enter") {

    sendMessage();

  }

};


/* =========================
   DISPLAY MESSAGE
========================= */

function addMessage(
  type,
  text
) {

  const box =
    document.getElementById(
      "messages"
    );


  const message =
    document.createElement("div");


  message.className =
    "message " + type;


  message.textContent =
    type === "user"
      ? "You: " + text
      : "Bot: " + text;


  box.appendChild(message);


  box.scrollTop =
    box.scrollHeight;

}


/* =========================
   TEACH AI
========================= */

window.teachAI = async function () {

  if (!currentUser) return;


  const question =
    document.getElementById(
      "teachQuestion"
    )
    .value
    .trim()
    .toLowerCase();


  const answer =
    document.getElementById(
      "teachAnswer"
    )
    .value
    .trim();


  if (!question || !answer) {

    alert(
      "Enter both question and answer."
    );

    return;
  }


  try {

    await saveKnowledge(
      question,
      answer
    );


    await addDoc(
      collection(
        db,
        "trainingRecords"
      ),
      {

        userId:
          currentUser.uid,

        userEmail:
          currentUser.email,

        question:
          question,

        answer:
          answer,

        time:
          new Date().toISOString()

      }
    );


    document.getElementById(
      "teachQuestion"
    ).value = "";


    document.getElementById(
      "teachAnswer"
    ).value = "";


    alert(
      "Mogibara-AI learned something new! 🧠"
    );


  } catch (error) {

    console.error(error);

    alert(
      "Training failed: " +
      error.message
    );

  }

};


/* =========================
   HISTORY
========================= */

async function saveHistory(
  userMessage,
  botMessage
) {

  if (!currentUser) return;


  await addDoc(
    collection(
      db,
      "history"
    ),
    {

      userId:
        currentUser.uid,

      user:
        userMessage,

      bot:
        botMessage,

      time:
        new Date().toISOString()

    }
  );

}


/* =========================
   MASTER
========================= */

window.openMaster =
function () {

  document.getElementById(
    "masterPanel"
  ).hidden = false;

};


window.closeMaster =
function () {

  document.getElementById(
    "masterPanel"
  ).hidden = true;

};


/*
   IMPORTANT:
   Real admin protection is handled
   by Firestore Security Rules.
*/

window.showUsers =
async function () {

  const box =
    document.getElementById(
      "masterContent"
    );


  box.innerHTML =
    "<h2>👤 Users</h2>";


  const snapshot =
    await getDocs(
      collection(
        db,
        "users"
      )
    );


  snapshot.forEach(
    userDoc => {

      const data =
        userDoc.data();


      const div =
        document.createElement(
          "div"
        );


      div.className =
        "record";


      div.innerHTML = `

        <b>Name:</b>
        ${escapeHTML(data.name || "")}

        <br>

        <b>Email:</b>
        ${escapeHTML(data.email || "")}

        <br>

        <b>City:</b>
        ${escapeHTML(data.city || "")}

        <br>

        <b>Anime:</b>
        ${escapeHTML(
          data.favoriteAnime || ""
        )}

      `;


      box.appendChild(div);

    }
  );

};


window.showKnowledge =
async function () {

  const box =
    document.getElementById(
      "masterContent"
    );


  box.innerHTML =
    "<h2>🧠 AI Knowledge</h2>";


  const snapshot =
    await getDocs(
      collection(
        db,
        "aiKnowledge"
      )
    );


  snapshot.forEach(
    knowledgeDoc => {

      const data =
        knowledgeDoc.data();


      const div =
        document.createElement(
          "div"
        );


      div.className =
        "record";


      const answers =
        Array.isArray(data.answers)
          ? data.answers
          : [];


      div.innerHTML = `

        <b>Question:</b>
        ${escapeHTML(
          data.question || ""
        )}

        <br><br>

        <b>Answers:</b>

        <ul>

          ${answers.map(
            answer =>
              `<li>${escapeHTML(answer)}</li>`
          ).join("")}

        </ul>

        <b>Used:</b>
        ${data.used || 0}

      `;


      box.appendChild(div);

    }
  );

};


window.showTraining =
async function () {

  const box =
    document.getElementById(
      "masterContent"
    );


  box.innerHTML =
    "<h2>📚 Training Records</h2>";


  const snapshot =
    await getDocs(
      collection(
        db,
        "trainingRecords"
      )
    );


  snapshot.forEach(
    trainingDoc => {

      const data =
        trainingDoc.data();


      const div =
        document.createElement(
          "div"
        );


      div.className =
        "record";


      div.innerHTML = `

        <b>User:</b>
        ${escapeHTML(
          data.userEmail || ""
        )}

        <br>

        <b>Question:</b>
        ${escapeHTML(
          data.question || ""
        )}

        <br>

        <b>Answer:</b>
        ${escapeHTML(
          data.answer || ""
        )}

        <br>

        <b>Time:</b>
        ${escapeHTML(
          data.time || ""
        )}

      `;


      box.appendChild(div);

    }
  );

};


/* =========================
   STATISTICS
========================= */

window.showStats =
async function () {

  const box =
    document.getElementById(
      "masterContent"
    );


  box.innerHTML =
    "<h2>📊 Statistics</h2>";


  const users =
    await getDocs(
      collection(
        db,
        "users"
      )
    );


  const knowledge =
    await getDocs(
      collection(
        db,
        "aiKnowledge"
      )
    );


  const training =
    await getDocs(
      collection(
        db,
        "trainingRecords"
      )
    );


  let totalAnswers = 0;


  knowledge.forEach(
    item => {

      const answers =
        item.data().answers;


      if (Array.isArray(answers)) {

        totalAnswers +=
          answers.length;

      }

    }
  );


  box.innerHTML = `

    <h2>📊 Statistics</h2>

    <div class="record">

      <b>Users:</b>
      ${users.size}

      <br>

      <b>Questions:</b>
      ${knowledge.size}

      <br>

      <b>Answers:</b>
      ${totalAnswers}

      <br>

      <b>Training Records:</b>
      ${training.size}

    </div>

  `;

};


/* =========================
   HELPERS
========================= */

function encodeQuestion(
  question
) {

  return btoa(
    unescape(
      encodeURIComponent(question)
    )
  )
  .replaceAll("/", "_")
  .replaceAll("+", "-")
  .replaceAll("=", "");

}


function escapeHTML(
  value
) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    String(value);


  return div.innerHTML;

}


function getFriendlyError(
  error
) {

  switch (
    error.code
  ) {

    case "auth/email-already-in-use":
      return "This email already has an account.";

    case "auth/invalid-email":
      return "Invalid email address.";

    case "auth/invalid-credential":
      return "Wrong email or password.";

    case "auth/weak-password":
      return "Password is too weak.";

    case "auth/network-request-failed":
      return "Internet connection problem.";

    default:
      return error.message || "Something went wrong.";

  }

}
