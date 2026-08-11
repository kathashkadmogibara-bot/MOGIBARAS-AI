import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
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
  updateDoc,
  deleteDoc,
  getDocs
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

const googleProvider =
  new GoogleAuthProvider();

let currentUser = null;
let skippedUser = false;


/* =========================
   MASTER CONTROL
========================= */

const MASTER_PASSWORD = "GOAT404M";

let masterUnlocked = false;


/* =========================
   AUTH SCREEN
========================= */

window.showRegister = function () {

  document.getElementById("loginBox").hidden = true;

  document.getElementById("registerBox").hidden = false;

  authMessage("");
};


window.showLogin = function () {

  document.getElementById("loginBox").hidden = false;

  document.getElementById("registerBox").hidden = true;

  authMessage("");
};


function authMessage(text) {

  document.getElementById(
    "authMessage"
  ).textContent = text;
}


/* =========================
   CREATE ACCOUNT
========================= */

window.register = async function () {

  const username =
    document.getElementById(
      "regUsername"
    ).value.trim();

  const email =
    document.getElementById(
      "regEmail"
    ).value.trim();

  const password =
    document.getElementById(
      "regPassword"
    ).value;

  const age =
    document.getElementById(
      "regAge"
    ).value.trim();

  const city =
    document.getElementById(
      "regCity"
    ).value.trim();

  const gender =
    document.getElementById(
      "regGender"
    ).value;

  const anime =
    document.getElementById(
      "regAnime"
    ).value.trim();


  if (!username || !email || !password) {

    authMessage(
      "Username, email and password are required."
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

    authMessage(
      "Creating account..."
    );


    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


    await setDoc(
      doc(
        db,
        "users",
        result.user.uid
      ),
      {
        uid: result.user.uid,

        username: username,

        email: email,

        age: age,

        city: city,

        gender: gender,

        favoriteAnime: anime,

        createdAt:
          new Date().toISOString()
      }
    );


    authMessage(
      "Account created successfully! You are now logged in."
    );


  } catch (error) {

    console.error(error);

    authMessage(
      friendlyError(error)
    );
  }
};


/* =========================
   EMAIL LOGIN
========================= */

window.login = async function () {

  const loginValue =
    document.getElementById(
      "loginUsername"
    ).value.trim();

  const password =
    document.getElementById(
      "loginPassword"
    ).value;


  if (!loginValue || !password) {

    authMessage(
      "Enter your email and password."
    );

    return;
  }


  try {

    authMessage(
      "Logging in..."
    );


    /*
      Firebase Email/Password login
      requires EMAIL, not username.
    */

    await signInWithEmailAndPassword(
      auth,
      loginValue,
      password
    );


  } catch (error) {

    console.error(error);

    authMessage(
      friendlyError(error)
    );
  }
};


/* =========================
   GOOGLE LOGIN
========================= */

window.googleLogin = async function () {

  try {

    authMessage(
      "Opening Google login..."
    );


    const result =
      await signInWithPopup(
        auth,
        googleProvider
      );


    const userRef =
      doc(
        db,
        "users",
        result.user.uid
      );


    const profile =
      await getDoc(userRef);


    if (!profile.exists()) {

      await setDoc(
        userRef,
        {
          uid:
            result.user.uid,

          username:
            result.user.displayName ||
            "Google User",

          email:
            result.user.email || "",

          age: "",

          city: "",

          gender: "",

          favoriteAnime: "",

          provider: "google",

          createdAt:
            new Date().toISOString()
        }
      );
    }


  } catch (error) {

    console.error(error);

    authMessage(
      friendlyError(error)
    );
  }
};


/* =========================
   SKIP LOGIN
========================= */

window.skipLogin = function () {

  skippedUser = true;

  currentUser = null;

  masterUnlocked = false;


  document.getElementById(
    "authScreen"
  ).hidden = true;

  document.getElementById(
    "app"
  ).hidden = false;


  addMessage(
    "bot",
    "You are using Mogibara-AI as a guest. 👋"
  );


  addMessage(
    "bot",
    "Login anytime to save your profile and training."
  );
};


/* =========================
   LOGOUT
========================= */

window.logout = async function () {

  try {

    masterUnlocked = false;


    if (skippedUser) {

      skippedUser = false;

      currentUser = null;


      document.getElementById(
        "authScreen"
      ).hidden = false;

      document.getElementById(
        "app"
      ).hidden = true;


      document.getElementById(
        "loginBox"
      ).hidden = false;

      document.getElementById(
        "registerBox"
      ).hidden = true;


      authMessage("");

      return;
    }


    await signOut(auth);


  } catch (error) {

    console.error(error);

    authMessage(
      "Logout failed: " +
      error.message
    );
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

      skippedUser = false;

      masterUnlocked = false;


      document.getElementById(
        "authScreen"
      ).hidden = true;

      document.getElementById(
        "app"
      ).hidden = false;


      await showProfile();


      const messages =
        document.getElementById(
          "messages"
        );


      if (messages.children.length === 0) {

        addMessage(
          "bot",
          "Hello! I am Mogibara-AI 🤖"
        );
      }


    } else {

      currentUser = null;

      masterUnlocked = false;


      document.getElementById(
        "authScreen"
      ).hidden = false;

      document.getElementById(
        "app"
      ).hidden = true;


      document.getElementById(
        "loginBox"
      ).hidden = false;

      document.getElementById(
        "registerBox"
      ).hidden = true;


      authMessage("");
    }

  }
);


/* =========================
   PROFILE
========================= */

window.showProfile = async function () {

  if (!currentUser) {

    document.getElementById(
      "profileInfo"
    ).textContent = "Guest mode";

    return;
  }


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
      document.getElementById(
        "profileInfo"
      );


    if (!snapshot.exists()) {

      box.textContent =
        "Profile not found.";

      return;
    }


    const p =
      snapshot.data();


    box.innerHTML = `

      <p>
        <b>Username:</b>
        ${escapeHTML(p.username || "")}
      </p>

      <p>
        <b>Email:</b>
        ${escapeHTML(p.email || "")}
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
        <b>Gender:</b>
        ${escapeHTML(p.gender || "")}
      </p>

      <p>
        <b>Favorite Anime:</b>
        ${escapeHTML(
          p.favoriteAnime || ""
        )}
      </p>

    `;


  } catch (error) {

    console.error(error);

    document.getElementById(
      "profileInfo"
    ).textContent =
      "Could not load profile.";
  }
};


/* =========================
   CHAT
========================= */

window.sendMessage = async function () {

  const input =
    document.getElementById(
      "messageInput"
    );


  const original =
    input.value.trim();


  if (!original) return;


  input.value = "";


  addMessage(
    "user",
    original
  );


  const command =
    original.toLowerCase();


  /* =========================
     MASTER COMMAND
  ========================= */

  if (command === "/master") {

    if (!currentUser) {

      addMessage(
        "bot",
        "Master access requires login. 🔐"
      );

      return;
    }


    if (masterUnlocked) {

      addMessage(
        "bot",
        "Master Control is already unlocked. 🔓"
      );

      showMasterMenu();

      return;
    }


    const password =
      prompt(
        "Enter Master Control password:"
      );


    if (password === null) {

      addMessage(
        "bot",
        "Master Control login cancelled."
      );

      return;
    }


    if (password !== MASTER_PASSWORD) {

      addMessage(
        "bot",
        "❌ Wrong Master Control password."
      );

      return;
    }


    masterUnlocked = true;


    addMessage(
      "bot",
      "✅ Master Control unlocked. 🔓"
    );


    showMasterMenu();

    return;
  }


  /* =========================
     MEMORY COMMAND
  ========================= */

  if (command === "/memory") {

    if (!currentUser) {

      addMessage(
        "bot",
        "Memory access requires login. 🔐"
      );

      return;
    }


    if (!masterUnlocked) {

      addMessage(
        "bot",
        "🔒 Memory is protected. Use /master first."
      );

      return;
    }


    showMemory();

    return;
  }


  /* =========================
     NORMAL CHAT
  ========================= */

  try {

    const knowledge =
      await findKnowledge(
        command
      );


    if (!knowledge) {

      const reply =
        "I don't know that yet. You can teach me using the Teach AI section. 🧠";


      addMessage(
        "bot",
        reply
      );


      if (currentUser) {

        await saveHistory(
          original,
          reply
        );
      }


      return;
    }


    const answers =
      Array.isArray(
        knowledge.answers
      )
        ? knowledge.answers
        : [];


    if (answers.length === 0) {

      addMessage(
        "bot",
        "I don't know the answer yet."
      );

      return;
    }


    const reply =
      answers[
        Math.floor(
          Math.random() *
          answers.length
        )
      ];


    addMessage(
      "bot",
      reply
    );


    if (currentUser) {

      await saveHistory(
        original,
        reply
      );
    }


  } catch (error) {

    console.error(error);

    addMessage(
      "bot",
      "Something went wrong."
    );
  }
};


