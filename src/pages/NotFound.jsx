import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
        <LayoutGrid size={48} />
        <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground shadow-lg">
          404
        </span>
      </div>
      
      <h1 className="mb-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
        Page Not Found
      </h1>
      
      <p className="mb-2 max-w-[500px] text-lg text-muted-foreground">
        The page you're looking for doesn't exist or has been moved. 
      </p>
      <p className="mb-8 font-mono text-xs text-destructive bg-destructive/5 px-2 py-1 rounded">
        URL: {window.location.pathname}
      </p>
      
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow-md"
        >
          Go Back Home
        </Link>
        <Link
          to="/login"
          className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          Login
        </Link>
      </div>
      
      <div className="mt-16 text-sm text-muted-foreground/50">
        &copy; {new Date().getFullYear()} Literature Chronicle. All rights reserved.
      </div>
    </div>
  );
};

export default NotFound;
