import Link from "next/link";
import { SignInForm } from "@/components/SignInForm";

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center font-serif text-3xl text-stone-900">Welcome back</h1>
      <p className="mt-2 text-center text-stone-600">
        Sign in to browse, buy, or manage your shop.
      </p>
      <SignInForm />
      <p className="mt-6 text-center text-sm text-stone-500">
        New here?{" "}
        <Link href="/auth/signup" className="text-amber-800 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
