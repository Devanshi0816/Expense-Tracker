import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD9qC-h9xiXWfAmZB3P2HKEO_ukPF9AlQM",
  authDomain: "expense-tracker-bfe7e.firebaseapp.com",
  projectId: "expense-tracker-bfe7e",
  storageBucket: "expense-tracker-bfe7e.firebasestorage.app",
  messagingSenderId: "589138445303",
  appId: "1:589138445303:web:42156668dcf46cc835a4f2",
  measurementId: "G-SFCNTBJW8J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);