import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import firebaseApp from "../firebase/config"; // Make sure this import matches your Firebase config path

const storage = getStorage(firebaseApp);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

// Helper function to upload the profile image to Firebase Storage and get the URL
export const uploadProfileImage = async (file, userId) => {
  try {
    const imageRef = ref(storage, `profileImages/${userId}/${file.name}`); // Store the image under a unique user ID

    // Upload the file to Firebase Storage
    await uploadBytes(imageRef, file);

    // Get the download URL of the uploaded image
    const imageUrl = await getDownloadURL(imageRef);
    
    // Update the user's profile in Firestore with the image URL
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      profileImage: imageUrl,
    });

    return imageUrl; // Return the URL of the uploaded image
  } catch (error) {
    console.error("Error uploading profile image:", error);
    throw error; // Rethrow the error for further handling in the component
  }
};
