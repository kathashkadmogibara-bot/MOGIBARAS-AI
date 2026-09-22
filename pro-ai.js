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
  getDocs,
  query,
  where
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   FIREBASE
===================================================== */

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

const googleProvider =
  new GoogleAuthProvider();


/* =====================================================
   APP VARIABLES
===================================================== */

let currentUser = null;

let skippedUser = false;

let masterAuthenticated = false;

let chatMode = "normal";

let proHistory = [];


/*
   PRO AI training cache.

   Firebase data is loaded when needed.
*/
let proTrainingData = [];

let proTrainingLoaded = false;


/* =====================================================
   MASTER PASSWORD
===================================================== */

const MASTER_PASSWORD =
  "GOAT404M";


/* =====================================================
   CHAT MODE
===================================================== */

window.setChatMode =
function(mode) {

  if (
    mode !== "normal" &&
    mode !== "pro"
  ) {
    return;
  }


  if (
    mode === "pro" &&
    !currentUser
  ) {

    addMessage(
      "bot",
      "⚡ PRO AI requires login. Please login first."
    );

    return;
  }


  chatMode = mode;


  const normalButton =
    document.getElementById(
      "normalModeBtn"
    );

  const proButton =
    document.getElementById(
      "proModeBtn"
    );

  const status =
    document.getElementById(
      "modeStatus"
    );


  normalButton.classList.toggle(
    "active",
    mode === "normal"
  );

  proButton.classList.toggle(
    "active",
    mode === "pro"
  );


  if (mode === "normal") {

    status.textContent =
      "🤖 Normal Mode — Firebase knowledge";

    addMessage(
      "bot",
      "🤖 Normal Mode activated."
    );

  } else {

    status.textContent =
      "⚡ PRO AI Mode — Firebase Pattern Learning";

    addMessage(
      "bot",
      "⚡ PRO AI activated. Firebase training data se patterns learn karunga."
    );

    loadProTrainingData();

  }

};


/* =====================================================
   AUTH SCREEN
===================================================== */

window.showRegister =
function() {

  document.getElementById(
    "loginBox"
  ).hidden = true;

  document.getElementById(
    "registerBox"
  ).hidden = false;

  authMessage("");

};


window.showLogin =
function() {

  document.getElementById(
    "loginBox"
  ).hidden = false;

  document.getElementById(
    "registerBox"
  ).hidden = true;

  authMessage("");

};


function authMessage(text) {

  const box =
    document.getElementById(
      "authMessage"
    );

  if (box) {
    box.textContent = text;
  }

}


/* =====================================================
   CREATE ACCOUNT
===================================================== */

window.register =
async function() {

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


  if (
    !username ||
    !email ||
    !password
  ) {

    authMessage(
      "Username, email and password are required."
    );

    return;
  }


  if (
    password.length < 6
  ) {

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

        uid:
          result.user.uid,

        username:
          username,

        usernameLower:
          username.toLowerCase(),

        email:
          email,

        age:
          age,

        city:
          city,

        gender:
          gender,

        favoriteAnime:
          anime,

        provider:
          "email",

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
      friendlyError(error)
    );

  }

};


/* =====================================================
   FIND EMAIL FROM USERNAME
===================================================== */

async function resolveLoginEmail(
  loginValue
) {

  if (
    loginValue.includes("@")
  ) {

    return loginValue;

  }


  const usernameQuery =
    query(
      collection(
        db,
        "users"
      ),
      where(
        "usernameLower",
        "==",
        loginValue.toLowerCase()
      )
    );


  const snapshot =
    await getDocs(
      usernameQuery
    );


  if (
    snapshot.empty
  ) {

    return null;

  }


  return (
    snapshot.docs[0].data().email ||
    null
  );

}


/* =====================================================
   LOGIN
===================================================== */

window.login =
async function() {

  const loginValue =
    document.getElementById(
      "loginUsername"
    ).value.trim();

  const password =
    document.getElementById(
      "loginPassword"
    ).value;


  if (
    !loginValue ||
    !password
  ) {

    authMessage(
      "Enter username/email and password."
    );

    return;
  }


  try {

    authMessage(
      "Logging in..."
    );


    const email =
      await resolveLoginEmail(
        loginValue
      );


    if (!email) {

      authMessage(
        "Username or email not found."
      );

      return;
    }


    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );


    authMessage("");


  } catch (error) {

    console.error(error);

    authMessage(
      friendlyError(error)
    );

  }

};


