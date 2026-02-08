import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/authStore"

type UserRole = "tenant" | "landlord" | "agent"
type VerifyChannel = "email" | "phone"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const navigate = useNavigate()
  const { register, isLoading, error: storeError } = useAuthStore()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<UserRole>("tenant")
  const [verifyVia, setVerifyVia] = useState<VerifyChannel>("email")
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setFormError("First name and last name are required")
      return
    }

    if (!email.trim()) {
      setFormError("Email is required")
      return
    }

    if (verifyVia === "phone" && !phoneNumber.trim()) {
      setFormError("Phone number is required for phone verification")
      return
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match")
      return
    }

    try {
      await register(
        email,
        firstName,
        lastName,
        password,
        phoneNumber || undefined,
        role,
        verifyVia
      )
      setSuccess(true)
      navigate("/verify", {
        replace: true,
        state: {
          channel: verifyVia,
          email,
          phone_number: phoneNumber,
        },
      })
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string; errors?: Record<string, unknown> } } }
      const errorMessage =
        errorObj.response?.data?.detail ||
        (err instanceof Error ? err.message : "Registration failed")
      setFormError(errorMessage)
    }
  }

  return (
    <Card {...props} className="backdrop-blur-lg text-white text-2xl font-black overflow-y-auto max-h-[90vh]">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {(formError || storeError) && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500 text-red-500 text-sm font-normal">
                {formError || storeError}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500 text-green-500 text-sm font-normal">
                Account created successfully! Redirecting to verification...
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="firstName">First Name</FieldLabel>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={isLoading}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={isLoading}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="phoneNumber">Phone Number (Optional)</FieldLabel>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+211"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isLoading}
              />
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your phone number
                with anyone else.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="verifyVia">Verify via</FieldLabel>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {(["email", "phone"] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setVerifyVia(ch)}
                    disabled={isLoading}
                    className={`p-3 rounded-lg border-2 font-semibold capitalize transition-all ${
                      verifyVia === ch
                        ? "border-blue-500 bg-blue-500/20 text-blue-300"
                        : "border-gray-600 bg-gray-900/30 text-gray-300 hover:border-blue-400"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
              <FieldDescription className="mt-2">
                You must verify before continuing.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="role">Sign up as</FieldLabel>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {(["tenant", "landlord", "agent"] as const).map((roleOption) => (
                  <button
                    key={roleOption}
                    type="button"
                    onClick={() => setRole(roleOption)}
                    disabled={isLoading}
                    className={`p-3 rounded-lg border-2 font-semibold capitalize transition-all ${
                      role === roleOption
                        ? "border-blue-500 bg-blue-500/20 text-blue-300"
                        : "border-gray-600 bg-gray-900/30 text-gray-300 hover:border-blue-400"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {roleOption === "tenant" && "🏠"}
                    {roleOption === "landlord" && "🏘️"}
                    {roleOption === "agent" && "👔"}
                    <div className="text-xs mt-1">{roleOption}</div>
                  </button>
                ))}
              </div>
              <FieldDescription className="mt-2">
                {role === "tenant" && "Looking for a rental property"}
                {role === "landlord" && "Listing and managing properties"}
                {role === "agent" && "Helping clients buy/rent properties"}
              </FieldDescription>
            </Field>            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>

            <FieldGroup>
              <Field>
                <Button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-900 w-full"
                  disabled={isLoading || success}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>

                <FieldDescription className="px-6 text-center">
                  Already have an account?{" "}
                  <a href="/login" className="hover:bg-white p-2 hover:text-black rounded-3xl">
                    Sign in
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}