/* =========================
   MASTER MENU
========================= */

function showMasterMenu() {

  if (!masterUnlocked) {

    addMessage(
      "bot",
      "Master Control is locked. 🔒"
    );

    return;
  }


  addMessage(
    "bot",
`========== MASTER CONTROL ==========

1. Show Memory
2. Search Memory
3. Rewrite Answer
4. Delete Answer
5. Delete Question
6. Add Answer
7. Statistics
8. Advanced Stats
9. Export Memory
10. Import Memory
11. Clear Memory
12. User Profile
13. Exit
14. Stop Master Control

====================================

Type /mastermenu to open the menu again.
Type /memory to view memory.
Type /stopmaster to lock Master Control.`
  );
}


/* =========================
   MASTER COMMANDS
========================= */

async function handleMasterCommand(
  command
) {

  if (!masterUnlocked) {

    addMessage(
      "bot",
      "🔒 Master Control is locked."
    );

    return;
  }


  if (command === "/mastermenu") {

    showMasterMenu();

    return;
  }


  if (command === "/stopmaster") {

    masterUnlocked = false;

    addMessage(
      "bot",
      "🛑 Master Control stopped and locked."
    );

    return;
  }


  if (command === "/showmemory") {

    await showMemory();

    return;
  }


  if (command === "/stats") {

    await showStats();

    return;
  }
}


/* =========================
   MASTER COMMAND ROUTER
========================= */

const originalSendMessage =
  window.sendMessage;

window.sendMessage =
async function () {

  const input =
    document.getElementById(
      "messageInput"
    );


  const original =
    input.value.trim();


  if (
    masterUnlocked &&
    original.toLowerCase() !== "/master"
  ) {

    const command =
      original.toLowerCase();


    if (
      command === "/mastermenu" ||
      command === "/stopmaster" ||
      command === "/showmemory" ||
      command === "/stats"
    ) {

      input.value = "";

      addMessage(
        "user",
        original
      );

      await handleMasterCommand(
        command
      );

      return;
    }
  }


  await originalSendMessage();
};


/* =========================
   SHOW MEMORY
========================= */

async function showMemory() {

  if (!masterUnlocked) {

    addMessage(
      "bot",
      "🔒 Memory is protected."
    );

    return;
  }


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "knowledge"
        )
      );


    if (snapshot.empty) {

      addMessage(
        "bot",
        "🧠 No memory found."
      );

      return;
    }


    let output =
      "========== MEMORY ==========\n\n";


    snapshot.forEach(
      item => {

        const data =
          item.data();


        output +=
          "Question: " +
          (data.question || "") +
          "\n";


        const answers =
          Array.isArray(
            data.answers
          )
            ? data.answers
            : [];


        answers.forEach(
          (answer, index) => {

            output +=
              `${index + 1}. ${answer}\n`;
          }
        );


        output += "\n";
      }
    );


    output +=
      "============================";


    addMessage(
      "bot",
      output
    );


  } catch (error) {

    console.error(error);

    addMessage(
      "bot",
      "Could not load memory: " +
      error.message
    );
  }
}


