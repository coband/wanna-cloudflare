"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser, OrganizationSwitcher } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (!isLoaded) {
    return (
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16" />
    );
  }

  if (!isSignedIn) {
    return null;
  }

  const navItems = [
    { name: "Katalog", href: "/books" },
    { name: "Lehrmittel finden", href: "/lehrmittel/search" },
    { name: "Massen-Import", href: "/massen-import" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/books" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-all duration-300">
                W
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
                WANNA
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 rounded-full bg-blue-50 -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Actions & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 pl-4 border-l border-gray-200">
              <OrganizationSwitcher 
                appearance={{
                  elements: {
                    organizationSwitcherTrigger: "h-9 px-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                  }
                }}
              />
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 ring-2 ring-white shadow-sm hover:shadow-md transition-shadow"
                  }
                }}
              />
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
                 <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 ring-2 ring-white shadow-sm"
                  }
                }}
              />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 bg-white"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => {
                 const isActive = pathname === item.href;
                 return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {item.name}
                  </Link>
                 )
              })}
              <div className="pt-4 pb-3 border-t border-gray-200">
                  <div className="flex items-center px-3">
                      <OrganizationSwitcher 
                        appearance={{
                            elements: {
                                organizationSwitcherTrigger: "w-full justify-between h-9 px-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                            }
                        }}
                      />
                  </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
