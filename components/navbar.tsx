'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Home, Sparkles, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-5 w-5" />
            <span>Wiki Generator</span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/">
              <Button
                variant={isActive('/') && !isActive('/wiki') && !isActive('/generate') && !isActive('/search') ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>

            <Link href="/wiki">
              <Button
                variant={isActive('/wiki') ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Wikis
              </Button>
            </Link>

            <Link href="/search">
              <Button
                variant={isActive('/search') ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
            </Link>

            <Link href="/generate">
              <Button
                variant={isActive('/generate') ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Generate
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/generate">
            <Button size="sm" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">New Wiki</span>
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