/* =========================
   STATISTICS
========================= */

async function showStats() {

  if (!masterUnlocked) {

    addMessage(
      "bot",
      "🔒 Master access required."
    );

    return;
  }


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "knowledge"
        )
      );


    let questions = 0;
    let answers = 0;


    snapshot.forEach(
      item => {

        questions++;


        const data =
          item.data();


        if (
          Array.isArray(
            data.answers
          )
        ) {

          answers +=
            data.answers.length;
        }
      }
    );


    addMessage(
      "bot",
`====== MEMORY STATS ======

Questions : ${questions}
Answers   : ${answers}

==========================`
    );


  } catch (error) {

    console.error(error);

    addMessage(
      "bot",
      "Could not load statistics."
    );
  }
}


/* =========================
   ENTER
========================= */

window.handleEnter =
function(event) {

  if (event.key === "Enter") {

    sendMessage();

  }

};


/* =========================
   ADD MESSAGE
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


  box.appendChild(
    message
  );


  box.scrollTop =
    box.scrollHeight;
}


/* =========================
   FIND MEMORY
========================= */

async function findKnowledge(
  question
) {

  const id =
    encodeQuestion(
      question
    );


  const reference =
    doc(
      db,
      "knowledge",
      id
    );


  const snapshot =
    await getDoc(
      reference
    );


  if (!snapshot.exists()) {

    return null;
  }


  return snapshot.data();
}


/* =========================
   TEACH AI
========================= */

window.teachAI =
async function () {

  if (!currentUser) {

    alert(
      "Please login to teach the AI."
    );

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
      "Mogibara-AI learned it! 🧠"
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
   SAVE KNOWLEDGE
========================= */

async function saveKnowledge(
  question,
  answer
) {

  const reference =
    doc(
      db,
      "knowledge",
      encodeQuestion(
        question
      )
    );


  const snapshot =
    await getDoc(
      reference
    );


  if (snapshot.exists()) {

    const data =
      snapshot.data();


    const answers =
      Array.isArray(
        data.answers
      )
        ? data.answers
        : [];


    if (!answers.includes(answer)) {

      answers.push(answer);


      await updateDoc(
        reference,
        {
          answers:
            answers,

          updatedAt:
            new Date().toISOString()
        }
      );
    }


  } else {

    await setDoc(
      reference,
      {
        question:
          question,

        answers:
          [answer],

        used:
          0,

        createdAt:
          new Date().toISOString()
      }
    );
  }
}


/* =========================
   SAVE HISTORY
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
   ENCODE QUESTION
========================= */

function encodeQuestion(
  question
) {

  return btoa(
    unescape(
      encodeURIComponent(
        question
      )
    )
  )
  .replaceAll(
    "/",
    "_"
  )
  .replaceAll(
    "+",
    "-"
  )
  .replaceAll(
    "=",
    ""
  );
}


/* =========================
   HTML SECURITY
========================= */

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


/* =========================
   FIREBASE ERRORS
========================= */

function friendlyError(
  error
) {

  switch (error.code) {

    case "auth/invalid-credential":
      return "Wrong email or password.";

    case "auth/invalid-login-credentials":
      return "Wrong email or password.";

    case "auth/user-not-found":
      return "Account not found.";

    case "auth/wrong-password":
      return "Wrong password.";

    case "auth/email-already-in-use":
      return "This email already has an account.";

    case "auth/invalid-email":
      return "Invalid email.";

    case "auth/weak-password":
      return "Password must be at least 6 characters.";

    case "auth/popup-closed-by-user":
      return "Google login was cancelled.";

    case "auth/popup-blocked":
      return "Google login popup was blocked.";

    case "auth/operation-not-allowed":
      return "This login method is not enabled in Firebase.";

    case "auth/network-request-failed":
      return "Internet connection problem.";

    default:
      return error.message ||
        "Something went wrong.";
  }
  }
