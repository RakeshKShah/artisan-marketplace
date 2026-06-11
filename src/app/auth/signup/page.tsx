import Link from "next/link";
import { SignUpForm } from "@/components/SignUpForm";

export default function SignUpPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center font-serif text-3xl text-stone-900">Join Artisan Market</h1>
      <p className="mt-2 text-center text-stone-600">
        Buy handmade goods or open your own artisan shop.
      </p>
      <SignUpForm />
      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link href="/auth/signin" className="text-amber-800 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
