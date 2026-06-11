import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="font-serif text-2xl font-semibold text-amber-900">
          Artisan Market
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-stone-700">
          <Link href="/" className="hover:text-amber-800">
            Browse
          </Link>
          {session?.user ? (
            <>
              <Link href="/cart" className="hover:text-amber-800">
                Cart
              </Link>
              <Link href="/orders" className="hover:text-amber-800">
                Orders
              </Link>
              {session.user.role === "SELLER" && (
                <Link href="/seller" className="hover:text-amber-800">
                  Seller Dashboard
                </Link>
              )}
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="hover:text-amber-800">
                  Admin
                </Link>
              )}
              <span className="text-stone-500">{session.user.name}</span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="text-amber-800 hover:underline">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="hover:text-amber-800">
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-full bg-amber-800 px-4 py-2 text-white hover:bg-amber-900"
              >
                Join
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
