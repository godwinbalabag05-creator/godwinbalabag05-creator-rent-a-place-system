// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAGO8dy8MHUuvqSPbu4gSNd3FOgOTonlBM",
  authDomain: "rent-a-place-system.firebaseapp.com",
  projectId: "rent-a-place-system",
  storageBucket: "rent-a-place-system.firebasestorage.app",
  messagingSenderId: "1072658093898",
  appId: "1:1072658093898:web:2bfeae191789c1cdd993b3",
  measurementId: "G-H9L9XMT88F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
const analytics = getAnalytics(app);