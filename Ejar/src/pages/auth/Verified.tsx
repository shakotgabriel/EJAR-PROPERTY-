import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Verified() {
  const navigate = useNavigate();

  return (
    <div className="relative h-screen w-full">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/juba1.webp')" }}
      ></div>
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative flex h-full w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card className="backdrop-blur-lg text-white text-2xl font-black">
            <CardHeader>
              <CardTitle>Verified ✅</CardTitle>
              <CardDescription>Your account is verified. You can continue.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="bg-blue-500 hover:bg-blue-900 w-full"
                onClick={() => navigate("/onboarding", { replace: true })}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
