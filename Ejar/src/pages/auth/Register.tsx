import { SignupForm } from "@/components/signup-form";

export default function Page() {
  return (
    <div className="relative h-screen w-full">
    
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/juba1.webp')" }}
      ></div>

      
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative flex h-full w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
