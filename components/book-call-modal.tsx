"use client";

import { X } from "lucide-react";

interface BookCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookCallModal({ isOpen, onClose }: BookCallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-4">Book a Free Call</h2>
        <p className="text-white/60 mb-6">
          Let's discuss your financial goals and create a personalized roadmap.
        </p>

        <form className="space-y-4">
          <input
            type="text"
            placeholder="Your name"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-primary/50"
          />
          <input
            type="email"
            placeholder="Your email"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-primary/50"
          />
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-black font-semibold py-2 rounded-lg transition"
          >
            Book Call
          </button>
        </form>
      </div>
    </div>
  );
}
