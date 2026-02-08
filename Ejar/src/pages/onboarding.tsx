import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Onboarding: React.FC = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  const options = [
    { id: "seeker", title: "Property Seeker", description: "Looking for properties to rent or buy" },
    { id: "agent", title: "Real Esate Agent", description: "I represent a real estate agency" },
  ];

  return (
    <div className="bg-gray-100 w-full h-screen flex justify-center items-center">
      <Card className="p-6 w-full max-w-md bg-white">
        <CardHeader>
          <h2 className="text-xl font-semibold mb-2">What type of user are you?</h2>
          <CardDescription>
            This will help us provide you with a more relevant experience
          </CardDescription>
        </CardHeader>

        <div className="mt-6 space-y-4">
          {options.map((option) => (
            <div
              key={option.id}
              onClick={() => setSelected(option.id)}
              className={`border rounded-lg p-4 cursor-pointer transition
                ${selected === option.id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 bg-white"}
              `}
            >
              <h3 className="font-medium">{option.title}</h3>
              <p className="text-sm text-gray-500">{option.description}</p>
            </div>
          ))}
        </div>

        <Button
          className="mt-6 w-full bg-blue-600 text-white hover:bg-blue-900"
          disabled={!selected}
          onClick={() => navigate("/", { replace: true })}
        >
          Next
        </Button>
      </Card>
    </div>
  );
};

export default Onboarding;
