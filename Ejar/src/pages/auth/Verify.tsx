import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import API from "@/api/api";
import { useAuthStore } from "@/store/authStore";

type Channel = "email" | "phone";

type LocationState = {
  channel?: Channel;
  email?: string;
  phone_number?: string;
};

export default function Verify() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const setSession = useAuthStore((s) => s.setSession);

  const [channel, setChannel] = useState<Channel>(state.channel ?? "email");
  const [email, setEmail] = useState(state.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(state.phone_number ?? "");
  const [code, setCode] = useState("");

  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const destinationLabel = useMemo(() => (channel === "email" ? "Email" : "Phone number"), [channel]);

  const handleSend = async () => {
    setError(null);
    setInfo(null);

    const payload =
      channel === "email"
        ? { channel, email: email.trim() }
        : { channel, phone_number: phoneNumber.trim() };

    if (channel === "email" && !payload.email) {
      setError("Email is required");
      return;
    }

    if (channel === "phone" && !payload.phone_number) {
      setError("Phone number is required");
      return;
    }

    setIsSending(true);
    try {
      await API.post("users/verify/start/", payload);
      setInfo("If an account exists, a code has been sent.");
    } catch (err) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to send code";
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const payload =
      channel === "email"
        ? { channel, email: email.trim(), code: code.trim() }
        : { channel, phone_number: phoneNumber.trim(), code: code.trim() };

    if (!payload.code) {
      setError("Verification code is required");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await API.post("users/verify/confirm/", payload);
      const { access, refresh, user } = res.data;

      if (access && refresh && user) {
        setSession({ access, refresh, user });
        navigate("/verified", { replace: true });
        return;
      }

      navigate("/login", { replace: true });
    } catch (err) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Verification failed";
      setError(message);
    } finally {
      setIsVerifying(false);
    }
  };

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
              <CardTitle>Verify your account</CardTitle>
              <CardDescription>Enter the code we sent to your {channel === "email" ? "email" : "phone"}.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify}>
                <FieldGroup>
                  {(error || info) && (
                    <div
                      className={`p-3 rounded-lg border text-sm font-normal ${
                        error
                          ? "bg-red-500/10 border-red-500 text-red-500"
                          : "bg-green-500/10 border-green-500 text-green-500"
                      }`}
                    >
                      {error || info}
                    </div>
                  )}

                  <Field>
                    <FieldLabel>Verify via</FieldLabel>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setChannel("email")}
                        className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                          channel === "email"
                            ? "border-blue-500 bg-blue-500/20 text-blue-300"
                            : "border-gray-600 bg-gray-900/30 text-gray-300 hover:border-blue-400"
                        }`}
                      >
                        Email
                      </button>
                      <button
                        type="button"
                        onClick={() => setChannel("phone")}
                        className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                          channel === "phone"
                            ? "border-blue-500 bg-blue-500/20 text-blue-300"
                            : "border-gray-600 bg-gray-900/30 text-gray-300 hover:border-blue-400"
                        }`}
                      >
                        Phone
                      </button>
                    </div>
                    <FieldDescription className="mt-2">
                      Choose email or phone verification.
                    </FieldDescription>
                  </Field>

                  {channel === "email" ? (
                    <Field>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isSending || isVerifying}
                      />
                    </Field>
                  ) : (
                    <Field>
                      <FieldLabel htmlFor="phoneNumber">Phone number</FieldLabel>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        disabled={isSending || isVerifying}
                      />
                    </Field>
                  )}

                  <Field>
                    <FieldLabel htmlFor="code">Verification code</FieldLabel>
                    <Input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      disabled={isVerifying}
                    />
                    <FieldDescription>
                      Didn&apos;t get a code?{" "}
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={isSending || isVerifying}
                        className="underline hover:text-blue-200 disabled:opacity-60"
                      >
                        {isSending ? "Sending..." : `Send to ${destinationLabel}`}
                      </button>
                    </FieldDescription>
                  </Field>

                  <Field>
                    <Button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-900 w-full"
                      disabled={isVerifying}
                    >
                      {isVerifying ? "Verifying..." : "Verify"}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
