import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  getAuth,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Import Firebase Storage methods
import firebaseApp from '../firebase/config'; // Import with a different name to avoid confusion

// Initialize auth and db using the imported app
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  const storage = getStorage();

  // Helper function to upload image and get URL
  const uploadProfileImage = async (file, userId) => {
    const imageRef = ref(storage, `profileImages/${userId}/${file.name}`); // Store images under a unique user ID

    await uploadBytes(imageRef, file); // Upload the file to Firebase Storage

    const imageUrl = await getDownloadURL(imageRef); // Get the download URL of the uploaded image
    return imageUrl;
  };

  // Google Sign-In Method
  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if the user already exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // If the user doesn't exist, create a new document
        await setDoc(userDocRef, {
          name: user.displayName,
          email: user.email,
          role: 'user', // Default role for new users
          createdAt: new Date().toISOString()
        });
      }

      // Return the user data
      return result;
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      throw error;
    }
  }

  // Sign up with email and password
  async function signup(email, password, name) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with name
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        role: 'user',
        createdAt: new Date().toISOString()
      });
      
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function getUserRole(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data().role;
      }
      return 'user';
    } catch (error) {
      console.error("Error getting user role:", error);
      return 'user';
    }
  }

  async function getUserProfile(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  }

  async function updateUserProfile(data) {
    if (!currentUser) return;

    try {
      // Update the profile image (and other data if needed) in Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...data, // This will include the new profileImage URL
        updatedAt: new Date().toISOString()  // Optionally, add a timestamp
      });

      // Update local user profile state
      setUserProfile(prev => ({ ...prev, ...data }));

      return true;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  async function updateUserEmail(newEmail, password) {
    if (!currentUser) throw new Error("No user logged in");

    try {
      // Re-authenticate user before updating email
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        password
      );

      await reauthenticateWithCredential(currentUser, credential);
      await updateEmail(currentUser, newEmail);

      // Update email in Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        email: newEmail,
        updatedAt: new Date().toISOString()
      });

      // Update local user profile
      setUserProfile(prev => ({ ...prev, email: newEmail }));

      return true;
    } catch (error) {
      console.error("Error updating email:", error);
      throw error;
    }
  }

  async function updateUserPassword(currentPassword, newPassword) {
    if (!currentUser) throw new Error("No user logged in");

    try {
      // Re-authenticate user before updating password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);

      return true;
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const role = await getUserRole(user.uid);
        setUserRole(role);

        // Fetch user profile data
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserRole('user');
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    isAdmin: userRole === 'admin',
    signInWithGoogle, // Add Google Sign-In function to the context
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Export db and auth for use in other components
export { db, auth };
