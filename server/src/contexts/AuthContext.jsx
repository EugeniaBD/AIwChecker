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
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getFirestore
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';

import { firebaseApp } from '../firebase/config';

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  const uploadProfileImage = async (file) => {
    if (!currentUser) throw new Error("User not authenticated");

    const uid = currentUser.uid;
    const imageRef = ref(storage, `public/users/${uid}/${file.name}`);
    await uploadBytes(imageRef, file);
    const imageUrl = await getDownloadURL(imageRef);

    await updateDoc(doc(db, 'users', uid), {
      profileImage: imageUrl,
      updatedAt: new Date().toISOString()
    });

    await updateProfile(currentUser, { photoURL: imageUrl });
    setUserProfile(prev => ({ ...prev, profileImage: imageUrl }));

    await currentUser.reload();
    setCurrentUser(auth.currentUser);
    return imageUrl;
  };

  async function signup(email, password, name, avatarFile = null) {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      let avatarUrl = null;

      if (avatarFile) {
        setCurrentUser(userCredential.user);
        avatarUrl = await uploadProfileImage(avatarFile);
      }

      await updateProfile(userCredential.user, {
        displayName: name,
        photoURL: avatarUrl || undefined,
      });

      await setDoc(doc(db, 'users', uid), {
        name,
        email,
        role: 'user',
        profileImage: avatarUrl || null,
        isActive: true,
        createdAt: new Date().toISOString()
      });

      return userCredential;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          name: user.displayName || '',
          email: user.email,
          role: 'user',
          profileImage: user.photoURL || null,
          isActive: true,
          createdAt: new Date().toISOString(),
          plan: 'free'
        });
      }

      return result;
    } catch (error) {
      console.error("Google sign-in error:", error);
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

  async function updateUserProfile(data) {
    if (!currentUser) return;

    try {
      const uid = currentUser.uid;

      await updateDoc(doc(db, 'users', uid), {
        ...data,
        updatedAt: new Date().toISOString()
      });

      if (data.name || data.profileImage) {
        await updateProfile(currentUser, {
          displayName: data.name || currentUser.displayName,
          photoURL: data.profileImage || currentUser.photoURL
        });
      }

      await currentUser.reload();
      const refreshedUser = auth.currentUser;
      setCurrentUser(refreshedUser);
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
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      await updateEmail(currentUser, newEmail);

      await updateDoc(doc(db, 'users', currentUser.uid), {
        email: newEmail,
        updatedAt: new Date().toISOString()
      });

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
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      return true;
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  }

  async function getUserRole(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.exists() ? userDoc.data().role : 'user';
    } catch (error) {
      console.error("Error getting user role:", error);
      return 'user';
    }
  }

  async function getUserProfile(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("🔥 Auth state changed:", user);
      setCurrentUser(user);

      if (user) {
        const [role, profile] = await Promise.all([
          getUserRole(user.uid),
          getUserProfile(user.uid)
        ]);
        setUserRole(role);
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
    signup,
    login,
    logout,
    resetPassword,
    signInWithGoogle,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    uploadProfileImage
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export { db, auth };
