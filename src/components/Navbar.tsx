'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import wordsData from '@/data/words';

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const [learnedWords] = useLocalStorage<number[]>('learned-words', []);
  const [mounted, setMounted] = useState(false);

  const totalWords = wordsData.length;
  const learnedCount = learnedWords.length;
  const progressPercentage = totalWords > 0 ? Math.round((learnedCount / totalWords) * 100) : 0;

  // Prevent SSR flicker
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update theme class
  useEffect(() => {
    if (!mounted) return;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const navLinks = [
    { href: '/', label: 'ໜ້າຫຼັກ' }, // Home
    { href: '/vocabulary', label: 'ຄຳສັບ' }, // Vocabulary
    { href: '/quiz', label: 'ກວດສອບ (Quiz)' }, // Quiz
    { href: '/conversation', label: 'ການສົນທະນາ' }, // Conversation
  ];

  return (
    <nav className="sticky top-0 z-50 transition-all duration-300 border-b border-border glass bg-opacity-80 dark:bg-opacity-80">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex items-center justify-center w-10 h-10 transition-transform duration-300 rounded-xl bg-primary text-primary-foreground group-hover:scale-105 shadow-md shadow-primary/20">
                {/* Book Icon SVG */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="2 2 20 20"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600 dark:to-indigo-400">
                English Learning
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'text-muted hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Global Progress Bar in Nav */}
            {mounted && (
              <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-secondary border border-border">
                <span className="text-xs font-semibold text-muted">ຮຽນແລ້ວ:</span>
                <div className="w-20 h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full transition-all duration-500 rounded-full bg-primary"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-foreground">
                  {learnedCount}/{totalWords} ({progressPercentage}%)
                </span>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-secondary hover:bg-border text-foreground transition-all duration-200 shadow-sm border border-border cursor-pointer"
              aria-label="Toggle Dark Mode"
            >
              {mounted && theme === 'dark' ? (
                // Sun Icon (Dark Theme Active)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-5 h-5 text-amber-400 animate-spin-slow"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v2.25m0 13.5V21M9.75 12h-4.5m13.5 0h-4.5m-2.236-4.236L7.486 6.014m10.5 10.5-1.764-1.764M6.014 17.986l1.764-1.764m10.5-10.5-1.764 1.764M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"
                  />
                </svg>
              ) : (
                // Moon Icon (Light Theme Active)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-5 h-5 text-slate-700"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            {mounted && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary border border-border text-xs font-bold text-foreground">
                {learnedCount}/{totalWords}
              </div>
            )}

            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-secondary text-foreground hover:bg-border transition-colors border border-border cursor-pointer"
              aria-label="Toggle Dark Mode"
            >
              {mounted && theme === 'dark' ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-4 h-4 text-amber-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v2.25m0 13.5V21M9.75 12h-4.5m13.5 0h-4.5m-2.236-4.236L7.486 6.014m10.5 10.5-1.764-1.764M6.014 17.986l1.764-1.764m10.5-10.5-1.764 1.764M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-4 h-4 text-slate-700"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                  />
                </svg>
              )}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-secondary text-foreground hover:bg-border transition-colors border border-border cursor-pointer"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                // X Icon
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger Menu Icon
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden animate-scale-up border-t border-border bg-card">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary dark:bg-primary/20'
                      : 'text-muted hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          {mounted && (
            <div className="p-4 border-t border-border bg-secondary/50">
              <div className="flex justify-between items-center mb-2 text-xs font-semibold text-muted">
                <span>ຄວາມຄືບໜ້າການຮຽນ</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="w-full h-2.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted text-center">
                ຮຽນແລ້ວ {learnedCount} ຈາກທັງໝົດ {totalWords} ຄຳສັບ
              </p>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
