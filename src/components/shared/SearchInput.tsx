"use client";

import { useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface SearchInputProps {
  defaultValue?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export function SearchInput({
  defaultValue = "",
  placeholder = "Buscar en Open Medicine...",
  onSearch,
}: SearchInputProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(defaultValue);

  const handleSearch = () => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      if (onSearch) {
        onSearch(trimmedQuery);
      } else {
        router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      handleSearch();
    }
  };

  return (
    <div className="group relative w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#71767b] group-focus-within:text-white transition-colors">
        <Search className="w-5 h-5" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full bg-[#202327] rounded-full h-[42px] border-none pl-12 pr-4 focus:outline-none focus:bg-black focus:border focus:border-white/20 placeholder:text-[#71767b] transition-all text-white text-[15px]"
      />
    </div>
  );
}

