import { Link } from "@/i18n/routing";

export default function NotFound() {
  return (
    <div className="container-app py-32 text-center">
      <p className="text-sm text-text-muted">404</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-text">
        Page not found
      </h1>
      <p className="mt-4 text-text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center h-11 px-6 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
      >
        Go home
      </Link>
    </div>
  );
}
