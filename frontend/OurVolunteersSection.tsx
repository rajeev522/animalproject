import React, { useState } from "react";
import { Heart, Award, Shield, Users, MapPin, Gift, X, CheckCircle2, Sparkles, QrCode } from "lucide-react";

interface Volunteer {
  id: number;
  name: string;
  role: string;
  photo: string;
  badge: string;
  rescuesAssisted: string;
  distance: string;
  area: string;
  upiVpa: string;
}

const SAMPLE_VOLUNTEERS: Volunteer[] = [
  {
    id: 1,
    name: "Aarav Sharma",
    role: "Animal Rescuer",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    badge: "Field Hero",
    rescuesAssisted: "45+ Rescues",
    distance: "1.2 km away",
    area: "Defence Colony / Lajpat Nagar",
    upiVpa: "aarav.rescue@okhdfcbank",
  },
  {
    id: 2,
    name: "Pooja Verma",
    role: "Dog Feeder & Caregiver",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80",
    badge: "Community Star",
    rescuesAssisted: "Daily Stray Feeder",
    distance: "2.1 km away",
    area: "Greater Kailash / CR Park",
    upiVpa: "pooja.feeds@paytm",
  },
  {
    id: 3,
    name: "Vikram Malhotra",
    role: "Rescue Assistant",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    badge: "First Responder",
    rescuesAssisted: "30+ Rescues",
    distance: "2.8 km away",
    area: "Hauz Khas / Green Park",
    upiVpa: "vikram.malhotra@ybl",
  },
  {
    id: 4,
    name: "Ananya Iyer",
    role: "Volunteer Coordinator",
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80",
    badge: "Operations Lead",
    rescuesAssisted: "Network Anchor",
    distance: "3.5 km away",
    area: "Vasant Vihar / RK Puram",
    upiVpa: "ananya.iyer@okaxis",
  },
  {
    id: 5,
    name: "Rohan Kulkarni",
    role: "Veterinary Support Volunteer",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    badge: "Medical Aid",
    rescuesAssisted: "First-Aid Helper",
    distance: "4.2 km away",
    area: "Malviya Nagar / Saket",
    upiVpa: "rohan.vet@icici",
  },
  {
    id: 6,
    name: "Sneha Nair",
    role: "Adoption & Foster Volunteer",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    badge: "Foster Angel",
    rescuesAssisted: "20+ Fosters",
    distance: "5.1 km away",
    area: "Noida Sector 18 / Atta",
    upiVpa: "sneha.foster@ibl",
  },
  {
    id: 7,
    name: "Karan Mehta",
    role: "Night Emergency Volunteer",
    photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80",
    badge: "Night Watch",
    rescuesAssisted: "Emergency Response",
    distance: "5.7 km away",
    area: "Gurugram DLF Phase 3",
    upiVpa: "karan.nightrescue@paytm",
  },
];

export function OurVolunteersSection() {
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [donationDone, setDonationDone] = useState(false);

  const handleOpenDonate = (v: Volunteer) => {
    setSelectedVolunteer(v);
    setAmount(100);
    setDonationDone(false);
  };

  const handleConfirmPaid = () => {
    setDonationDone(true);
    setTimeout(() => {
      setSelectedVolunteer(null);
      setDonationDone(false);
    }, 2500);
  };

  return (
    <div className="w-full mt-10 rounded-[2.5rem] bg-[#0A150D]/60 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 relative z-10 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Users className="w-3.5 h-3.5" />
            </span>
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Nearby Volunteers
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
            Meet Our Volunteers
          </h2>
          <p className="text-white/50 text-xs mt-1">
            People working together to help and protect animals right around your neighborhood.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            Nearby in Your City
          </span>
        </div>
      </div>

      {/* Volunteers Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 relative z-10">
        {SAMPLE_VOLUNTEERS.map((v) => (
          <div
            key={v.id}
            className="group rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/8 hover:border-emerald-500/30 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5 flex flex-col justify-between"
          >
            <div>
              {/* Photo & Badge */}
              <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 border border-white/10 bg-black/40">
                <img
                  src={v.photo}
                  alt={v.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Distance Badge (Nearby) */}
                <div className="absolute top-2 left-2">
                  <span className="bg-black/70 backdrop-blur-md text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                    <MapPin className="w-2.5 h-2.5" />
                    {v.distance}
                  </span>
                </div>

                <div className="absolute top-2 right-2">
                  <span className="bg-black/70 backdrop-blur-md text-[10px] font-bold text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1 shadow-sm">
                    <Award className="w-2.5 h-2.5 text-amber-400" />
                    {v.badge}
                  </span>
                </div>
              </div>

              {/* Name & Role */}
              <h4 className="text-white font-bold text-sm tracking-wide group-hover:text-emerald-300 transition-colors">
                {v.name}
              </h4>
              <p className="text-white/50 text-xs font-medium mt-0.5">
                {v.role}
              </p>

              {/* Location Area */}
              <p className="text-white/40 text-[10px] mt-1 flex items-center gap-1 truncate">
                <MapPin className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                {v.area}
              </p>
            </div>

            {/* Bottom Actions & Support/Donation Button */}
            <div className="mt-3 pt-3 border-t border-white/5 space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-emerald-400/90 font-semibold">{v.rescuesAssisted}</span>
                <span className="text-white/30 text-[10px] flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-500/70" /> Nearby Hero
                </span>
              </div>

              {/* Donate To Volunteer Button */}
              <button
                onClick={() => handleOpenDonate(v)}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 via-emerald-500/25 to-teal-500/20 hover:from-emerald-500 hover:to-teal-600 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md group/btn"
              >
                <Heart className="w-3.5 h-3.5 text-pink-400 group-hover/btn:scale-110 transition-transform fill-pink-500/40" />
                <span>Support & Donate</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Volunteer Direct Donation Modal ── */}
      {selectedVolunteer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#0A140E] border border-emerald-500/30 rounded-[2rem] w-full max-w-md p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedVolunteer(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header with Volunteer Photo */}
            <div className="flex items-center gap-3.5">
              <img
                src={selectedVolunteer.photo}
                alt={selectedVolunteer.name}
                className="w-14 h-14 rounded-2xl object-cover border border-emerald-500/40 shadow-md"
              />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {selectedVolunteer.distance}
                </span>
                <h3 className="text-lg font-bold text-white mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Support {selectedVolunteer.name}
                </h3>
                <p className="text-white/40 text-xs">{selectedVolunteer.role} · {selectedVolunteer.area}</p>
              </div>
            </div>

            {donationDone ? (
              <div className="text-center py-6 space-y-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/25 p-5">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-white font-bold text-base">Thank You for Your Support! ❤️</h4>
                <p className="text-white/60 text-xs">
                  Your direct donation helps {selectedVolunteer.name} fund stray dog meals, medical gauze, and rescue travel.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-white/60 text-xs leading-relaxed">
                  Support local volunteers in your area with direct funds for stray dog food, antiseptic ointments, and emergency fuel.
                </p>

                {/* Amount Selectors */}
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-2">Select Contribution Amount (₹)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[50, 100, 250, 500].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(val)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          amount === val
                            ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30"
                            : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                        }`}
                      >
                        ₹{val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct UPI Box */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Volunteer UPI ID:</span>
                    <span className="text-emerald-400 font-mono font-bold text-xs">{selectedVolunteer.upiVpa}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                    <span className="text-white/50">Service Area:</span>
                    <span className="text-white font-medium">{selectedVolunteer.area}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVolunteer(null)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white text-xs font-bold border border-white/8"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPaid}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    <span>Pay ₹{amount}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
