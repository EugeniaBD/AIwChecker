import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../contexts/AuthContext";

export const planLimits = {
  Free: 20,
  Standard: 50,
  Premium: Infinity,
};

export async function getTokenUsage(uid) {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const q = query(collection(db, "submissions"), where("userId", "==", uid));
  const snapshot = await getDocs(q);
  const thisMonth = snapshot.docs.filter((doc) => {
    const createdAt = doc.data().createdAt?.toDate();
    return createdAt && createdAt >= firstDay;
  });

  const count = thisMonth.length;
  const currentPlan =
    count <= 20 ? "Free" : count <= 50 ? "Standard" : "Premium";
  const maxTokens = planLimits[currentPlan];
  const canSubmit = maxTokens === Infinity || count < maxTokens;
  const tokensLeft = maxTokens === Infinity ? "Unlimited" : maxTokens - count;

  return { canSubmit, tokensLeft, plan: currentPlan, used: count };
}
