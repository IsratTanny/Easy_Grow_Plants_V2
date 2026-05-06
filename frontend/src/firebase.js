import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
const firebaseConfig = {
    apiKey: 'AIzaSyBPFWwE27FSf572TCmgaLIx2BT4w1fCV-g',
    authDomain: 'easy-grow-plants.firebaseapp.com',
    projectId: 'easy-grow-plants',
    storageBucket: 'easy-grow-plants.firebasestorage.app',
    messagingSenderId: '1004982507824',
    appId: '1:1004982507824:web:c16fc84a47ee6f8ab450f5',
    measurementId: 'G-QSGYKZ7W3B'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
