"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Mail, User, Clock, MessageSquare, Briefcase, Loader2, CheckCircle } from "lucide-react";

interface BookCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
}

const SERVICES = [
  "Wealth Strategy Blueprint",
  "Tax Optimization",
  "Investment Portfolio Review",
  "Asset Protection & Estate Planning",
  "Retirement & FIRE Planning",
  "Business Financial Strategy",
  "Other",
];

const TIME_PREFERENCES = [
  "Morning (9 AM - 12 PM)",
  "Afternoon (12 PM - 5 PM)",
  "Evening (5 PM - 8 PM)",
  "Flexible / Any Time",
];

export default function BookCallModal({ isOpen, onClose, userName = "", userEmail = "" }: BookCallModalProps) {
  const [formData, setFormData] = useState({
    name: userName,
    email: userEmail,
    phone: "",
    preferredTime: "",
    service: "",
    otherService: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.service) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    if (formData.service === "Other" && !formData.otherService) {
      setError("Please specify the service you're looking for");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/book-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          service: formData.service === "Other" ? formData.otherService : formData.service,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit");
      }

      setIsSuccess(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setFormData({
      name: userName,
      email: userEmail,
      phone: "",
      preferredTime: "",
      service: "",
      otherService: "",
      message: "",
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="bg-[#0f1419] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-bold text-white">Book a Strategy Call</h2>
                  <p className="text-white/60 text-sm mt-1">Free 30-minute consultation</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {isSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Request Submitted!</h3>
                    <p className="text-white/60 mb-6">
                      We'll contact you within 24 hours to schedule your free strategy call.
                    </p>
                    <button
                      onClick={handleClose}
                      className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Close
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="john@example.com"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+1 (555) 000-0000"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    {/* Service */}
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Service Interested In <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <select
                          name="service"
                          value={formData.service}
                          onChange={handleChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors appearance-none cursor-pointer"
                          required
                        >
                          <option value="" className="bg-[#0f1419]">Select a service...</option>
                          {SERVICES.map((service) => (
                            <option key={service} value={service} className="bg-[#0f1419]">
                              {service}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Other Service Input */}
                    {formData.service === "Other" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Please specify <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="otherService"
                          value={formData.otherService}
                          onChange={handleChange}
                          placeholder="Describe the service you're looking for..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors"
                          required
                        />
                      </motion.div>
                    )}

                    {/* Preferred Time */}
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Preferred Contact Time
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <select
                          name="preferredTime"
                          value={formData.preferredTime}
                          onChange={handleChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-[#0f1419]">Select preferred time...</option>
                          {TIME_PREFERENCES.map((time) => (
                            <option key={time} value={time} className="bg-[#0f1419]">
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Message (Optional)
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-white/40" />
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Tell us about your financial goals..."
                          rows={3}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors resize-none"
                        />
                      </div>
                    </div>

                    {/* Error */}
                    {error && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-400 text-sm"
                      >
                        {error}
                      </motion.p>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Phone className="w-5 h-5" />
                          Request Call Back
                        </>
                      )}
                    </button>

                    <p className="text-white/40 text-xs text-center">
                      We'll contact you within 24 hours to confirm your appointment.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
