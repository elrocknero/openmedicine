"use client";

import { useState } from "react";
import { votePoll } from "@/lib/actions/post.actions";
import { useRouter } from "next/navigation";
import { BarChart2 } from "lucide-react";

interface PollDisplayProps {
  pollData: {
    id: string;
    options: string[];
    votes: number[];
  };
  postId: string;
}

export function PollDisplay({ pollData, postId }: PollDisplayProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState(pollData.votes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalVotes = votes.reduce((sum, vote) => sum + vote, 0);

  const handleVote = async (optionIndex: number) => {
    if (hasVoted || isSubmitting) return;

    setIsSubmitting(true);
    setSelectedOption(optionIndex);
    
    try {
      await votePoll(pollData.id, optionIndex, `/post/${postId}`);
      // Optimistic UI: incrementar el voto
      const newVotes = [...votes];
      newVotes[optionIndex] = (newVotes[optionIndex] || 0) + 1;
      setVotes(newVotes);
      setHasVoted(true);
      router.refresh();
    } catch (error) {
      console.error("Error votando:", error);
      setSelectedOption(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2 border border-[#2f3336] rounded-2xl p-4 bg-[#16181c]">
      {pollData.options.map((option, index) => {
        const voteCount = votes[index] || 0;
        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

        return (
          <button
            key={index}
            onClick={() => handleVote(index)}
            disabled={hasVoted || isSubmitting}
            className={`w-full text-left p-3 rounded-xl border transition-colors ${
              hasVoted
                ? "border-[#2f3336] cursor-default"
                : "border-[#2f3336] hover:border-[#1d9bf0] hover:bg-[#1d9bf0]/5 cursor-pointer"
            } ${selectedOption === index ? "border-[#1d9bf0] bg-[#1d9bf0]/10" : ""}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-white text-[15px]">{option}</span>
              {hasVoted && (
                <span className="text-[#71767b] text-sm">{Math.round(percentage)}%</span>
              )}
            </div>
            {hasVoted && (
              <div className="w-full bg-[#2f3336] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#1d9bf0] h-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            )}
            {hasVoted && (
              <div className="text-[#71767b] text-xs mt-1">
                {voteCount} {voteCount === 1 ? "voto" : "votos"}
              </div>
            )}
          </button>
        );
      })}
      {hasVoted && (
        <div className="text-[#71767b] text-xs pt-2 border-t border-[#2f3336]">
          {totalVotes} {totalVotes === 1 ? "voto total" : "votos totales"}
        </div>
      )}
    </div>
  );
}

