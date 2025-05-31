import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Assuming useAuth is already set up for Google Sign In
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from './config'; // Ensure Firebase config is correctly initialized

function AuthPanel() {
  const [error, setError] = useState('');
  const { signInWithGoogle } = useAuth();  // We assume the Google sign-in method is available from AuthContext
  const navigate = useNavigate();


  // This is used in AuthProvider (or wherever you handle the user authentication):
async function updateUserProfileImage(file, userId) {
    try {
      const imageUrl = await uploadProfileImage(file, userId);
      
      // Store the image URL in Firestore
      await setDoc(doc(db, 'users', userId), {
        profileImage: imageUrl, // Add the profileImage URL to the user's document
      }, { merge: true });
  
      return imageUrl;
    } catch (error) {
      console.error("Error uploading profile image:", error);
      throw error;
    }
  }

  async function handleGoogleSignIn() {
    try {
      // Sign in with Google using the method from the context
      const userCredential = await signInWithGoogle();
      const user = userCredential.user;
      
      // Check if the user is already in the 'users' collection in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // If the user doesn't exist, register them in Firestore
        await setDoc(userDocRef, {
          email: user.email,
          name: user.displayName,
          role: 'user',
          profileImage: user.photoURL || null, // ✅ Save Google avatar here
          createdAt: new Date().toISOString(),
        });
      }

      // After successfully signing in, navigate to the Dashboard
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to sign in with Google');
      console.error(error);
    }
  }

  return (
    <div className="mt-4 text-center">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <button
        onClick={handleGoogleSignIn}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-gray-800 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      >
        <img src="/images/google.jpeg" alt="Google" className="inline-block w-6 h-6 mr-2" /> 
        Sign in with Google
      </button>
    </div>
  );
}

export default AuthPanel;
