import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, setDoc, getDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCuyMHis6O6EE9JJxUoNHRz-PmZtqbVEG8",
  authDomain: "eduquest-19a59.firebaseapp.com",
  projectId: "eduquest-19a59",
  storageBucket: "eduquest-19a59.firebasestorage.app",
  messagingSenderId: "856131705244",
  appId: "1:856131705244:web:c39d4319a9746fe2e9d059"
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

export { db, auth, collection, addDoc, getDocs, deleteDoc, doc, setDoc, getDoc, query, where, orderBy, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail };
