"use client";

import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { submitQuizScore } from "@/lib/actions/quiz.actions";
import { AuthButton } from "./AuthButton";

interface Question {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface QuizData {
  questions: Question[];
}

interface QuizPlayerProps {
  quizData: QuizData;
  authorName: string;
  quizId: string;
  userId?: string | null;
}

export function QuizPlayer({ quizData, quizId, userId }: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const questions = quizData.questions || [];

  // Efecto de Guardado: Cuando se muestran los resultados, guardar automáticamente
  // DEBE estar antes de cualquier early return para cumplir con las reglas de hooks
  useEffect(() => {
    if (showResults && !isSaved && !isSaving) {
      const saveScore = async () => {
        setIsSaving(true);
        try {
          await submitQuizScore(quizId, score, questions.length);
          setIsSaved(true);
        } catch (error) {
          console.error("Error guardando resultado:", error);
          // No mostramos error al usuario, solo en consola
        } finally {
          setIsSaving(false);
        }
      };
      saveScore();
    }
  }, [showResults, quizId, score, questions.length, isSaved, isSaving]);

  // Pantalla de Bloqueo - Si no hay usuario (después de los hooks)
  if (!userId) {
    return (
      <div className="text-center space-y-6 py-12">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-2">
            Loguéate para jugar
          </h2>
          <p className="text-white/60 text-sm">
            Necesitas iniciar sesión para responder este quiz y guardar tu progreso.
          </p>
        </div>
        <div className="flex justify-center">
          <AuthButton />
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setScore(0);
    setShowResults(false);
    setIsSaved(false);
    setIsSaving(false);
  };

  const handleOptionSelect = (index: number) => {
    if (isAnswerChecked) return;
    setSelectedOption(index);
  };

  const handleCheck = () => {
    if (selectedOption === null) return;

    setIsAnswerChecked(true);

    // Si la respuesta es correcta, incrementar el score
    if (selectedOption === currentQ.answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      setShowResults(true);
    }
  };

  const getMotivationalMessage = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage === 100) {
      return "¡Perfecto! Dominas este tema completamente.";
    } else if (percentage >= 80) {
      return "¡Bien hecho! Tienes un gran conocimiento.";
    } else {
      return "Sigue estudiando para mejorar.";
    }
  };

  // Pantalla de Resultados
  if (showResults) {
    return (
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-white mb-2">Resultados</h1>
        <div className="text-6xl font-bold text-white mb-4">
          {score}/{questions.length}
        </div>
        <p className="text-xl text-white/80 mb-4">{getMotivationalMessage()}</p>

        {/* Estado de Guardado */}
        {isSaving && (
          <p className="text-sm text-x-gray">Guardando resultado...</p>
        )}
        {isSaved && (
          <p className="text-sm text-green-500">✓ Resultado guardado</p>
        )}

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            onClick={handleRetry}
            className="bg-white text-black rounded-full px-6 py-2 font-bold hover:bg-[#eff3f4] transition-colors"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="inline-block bg-white text-black rounded-full px-6 py-2 font-bold hover:bg-[#eff3f4] transition-colors"
          >
            Volver al Feed
          </Link>
        </div>
      </div>
    );
  }

  // Pantalla de Juego
  if (!currentQ) {
    return (
      <div className="text-center">
        <p className="text-xl text-white">No hay preguntas disponibles.</p>
      </div>
    );
  }

  const isCorrect = selectedOption === currentQ.answer;

  return (
    <div className="w-full space-y-6">
      {/* Barra de Progreso */}
      <div className="w-full h-1 bg-[#2f3336] rounded-full">
        <div
          className="h-full bg-[#1d9bf0] rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Pregunta */}
      <p className="text-2xl font-bold text-center text-white">
        {currentQ.question}
      </p>

      {/* Opciones */}
      <div className="space-y-3">
        {currentQ.options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isCorrectAnswer = index === currentQ.answer;
          const showFeedback = isAnswerChecked;

          let borderColor = "border-[#2f3336]";
          let bgColor = "bg-transparent";

          if (showFeedback) {
            if (isCorrectAnswer) {
              borderColor = "border-green-500";
              bgColor = "bg-green-500/10";
            } else if (isSelected && !isCorrectAnswer) {
              borderColor = "border-red-500";
              bgColor = "bg-red-500/10";
            }
          } else if (isSelected) {
            borderColor = "border-[#1d9bf0]";
            bgColor = "bg-[#1d9bf0]/10";
          }

          return (
            <button
              key={index}
              onClick={() => handleOptionSelect(index)}
              disabled={isAnswerChecked}
              className={`
                w-full p-4 text-left rounded-xl border transition-all
                ${borderColor} ${bgColor} text-white
                ${!isAnswerChecked ? "hover:bg-[#2f3336]/50 cursor-pointer" : "cursor-default"}
                flex items-center justify-between gap-4
              `}
            >
              <span className="flex-1">{option}</span>
              {showFeedback && isCorrectAnswer && (
                <Check className="w-6 h-6 text-green-500 flex-shrink-0" />
              )}
              {showFeedback && isSelected && !isCorrectAnswer && (
                <X className="w-6 h-6 text-red-500 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Explicación */}
      {isAnswerChecked && (
        <div className="p-4 rounded-lg bg-[#1d9bf0]/10 border border-[#1d9bf0]/20">
          <p className="text-[#1d9bf0] text-sm leading-relaxed">
            <span className="font-semibold">Explicación: </span>
            {currentQ.explanation}
          </p>
        </div>
      )}

      {/* Footer - Botones */}
      <div className="flex justify-center">
        {!isAnswerChecked ? (
          <button
            onClick={handleCheck}
            disabled={selectedOption === null}
            className={`
              bg-white text-black rounded-full px-6 py-2 font-bold transition-colors
              ${
                selectedOption !== null
                  ? "hover:bg-[#eff3f4] cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }
            `}
          >
            Comprobar
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="bg-white text-black rounded-full px-6 py-2 font-bold hover:bg-[#eff3f4] transition-colors"
          >
            {currentIndex < questions.length - 1
              ? "Siguiente Pregunta"
              : "Ver Resultados"}
          </button>
        )}
      </div>
    </div>
  );
}
