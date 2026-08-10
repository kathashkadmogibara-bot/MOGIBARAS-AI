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
  addDoc,
  updateDoc
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================
   FIREBASE
========================= */

const firebaseConfig = {
  apiKey: "AIzaSyCRcdy0OcGMINNR35WX8-kvOjfP4LfqWzI",
  authDomain: "mogibara-ai.firebaseapp.com",
  projectId: "mogibara-ai",
  storageBucket: "mogibara-ai.firebasestorage.app",
  messagingSenderId: "940458573012",
  appId: "1:940458573012:web:4c8b8e80bfab3cdd224f41",
  measurementId: "G-ZVTHCPQMZJ"
};

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

let currentUser = null;


/* =========================
   AUTH UI
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
  document.getElementById("authMessage").textContent = text;
}

function clearAuthMessage() {
  authMessage("");
}


/* =========================
   REGISTER
========================= */

window.register = async function () {

  const name =
    document.getElementById("regName").value.trim();

  const age =
    document.getElementById("regAge").value.trim();

  const city =
    document.getElementById("regCity").value.trim();

  const anime =
    document.getElementById("regAnime").value.trim();

  const email =
    document.getElementById("regEmail").value.trim();

  const password =
    document.getElementById("regPassword").value;


  if (!name || !email || !password) {
    authMessage("Name, email and password are required.");
    return;
  }

  if (password.length < 6) {
    authMessage("Password must be at least 6 characters.");
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
        createdAt: new Date().toISOString()
      }
    );


    authMessage("Account created successfully!");


  } catch (error) {

    console.error("REGISTER ERROR:", error);

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
      .value
      .trim();

  const password =
    document.getElementById("loginPassword")
      .value;


  if (!email || !password) {
    authMessage("Enter your email and password.");
    return;
  }


  try {

    authMessage("Logging in...");


    const result =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );


    console.log(
      "LOGIN SUCCESS:",
      result.user.email,
      result.user.uid
    );


    authMessage("Login successful!");


  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error.code,
      error.message
    );


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

    console.error("LOGOUT ERROR:", error);

  }
};


/* =========================
   AUTH STATE
========================= */

onAuthStateChanged(
  auth,
  async user => {

    console.log(
      "AUTH STATE:",
      user ? user.email : "Not logged in"
    );


    if (user) {

      currentUser = user;


      document.getElementById("authScreen")
        .hidden = true;

      document.getElementById("app")
        .hidden = false;


      await showProfile();


      const messages =
        document.getElementById("messages");


      if (messages.children.length === 0) {

        addMessage(
          "bot",
          "Hello! I am Mogibara-AI 🤖"
        );

      }


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


  try {

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


  } catch (error) {

    console.error(
      "PROFILE ERROR:",
      error
    );

    document.getElementById(
      "profileInfo"
    ).textContent =
      "Could not load profile.";

  }
};


/* =========================
   QUESTION ID
========================= */

function encodeQuestion(question) {

  return btoa(
    unescape(
      encodeURIComponent(question)
    )
  )
  .replaceAll("/", "_")
  .replaceAll("+", "-")
  .replaceAll("=", "");

}


/* =========================
   FIND KNOWLEDGE
========================= */

async function findKnowledge(question) {

  const reference =
    doc(
      db,
      "knowledge",
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
   SAVE KNOWLEDGE
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
      "knowledge",
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
          updatedAt: new Date().toISOString()
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
        createdAt: new Date().toISOString()
      }
    );

  }
}


/* =========================
   SEND MESSAGE
========================= */

window.sendMessage = async function () {

  if (!currentUser) {
    authMessage("Please login first.");
    return;
  }


  const input =
    document.getElementById(
      "messageInput"
    );


  const originalQuestion =
    input.value.trim();


  if (!originalQuestion) return;


  const question =
    originalQuestion.toLowerCase();


  input.value = "";


  addMessage(
    "user",
    originalQuestion
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
        originalQuestion,
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
        "knowledge",
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
      originalQuestion,
      reply
    );


  } catch (error) {

    console.error(
      "CHAT ERROR:",
      error
    );


    addMessage(
      "bot",
      "Something went wrong. Please try again."
    );

  }
};


/* =========================
   ENTER
========================= */

window.handleEnter =
function (event) {

  if (event.key === "Enter") {
    sendMessage();
  }

};


/* =========================
   MESSAGE
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
    document.createElement(
      "div"
    );


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

  if (!currentUser) {
    alert("Please login first.");
    return;
  }


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

    console.error(
      "TEACH ERROR:",
      error
    );


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
   MASTER PANEL
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


/* =========================
   MASTER MESSAGE
========================= */

window.showUsers =
function () {

  const box =
    document.getElementById(
      "masterContent"
    );


  box.innerHTML = `

    <h2>👤 Users</h2>

    <div class="record">
      Firebase Security Rules currently
      allow each user to access only their
      own profile.
    </div>

  `;

};


window.showKnowledge =
function () {

  const box =
    document.getElementById(
      "masterContent"
    );


  box.innerHTML = `

    <h2>🧠 Knowledge</h2>

    <div class="record">
      Knowledge is stored online in Firebase.
    </div>

  `;

};


window.showTraining =
function () {

  const box =
    document.getElementById(
      "masterContent"
    );


  box.innerHTML = `

    <h2>📚 Training</h2>

    <div class="record">
      Training records are stored securely
      for the logged-in user.
    </div>

  `;

};


window.showStats =
function () {

  const box =
    document.getElementById(
      "masterContent"
    );


  box.innerHTML = `

    <h2>📊 Statistics</h2>

    <div class="record">
      Mogibara-AI is connected to Firebase.
    </div>

  `;

};


/* =========================
   ERROR HANDLER
========================= */

function getFriendlyError(error) {

  switch (error.code) {

    case "auth/invalid-credential":
      return "Email or password is incorrect.";

    case "auth/invalid-login-credentials":
      return "Email or password is incorrect.";

    case "auth/user-not-found":
      return "No account found with this email.";

    case "auth/wrong-password":
      return "Incorrect password.";

    case "auth/invalid-email":
      return "Invalid email address.";

    case "auth/email-already-in-use":
      return "This email already has an account.";

    case "auth/weak-password":
      return "Password must be at least 6 characters.";

    case "auth/network-request-failed":
      return "Internet connection problem.";

    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";

    case "auth/user-disabled":
      return "This account has been disabled.";

    case "auth/operation-not-allowed":
      return "Email/Password login is not enabled in Firebase.";

    default:
      return error.message ||
        "Something went wrong.";
  }
}


/* =========================
   HTML SECURITY
========================= */

function escapeHTML(value) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    String(value);


  return div.innerHTML;

  }