/* =====================================================
   GOOGLE LOGIN
===================================================== */

window.googleLogin =
async function() {

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
      await getDoc(
        userRef
      );


    if (!profile.exists()) {

      const displayName =
        result.user.displayName ||
        "Google User";


      await setDoc(
        userRef,
        {

          uid:
            result.user.uid,

          username:
            displayName,

          usernameLower:
            displayName.toLowerCase(),

          email:
            result.user.email || "",

          age:
            "",

          city:
            "",

          gender:
            "",

          favoriteAnime:
            "",

          provider:
            "google",

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


/* =====================================================
   SKIP LOGIN
===================================================== */

window.skipLogin =
function() {

  skippedUser = true;

  currentUser = null;

  masterAuthenticated = false;

  chatMode = "normal";

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
    "Login anytime to save your profile and use PRO AI."
  );

};


/* =====================================================
   LOGOUT
===================================================== */

window.logout =
async function() {

  try {

    masterAuthenticated = false;

    proHistory = [];

    proTrainingData = [];

    proTrainingLoaded = false;

    chatMode = "normal";


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


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(
  auth,
  async user => {

    if (user) {

      currentUser = user;

      skippedUser = false;

      masterAuthenticated = false;

      chatMode = "normal";

      proHistory = [];

      proTrainingData = [];

      proTrainingLoaded = false;


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


      if (
        messages.children.length === 0
      ) {

        addMessage(
          "bot",
          "Hello! I am Mogibara-AI 🤖"
        );

      }


    } else {

      currentUser = null;

      masterAuthenticated = false;


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


/* =====================================================
   PROFILE
===================================================== */

window.showProfile =
async function() {

  const box =
    document.getElementById(
      "profileInfo"
    );


  if (!currentUser) {

    box.textContent =
      "Guest mode";

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
        ${escapeHTML(p.favoriteAnime || "")}
      </p>

    `;


  } catch (error) {

    console.error(error);

    box.textContent =
      "Could not load profile.";

  }

};


/* =====================================================
   MAIN CHAT
===================================================== */

window.sendMessage =
async function() {

  const input =
    document.getElementById(
      "messageInput"
    );


  const original =
    input.value.trim();


  if (!original) {
    return;
  }


  input.value = "";


  addMessage(
    "user",
    original
  );


  /*
     PRO MODE
  */

  if (
    chatMode === "pro"
  ) {

    await sendProMessage(
      original
    );

    return;
  }


  /*
     NORMAL MODE
  */

  const command =
    original.toLowerCase().trim();


  if (
    command === "/master"
  ) {

    await openMasterControl();

    return;
  }


  if (
    command === "/memory"
  ) {

    if (!currentUser) {

      addMessage(
        "bot",
        "Memory access requires login. 🔐"
      );

      return;
    }


    if (!masterAuthenticated) {

      const success =
        await masterLogin();


      if (!success) {
        return;
      }

    }


    await showMemory();

    return;
  }


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


    if (
      answers.length === 0
    ) {

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


/* =====================================================
   PRO AI
   FIREBASE PATTERN ENGINE
===================================================== */

async function sendProMessage(
  userMessage
) {

  if (!currentUser) {

    addMessage(
      "bot",
      "⚡ Please login before using PRO AI."
    );

    return;
  }


  const thinking =
    addMessage(
      "bot",
      "⚡ PRO AI is learning patterns..."
    );


  thinking.classList.add(
    "thinking"
  );


  try {

    await loadProTrainingData();


    const result =
      findBestPattern(
        userMessage,
        proTrainingData
      );


    thinking.remove();


    if (!result) {

      const reply =
        "⚡ I don't have enough learned data for this yet. Teach me with the Teach AI section.";


      addMessage(
        "bot",
        reply
      );


      await saveProConversation(
        userMessage,
        reply,
        0
      );

      return;
    }


    const reply =
      result.answer;


    addMessage(
      "bot",
      reply
    );


    await saveProConversation(
      userMessage,
      reply,
      result.confidence
    );


  } catch (error) {

    console.error(
      "PRO Pattern AI error:",
      error
    );


    thinking.remove();


    addMessage(
      "bot",
      "⚠️ PRO AI could not read Firebase training data."
    );

  }

}


/* =====================================================
   LOAD PRO TRAINING DATA
===================================================== */

async function loadProTrainingData() {

  if (proTrainingLoaded) {
    return;
  }


  const snapshot =
    await getDocs(
      collection(
        db,
        "trainingRecords"
      )
    );


  proTrainingData = [];


  snapshot.forEach(
    item => {

      const data =
        item.data();


      if (
        data.question &&
        data.answer
      ) {

        proTrainingData.push({

          question:
            String(
              data.question
            ),

          answer:
            String(
              data.answer
            ),

          userId:
            data.userId || "",

          time:
            data.time || ""

        });

      }

    }
  );


  proTrainingLoaded = true;


  console.log(
    "PRO training records:",
    proTrainingData.length
  );

}


/* =====================================================
   PATTERN ENGINE
===================================================== */

function findBestPattern(
  input,
  records
) {

  if (
    !records ||
    records.length === 0
  ) {

    return null;
  }


  const inputWords =
    tokenize(input);


  if (
    inputWords.length === 0
  ) {

    return null;
  }


  let best =
    null;


  for (
    const record of records
  ) {

    const questionWords =
      tokenize(
        record.question
      );


    const score =
      calculateSimilarity(
        inputWords,
        questionWords,
        input,
        record.question
      );


    if (
      !best ||
      score > best.score
    ) {

      best = {

        answer:
          record.answer,

        score:
          score,

        question:
          record.question

      };

    }

  }


  if (!best) {
    return null;
  }


  /*
     Convert similarity into
     a readable confidence value.
  */

  const confidence =
    Math.round(
      Math.min(
        1,
        best.score
      ) * 100
    );


  /*
     Very weak matches are rejected.
  */

  if (
    confidence < 25
  ) {

    return null;
  }


  return {

    answer:
      best.answer,

    confidence:
      confidence,

    matchedQuestion:
      best.question

  };

}


/* =====================================================
   TOKENIZER
===================================================== */

function tokenize(text) {

  return String(text)
    .toLowerCase()
    .replace(
      /[^\p{L}\p{N}\s]/gu,
      " "
    )
    .split(/\s+/)
    .filter(
      word =>
        word.length > 1
    );

}


/* =====================================================
   SIMILARITY
===================================================== */

function calculateSimilarity(
  inputWords,
  questionWords,
  inputText,
  questionText
) {

  if (
    questionWords.length === 0
  ) {

    return 0;
  }


  const inputSet =
    new Set(
      inputWords
    );


  const questionSet =
    new Set(
      questionWords
    );


  let common =
    0;


  for (
    const word of inputSet
  ) {

    if (
      questionSet.has(
        word
      )
    ) {

      common++;

    }

  }


  const union =
    new Set([
      ...inputSet,
      ...questionSet
    ]);


  const jaccard =
    union.size
      ? common / union.size
      : 0;


  const coverage =
    questionSet.size
      ? common / questionSet.size
      : 0;


  const phraseBonus =
    inputText
      .toLowerCase()
      .includes(
        questionText.toLowerCase()
      )
        ? 0.35
        : 0;


  /*
     Weighted pattern score.
  */

  return (
    jaccard * 0.55 +
    coverage * 0.45 +
    phraseBonus
  );

}


/* =====================================================
   SAVE PRO CONVERSATION
===================================================== */

async function saveProConversation(
  question,
  answer,
  confidence
) {

  if (!currentUser) {
    return;
  }


  await saveHistory(
    question,
    answer
  );


  /*
     Save useful interaction data.
  */

  await addDoc(
    collection(
      db,
      "proInteractions"
    ),
    {

      userId:
        currentUser.uid,

      question:
        question,

      answer:
        answer,

      confidence:
        confidence,

      time:
        new Date().toISOString()

    }
  );

}


/* =====================================================
   ENTER
===================================================== */

window.handleEnter =
function(event) {

  if (
    event.key === "Enter" &&
    !event.shiftKey
  ) {

    event.preventDefault();

    sendMessage();

  }

};


/* =====================================================
   ADD MESSAGE
===================================================== */

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


  return message;

}


/* =====================================================
   FIND KNOWLEDGE
===================================================== */

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


  if (
    !snapshot.exists()
  ) {

    return null;
  }


  return snapshot.data();

}


/* =====================================================
   TEACH AI
===================================================== */

window.teachAI =
async function() {

  if (!currentUser) {

    alert(
      "Please login to teach the AI."
    );

    return;
  }


  const question =
    document.getElementById(
      "teachQuestion"
    ).value.trim().toLowerCase();


  const answer =
    document.getElementById(
      "teachAnswer"
    ).value.trim();


  if (
    !question ||
    !answer
  ) {

    alert(
      "Enter both question and answer."
    );

    return;
  }


  try {

    /*
       Normal memory
    */

    await saveKnowledge(
      question,
      answer
    );


    /*
       PRO training data
    */

    await addDoc(
      collection(
        db,
        "trainingRecords"
      ),
      {

        userId:
          currentUser.uid,

        userEmail:
          currentUser.email || "",

        question:
          question,

        answer:
          answer,

        time:
          new Date().toISOString()

      }
    );


    /*
       Refresh local PRO model
    */

    proTrainingLoaded = false;

    proTrainingData = [];


    document.getElementById(
      "teachQuestion"
    ).value = "";


    document.getElementById(
      "teachAnswer"
    ).value = "";


    alert(
      "Mogibara-AI learned it! 🧠\n\nNormal + PRO training updated."
    );


  } catch (error) {

    console.error(error);


    alert(
      "Training failed: " +
      error.message
    );

  }

};


/* =====================================================
   SAVE KNOWLEDGE
===================================================== */

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


  if (
    snapshot.exists()
  ) {

    const data =
      snapshot.data();


    const answers =
      Array.isArray(
        data.answers
      )
        ? [...data.answers]
        : [];


    if (
      !answers.includes(
        answer
      )
    ) {

      answers.push(
        answer
      );


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


/* =====================================================
   SAVE HISTORY
===================================================== */

async function saveHistory(
  userMessage,
  botMessage
) {

  if (!currentUser) {
    return;
  }


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


/* =====================================================
   MASTER LOGIN
===================================================== */

async function masterLogin() {

  if (!currentUser) {

    addMessage(
      "bot",
      "Master Control requires login. 🔐"
    );

    return false;
  }


  const password =
    prompt(
      "🔐 MASTER CONTROL\n\nEnter Master Password:"
    );


  if (
    password === null
  ) {

    addMessage(
      "bot",
      "Master Control cancelled."
    );

    return false;
  }


  if (
    password !== MASTER_PASSWORD
  ) {

    addMessage(
      "bot",
      "❌ Wrong Master Password."
    );

    return false;
  }


  masterAuthenticated = true;


  addMessage(
    "bot",
    "✅ Master Control access granted."
  );


  return true;

}


/* =====================================================
   OPEN MASTER CONTROL
===================================================== */

async function openMasterControl() {

  if (!currentUser) {

    addMessage(
      "bot",
      "Master access requires login. 🔐"
    );

    return;
  }


  if (
    !masterAuthenticated
  ) {

    const success =
      await masterLogin();


    if (!success) {
      return;
    }

  }


  await masterMenu();

}


/* =====================================================
   MASTER MENU
===================================================== */

async function masterMenu() {

  while (
    masterAuthenticated
  ) {

    const choice =
      prompt(
`
========== MOGIBARA MASTER CONTROL ==========

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
13. PRO Training Statistics
14. Logout Master Control
15. Stop Master Control

===============================================

Enter menu number:
`
      );


    if (
      choice === null
    ) {

      masterAuthenticated =
        false;

      addMessage(
        "bot",
        "🛑 Master Control stopped."
      );

      break;
    }


    switch (
      choice.trim()
    ) {

      case "1":
        await showMemory();
        break;

      case "2":
        await searchMemory();
        break;

      case "3":
        await rewriteAnswer();
        break;

      case "4":
        await deleteAnswer();
        break;

      case "5":
        await deleteQuestion();
        break;

      case "6":
        await addAnswer();
        break;

      case "7":
        await memoryStats();
        break;

      case "8":
        await advancedStats();
        break;

      case "9":
        await exportMemory();
        break;

      case "10":
        await importMemory();
        break;

      case "11":
        await clearMemory();
        break;

      case "12":
        await showProfile();

        alert(
          "User profile is displayed in the Profile section."
        );

        break;

      case "13":
        await proTrainingStats();
        break;

      case "14":

        masterAuthenticated =
          false;

        addMessage(
          "bot",
          "🔓 Master Control logged out."
        );

        break;

      case "15":

        masterAuthenticated =
          false;

        addMessage(
          "bot",
          "🛑 Master Control stopped."
        );

        break;

      default:

        alert(
          "Invalid choice.\nPlease enter a number from 1 to 15."
        );

    }

  }

}


/* =====================================================
   PRO TRAINING STATISTICS
===================================================== */

async function proTrainingStats() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "trainingRecords"
      )
    );


  const interactionSnapshot =
    await getDocs(
      collection(
        db,
        "proInteractions"
      )
    );


  const uniqueQuestions =
    new Set();


  snapshot.forEach(
    item => {

      const data =
        item.data();

      if (data.question) {

        uniqueQuestions.add(
          String(
            data.question
          ).toLowerCase()
        );

      }

    }
  );


  alert(
`
====== PRO AI STATISTICS ======

Training Records : ${snapshot.size}
Unique Questions : ${uniqueQuestions.size}
PRO Interactions : ${interactionSnapshot.size}

Pattern Engine   : JavaScript
Data Source      : Firebase
Gemini API       : Not Used

===============================
`
  );

}


/* =====================================================
   SHOW MEMORY
===================================================== */

async function showMemory() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "knowledge"
      )
    );


  if (
    snapshot.empty
  ) {

    alert(
      "No memory found."
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
        (
          data.question || ""
        ) +
        "\n";


      const answers =
        Array.isArray(
          data.answers
        )
          ? data.answers
          : [];


      answers.forEach(
        (
          answer,
          index
        ) => {

          output +=
            `${index + 1}. ${answer}\n`;

        }
      );


      output +=
        "Used: " +
        (
          data.used || 0
        ) +
        "\n";


      output +=
        "----------------------------\n";

    }
  );


  output +=
    "\n============================";


  alert(output);

}


/* =====================================================
   SEARCH MEMORY
===================================================== */

async function searchMemory() {

  const word =
    prompt(
      "🔎 Search Memory:"
    );


  if (
    word === null ||
    !word.trim()
  ) {
    return;
  }


  const search =
    word.toLowerCase().trim();


  const snapshot =
    await getDocs(
      collection(
        db,
        "knowledge"
      )
    );


  let output =
    "========== RESULTS ==========\n\n";


  let found = false;


  snapshot.forEach(
    item => {

      const data =
        item.data();


      const question =
        (
          data.question || ""
        ).toLowerCase();


      if (
        question.includes(search)
      ) {

        found = true;


        output +=
          "Question: " +
          data.question +
          "\n";


        const answers =
          Array.isArray(
            data.answers
          )
            ? data.answers
            : [];


        answers.forEach(
          (
            answer,
            index
          ) => {

            output +=
              `${index + 1}. ${answer}\n`;

          }
        );


        output +=
          "----------------------------\n";

      }

    }
  );


  if (!found) {

    output +=
      "Nothing Found.\n";

  }


  output +=
    "\n=============================";


  alert(output);

}


/* =====================================================
   GET QUESTION DOCUMENT
===================================================== */

async function getQuestionDocument() {

  const question =
    prompt(
      "Enter exact question:"
    );


  if (
    question === null ||
    !question.trim()
  ) {

    return null;
  }


  const cleanQuestion =
    question.trim().toLowerCase();


  const reference =
    doc(
      db,
      "knowledge",
      encodeQuestion(
        cleanQuestion
      )
    );


  const snapshot =
    await getDoc(
      reference
    );


  if (
    !snapshot.exists()
  ) {

    alert(
      "Question not found."
    );

    return null;
  }


  return {

    question:
      cleanQuestion,

    reference:
      reference,

    data:
      snapshot.data()

  };

}


/* =====================================================
   REWRITE ANSWER
===================================================== */

async function rewriteAnswer() {

  const item =
    await getQuestionDocument();


  if (!item) {
    return;
  }


  const answers =
    Array.isArray(
      item.data.answers
    )
      ? [...item.data.answers]
      : [];


  if (
    answers.length === 0
  ) {

    alert(
      "No answers found."
    );

    return;
  }


  let list =
    "Answers:\n\n";


  answers.forEach(
    (
      answer,
      index
    ) => {

      list +=
        `${index + 1}. ${answer}\n`;

    }
  );


  const number =
    prompt(
      list +
      "\nEnter answer number to rewrite:"
    );


  if (
    number === null
  ) {
    return;
  }


  const index =
    Number(number) - 1;


  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= answers.length
  ) {

    alert(
      "Invalid answer number."
    );

    return;
  }


  const newAnswer =
    prompt(
      "Enter new answer:",
      answers[index]
    );


  if (
    newAnswer === null ||
    !newAnswer.trim()
  ) {
    return;
  }


  answers[index] =
    newAnswer.trim();


  await updateDoc(
    item.reference,
    {

      answers:
        answers,

      updatedAt:
        new Date().toISOString()

    }
  );


  alert(
    "✅ Answer updated successfully."
  );

}


/* =====================================================
   DELETE ANSWER
===================================================== */

async function deleteAnswer() {

  const item =
    await getQuestionDocument();


  if (!item) {
    return;
  }


  const answers =
    Array.isArray(
      item.data.answers
    )
      ? [...item.data.answers]
      : [];


  if (
    answers.length === 0
  ) {

    alert(
      "No answers found."
    );

    return;
  }


  let list =
    "Answers:\n\n";


  answers.forEach(
    (
      answer,
      index
    ) => {

      list +=
        `${index + 1}. ${answer}\n`;

    }
  );


  const number =
    prompt(
      list +
      "\nEnter answer number to DELETE:"
    );


  if (
    number === null
  ) {
    return;
  }


  const index =
    Number(number) - 1;


  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= answers.length
  ) {

    alert(
      "Invalid answer number."
    );

    return;
  }


  const confirmDelete =
    confirm(
      "Delete this answer?\n\n" +
      answers[index]
    );


  if (!confirmDelete) {
    return;
  }


  answers.splice(
    index,
    1
  );


  if (
    answers.length === 0
  ) {

    await deleteDoc(
      item.reference
    );

  } else {

    await updateDoc(
      item.reference,
      {

        answers:
          answers,

        updatedAt:
          new Date().toISOString()

      }
    );

  }


  alert(
    "✅ Answer deleted successfully."
  );

}


/* =====================================================
   DELETE QUESTION
===================================================== */

async function deleteQuestion() {

  const item =
    await getQuestionDocument();


  if (!item) {
    return;
  }


  const confirmDelete =
    confirm(
      "Delete this question and ALL its answers?\n\n" +
      item.question
    );


  if (!confirmDelete) {
    return;
  }


  await deleteDoc(
    item.reference
  );


  alert(
    "✅ Question deleted successfully."
  );

}


/* =====================================================
   ADD ANSWER
===================================================== */

async function addAnswer() {

  const item =
    await getQuestionDocument();


  if (!item) {
    return;
  }


  const answer =
    prompt(
      "Enter new answer:"
    );


  if (
    answer === null ||
    !answer.trim()
  ) {
    return;
  }


  const answers =
    Array.isArray(
      item.data.answers
    )
      ? [...item.data.answers]
      : [];


  if (
    answers.includes(
      answer.trim()
    )
  ) {

    alert(
      "Answer already exists."
    );

    return;
  }


  answers.push(
    answer.trim()
  );


  await updateDoc(
    item.reference,
    {

      answers:
        answers,

      updatedAt:
        new Date().toISOString()

    }
  );


  alert(
    "✅ Answer added successfully."
  );

}


/* =====================================================
   MEMORY STATISTICS
===================================================== */

async function memoryStats() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "knowledge"
      )
    );


  let totalQuestions = 0;

  let totalAnswers = 0;

  let totalUsed = 0;


  snapshot.forEach(
    item => {

      const data =
        item.data();


      totalQuestions++;


      const answers =
        Array.isArray(
          data.answers
        )
          ? data.answers
          : [];


      totalAnswers +=
        answers.length;


      totalUsed +=
        Number(
          data.used || 0
        );

    }
  );


  alert(
`
====== MEMORY STATS ======

Questions : ${totalQuestions}
Answers   : ${totalAnswers}
Times Used: ${totalUsed}

==========================
`
  );

}


/* =====================================================
   ADVANCED STATS
===================================================== */

async function advancedStats() {

  const memorySnapshot =
    await getDocs(
      collection(
        db,
        "knowledge"
      )
    );


  const historySnapshot =
    await getDocs(
      collection(
        db,
        "history"
      )
    );


  let questions = 0;

  let answers = 0;

  let used = 0;

  let longest = "";


  memorySnapshot.forEach(
    item => {

      const data =
        item.data();


      const question =
        data.question || "";


      questions++;


      const questionAnswers =
        Array.isArray(
          data.answers
        )
          ? data.answers
          : [];


      answers +=
        questionAnswers.length;


      used +=
        Number(
          data.used || 0
        );


      if (
        question.length >
        longest.length
      ) {

        longest = question;

      }

    }
  );


  alert(
`
====== ADVANCED STATS ======

Questions        : ${questions}
Answers          : ${answers}
Times Used       : ${used}
History Records  : ${historySnapshot.size}

Longest Question:
${longest || "None"}

============================
`
  );

}


/* =====================================================
   EXPORT MEMORY
===================================================== */

async function exportMemory() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "knowledge"
      )
    );


  const memoryData = {};


  snapshot.forEach(
    item => {

      memoryData[item.id] =
        item.data();

    }
  );


  const json =
    JSON.stringify(
      memoryData,
      null,
      2
    );


  const blob =
    new Blob(
      [json],
      {
        type:
          "application/json"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href = url;

  link.download =
    "mogibara-memory-backup.json";


  link.click();


  URL.revokeObjectURL(
    url
  );


  alert(
    "✅ Memory exported."
  );

}


/* =====================================================
   IMPORT MEMORY
===================================================== */

async function importMemory() {

  const input =
    document.createElement(
      "input"
    );


  input.type = "file";

  input.accept =
    ".json,application/json";


  input.onchange =
    async event => {

      const file =
        event.target.files[0];


      if (!file) {
        return;
      }


      try {

        const text =
          await file.text();


        const imported =
          JSON.parse(
            text
          );


        let count = 0;


        for (
          const id in imported
        ) {

          const data =
            imported[id];


          if (
            !data ||
            typeof data !== "object"
          ) {
            continue;
          }


          await setDoc(
            doc(
              db,
              "knowledge",
              id
            ),
            data
          );


          count++;

        }


        proTrainingLoaded = false;

        proTrainingData = [];


        alert(
          `✅ Memory imported.\nRecords: ${count}`
        );


      } catch (error) {

        console.error(error);


        alert(
          "Import failed. Invalid JSON file."
        );

      }

    };


  input.click();

}


/* =====================================================
   CLEAR MEMORY
===================================================== */

async function clearMemory() {

  const firstConfirm =
    confirm(
      "⚠️ Delete ALL Mogibara memory?"
    );


  if (!firstConfirm) {
    return;
  }


  const secondConfirm =
    prompt(
      "Type DELETE to confirm:"
    );


  if (
    secondConfirm !==
    "DELETE"
  ) {

    alert(
      "Cancelled."
    );

    return;
  }


  const snapshot =
    await getDocs(
      collection(
        db,
        "knowledge"
      )
    );


  let count = 0;


  for (
    const item of snapshot.docs
  ) {

    await deleteDoc(
      item.ref
    );


    count++;

  }


  alert(
    `✅ All memory deleted.\nRecords: ${count}`
  );

}


/* =====================================================
   ENCODE QUESTION
===================================================== */

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


/* =====================================================
   HTML SECURITY
===================================================== */

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


/* =====================================================
   FIREBASE ERRORS
===================================================== */

function friendlyError(
  error
) {

  switch (
    error.code
  ) {

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

      return (
        error.message ||
        "Something went wrong."
      );

  }

}
