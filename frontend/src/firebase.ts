import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCop7fwxcpbkmtgZ6Cr320AG3_JA4gsDSc",
  authDomain: "almoxarifado-6c20a.firebaseapp.com",
  projectId: "almoxarifado-6c20a",
  storageBucket: "almoxarifado-6c20a.firebasestorage.app",
  messagingSenderId: "386209229290",
  appId: "1:386209229290:web:227ba452f9fbaea3e66a93",
  measurementId: "G-WL9DB4XBWH"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
