import React, { useState, useEffect } from "react";
import { FiCheckCircle } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { getTokenUsage } from "../utils/tokenUtils"; // Import token calculation

function Subscription() {
  const { currentUser } = useAuth();
  const [tokensLeft, setTokensLeft] = useState(null);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState("Standard");
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    const fetchTokenData = async () => {
      const { canSubmit, tokensLeft, plan, used } = await getTokenUsage(currentUser.uid);
      setTokensLeft(tokensLeft);
      setAnalysisCount(used);
      setSelectedPlan(plan);
    };

    fetchTokenData();
  }, [currentUser]);

  const plans = [
    {
      name: "Free",
      price: "£0",
      description: "Up to 20 tokens/month",
      range: [0, 20],
      maxTokens: 20,
      features: ["Basic text analysis", "Limited usage", "Community support"],
      button: "Get Started",
      highlight: false,
    },
    {
      name: "Standard",
      price: "£20",
      description: "21–50 tokens/month",
      range: [21, 50],
      maxTokens: 50,
      features: ["Extended usage", "Priority support", "Monthly reporting"],
      button: "Subscribe Now",
      highlight: true,
    },
    {
      name: "Premium",
      price: "£49",
      description: "Unlimited text analysis",
      range: [51, Infinity],
      maxTokens: Infinity,
      features: ["Unlimited tokens", "Premium support", "Full insights dashboard"],
      button: "Go Premium",
      highlight: false,
    },
  ];

  const handleSelectPlan = (planName) => {
    setSelectedPlan(planName);
    const matched = plans.find((p) => p.name === planName);
    setTokensLeft(
      matched.maxTokens === Infinity ? "Unlimited" : Math.max(matched.maxTokens - analysisCount, 0)
    );
    setConfirmation(`You've selected the ${planName} plan.`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Choose Your Plan</h2>
        <p className="text-gray-600 mb-6">
          Pick the subscription that fits your needs and unlock advanced text analysis tools.
        </p>

        <div className="mb-8">
          <p className="text-lg text-gray-800">
            You have used <span className="font-semibold">{analysisCount}</span> tokens this month.
          </p>
          <p className="text-gray-600">
            Current Plan: <span className="font-semibold">{selectedPlan}</span>
          </p>
          {tokensLeft !== null && (
            <p className="text-gray-600">
              Tokens left this month: <span className="font-semibold">{tokensLeft}</span>
            </p>
          )}
        </div>

        {confirmation && (
          <div className="mb-6 px-4 py-3 bg-green-100 border border-green-300 rounded text-green-800 font-medium">
            <FiCheckCircle className="inline mr-2" />
            {confirmation}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-xl border shadow-sm p-6 bg-white transition transform hover:scale-105 ${
                selectedPlan === plan.name
                  ? "border-green-500 ring-2 ring-green-200"
                  : plan.highlight
                  ? "border-blue-600 ring-2 ring-blue-200"
                  : "border-gray-200"
              }`}
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{plan.name}</h3>
              <p className="text-3xl font-bold text-blue-600">
                {plan.price}
                {plan.name !== "Free" && <span className="text-base font-medium text-gray-500"> /month</span>}
              </p>
              <p className="mt-1 text-gray-500">{plan.description}</p>

              <ul className="mt-6 space-y-2 text-left">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-gray-700">
                    <FiCheckCircle className="text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.name)}
                className={`mt-6 w-full py-2 px-4 rounded-lg text-white font-semibold ${
                  selectedPlan === plan.name
                    ? "bg-green-600 hover:bg-green-700"
                    : plan.highlight
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-700 hover:bg-gray-800"
                }`}
              >
                {selectedPlan === plan.name ? "Current Plan" : plan.button}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Subscription;
