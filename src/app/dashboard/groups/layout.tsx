"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: "User Groups", href: "/dashboard/groups/user" },
    { name: "Event Groups", href: "/dashboard/groups/event" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-white">Manage Groups</h1>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-zinc-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-blue-500 text-blue-500"
                    : "border-transparent text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {children}
    </div>
  );
}
