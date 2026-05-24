// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  
  authDomain: "genwebai-7c917.firebaseapp.com",
  projectId: "genwebai-7c917",
  storageBucket: "genwebai-7c917.firebasestorage.app",
  messagingSenderId: "904981557980",
  appId: "1:904981557980:web:66e08457d6e1207431ba19"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app)

const provider = new GoogleAuthProvider()

export { auth, provider }


