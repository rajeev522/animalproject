import React, { useState, useEffect } from "react";
import {
  Heart,
  Sparkles,
  MapPin,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  X,
  Search,
  Filter,
  AlertCircle,
  FileText,
  User,
  Phone,
  Mail,
  Home,
  Info
} from "lucide-react";
import { useApp } from "./App";
import { apiUrl } from "./lib/apiClient";

export interface AdoptionDog {
  id: string;
  _id?: string;
  name: string;
  animalType?: string;
  breed: string;
  age: string;
  gender?: "Male" | "Female" | "Unknown";
  location: string;
  image: string;
  photos?: string[];
  healthCondition?: string;
  vaccinated?: boolean;
  vaccinationStatus?: string;
  description?: string;
  listingType?: "Normal" | "Premium";
  status: "available" | "pending" | "adopted" | "unavailable";
  ngoName?: string;
  createdAt?: string;
}

export interface UserAdoptionRequest {
  id: string;
  requestId: string;
  dogId: string | AdoptionDog;
  dog?: AdoptionDog;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  preferredLocation: string;
  reasonForAdoption: string;
  petExperience: string;
  homeEnvironment: string;
  status: "Pending" | "Under Review" | "Approved" | "Rejected" | "Completed";
  adminNotes?: string;
  createdAt: string;
}

export function AdoptionPublicView() {
  const { user, addToast } = useApp();
  const [dogs, setDogs] = useState<AdoptionDog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDog, setSelectedDog] = useState<AdoptionDog | null>(null);
  const [applyModalDog, setApplyModalDog] = useState<AdoptionDog | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "Normal" | "Premium">("all");
  const [myRequestsModal, setMyRequestsModal] = useState(false);
  const [myRequests, setMyRequests] = useState<UserAdoptionRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Form State
  const [fullName, setFullName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [reasonForAdoption, setReasonForAdoption] = useState("");
  const [petExperience, setPetExperience] = useState("");
  const [homeEnvironment, setHomeEnvironment] = useState("");
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch dogs
  const fetchDogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl("/api/adoptions"));
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDogs(json.data);
      }
    } catch (err) {
      console.error("Failed to load adoption dogs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDogs();
  }, []);

  // Fetch My Requests
  const fetchMyRequests = async () => {
    if (!user) {
      addToast({ type: "info", title: "Login Required", message: "Please sign in to view your applications." });
      return;
    }
    setMyRequestsModal(true);
    setLoadingRequests(true);
    try {
      const token = localStorage.getItem("pawrescue_token");
      const res = await fetch(apiUrl("/api/adoptions/my-requests"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMyRequests(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalDog) return;

    if (!user) {
      addToast({ type: "warning", title: "Sign in Required", message: "Please sign in as a Reporter to submit an adoption request." });
      return;
    }

    if (!consentAgreed) {
      addToast({ type: "warning", title: "Consent Required", message: "Please consent to share contact information with the NGO." });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("pawrescue_token");
      const res = await fetch(apiUrl(`/api/adoptions/${applyModalDog.id}/apply`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          address,
          city,
          state,
          preferredLocation,
          reasonForAdoption,
          petExperience,
          homeEnvironment
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast({
          type: "success",
          title: "Application Submitted! 🐾",
          message: data.message || "Your adoption application has been submitted successfully."
        });
        setApplyModalDog(null);
        setSelectedDog(null);
        // Clear non-contact inputs
        setReasonForAdoption("");
        setPetExperience("");
        setHomeEnvironment("");
        setConsentAgreed(false);
      } else {
        addToast({
          type: "error",
          title: "Submission Error",
          message: data.message || "Failed to submit adoption request"
        });
      }
    } catch {
      addToast({ type: "error", title: "Network Error", message: "Could not submit application. Backend unreachable." });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDogs = dogs.filter((d) => {
    if (filterType !== "all" && (d.listingType || "Normal") !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.breed.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const premiumDogs = filteredDogs.filter((d) => d.listingType === "Premium");
  const normalDogs = filteredDogs.filter((d) => d.listingType !== "Premium");

  return (
    <div className="space-y-6">
      {/* Top Banner & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-emerald-500/10 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse" />
            <h2 className="text-xl font-black text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
              Adopt a Loving Companion 🐾
            </h2>
          </div>
          <p className="text-white/50 text-xs mt-1">
            Browse verified rescue dogs seeking forever homes. Every dog is vetted by certified animal rescue NGOs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {user && (
            <button
              onClick={fetchMyRequests}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-bold hover:bg-pink-500/30 transition-all shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" /> My Adoption Requests
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dogs by name, breed, or city..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/40"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${filterType === "all" ? "bg-white/15 border-white/30 text-white" : "bg-white/4 border-white/8 text-white/50"}`}
          >
            All Dogs ({dogs.length})
          </button>
          <button
            onClick={() => setFilterType("Premium")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${filterType === "Premium" ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : "bg-white/4 border-white/8 text-white/50"}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Premium
          </button>
          <button
            onClick={() => setFilterType("Normal")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${filterType === "Normal" ? "bg-sky-500/20 border-sky-500/50 text-sky-300" : "bg-white/4 border-white/8 text-white/50"}`}
          >
            Normal
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-white/40 text-xs">Loading adoption listings...</p>
        </div>
      ) : filteredDogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white/[0.02] border border-white/8 rounded-3xl p-8">
          <Heart className="w-10 h-10 text-white/20 mb-3" />
          <p className="text-white/60 text-sm font-bold">No dogs found</p>
          <p className="text-white/40 text-xs mt-1">Try modifying your search or filter options.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── 1. PREMIUM FEATURED DOGS SECTION ── */}
          {premiumDogs.length > 0 && filterType !== "Normal" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black font-black shadow-md shadow-amber-500/20">
                  <Sparkles className="w-4 h-4 text-black" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base flex items-center gap-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                    Featured Premium Listings
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Highlighted
                    </span>
                  </h3>
                  <p className="text-white/40 text-[11px]">Special profiles with comprehensive veterinary & health portfolios.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {premiumDogs.map((dog) => (
                  <div
                    key={dog.id}
                    className="relative bg-gradient-to-br from-amber-500/10 via-[#0E1712] to-[#0A120E] border-2 border-amber-500/30 hover:border-amber-400/60 rounded-3xl overflow-hidden p-4 shadow-xl transition-all duration-300 hover:shadow-amber-500/10 flex flex-col justify-between group"
                  >
                    {/* Badge */}
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[10px] font-black uppercase tracking-wider shadow-md">
                      <Sparkles className="w-3 h-3 fill-black" /> Premium Dog
                    </div>

                    <div className="absolute top-4 right-4 z-10">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider ${
                        dog.status === "available"
                          ? "bg-emerald-500/90 text-white"
                          : dog.status === "pending"
                          ? "bg-amber-500/90 text-white"
                          : "bg-red-500/90 text-white"
                      }`}>
                        {dog.status}
                      </span>
                    </div>

                    <div>
                      {/* Large Image Header */}
                      <div className="relative w-full h-52 rounded-2xl overflow-hidden mb-3 bg-black/40">
                        <img
                          src={dog.image}
                          alt={dog.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                          <div>
                            <h4 className="text-white font-extrabold text-xl leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
                              {dog.name}
                            </h4>
                            <p className="text-amber-200/90 text-xs font-medium">
                              {dog.breed} • {dog.age} • {dog.gender || "Male"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Detail Badges */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-2 flex items-center gap-1.5 text-white/80">
                          <MapPin className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                          <span className="truncate">{dog.location}</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-2 flex items-center gap-1.5 text-emerald-300">
                          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{dog.vaccinationStatus || (dog.vaccinated ? "Vaccinated" : "Vet Checked")}</span>
                        </div>
                      </div>

                      {dog.description && (
                        <p className="text-white/60 text-xs leading-relaxed line-clamp-2 mb-4 bg-black/20 p-2.5 rounded-xl border border-white/5">
                          "{dog.description}"
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => { setSelectedDog(dog); setActivePhotoIdx(0); }}
                        className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold transition-all"
                      >
                        View Full Details
                      </button>
                      <button
                        disabled={dog.status !== "available"}
                        onClick={() => {
                          if (dog.status === "available") {
                            setApplyModalDog(dog);
                          }
                        }}
                        className={`flex-[1.2] py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md ${
                          dog.status === "available"
                            ? "bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 text-black hover:opacity-95 shadow-amber-500/20"
                            : "bg-white/10 text-white/40 cursor-not-allowed"
                        }`}
                      >
                        <Heart className="w-3.5 h-3.5 fill-black" />
                        {dog.status === "available" ? "Adopt Now 🐾" : "Adopted"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 2. ALL / NORMAL DOGS SECTION ── */}
          {normalDogs.length > 0 && filterType !== "Premium" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <Heart className="w-4 h-4 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base" style={{ fontFamily: "'Sora', sans-serif" }}>
                    Standard Adoption Listings
                  </h3>
                  <p className="text-white/40 text-[11px]">All available rescue dogs ready for caring adoptive parents.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {normalDogs.map((dog) => (
                  <div
                    key={dog.id}
                    className="bg-white/[0.04] border border-white/10 hover:border-pink-500/30 rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300"
                  >
                    <div>
                      {/* Image */}
                      <div className="relative aspect-square w-full overflow-hidden bg-black/40">
                        <img
                          src={dog.image}
                          alt={dog.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-lg bg-sky-500/80 text-white uppercase tracking-wider">
                          Normal
                        </span>
                        {dog.status !== "available" && (
                          <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-lg bg-red-500/90 text-white uppercase tracking-wider">
                            {dog.status}
                          </span>
                        )}
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white font-bold text-sm leading-tight truncate">{dog.name}</p>
                          <p className="text-white/60 text-[10px] truncate">{dog.breed} • {dog.age}</p>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3 space-y-1.5">
                        <div className="flex items-center gap-1 text-white/50 text-[10px]">
                          <MapPin className="w-2.5 h-2.5 text-orange-400 flex-shrink-0" />
                          <span className="truncate">{dog.location}</span>
                        </div>
                        {dog.ngoName && (
                          <p className="text-white/40 text-[9px] truncate">NGO: {dog.ngoName}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2.5 pt-0 flex gap-1.5">
                      <button
                        onClick={() => { setSelectedDog(dog); setActivePhotoIdx(0); }}
                        className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-[10px] font-semibold transition-all border border-white/5"
                      >
                        Details
                      </button>
                      <button
                        disabled={dog.status !== "available"}
                        onClick={() => {
                          if (dog.status === "available") {
                            setApplyModalDog(dog);
                          }
                        }}
                        className={`flex-[1.4] py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          dog.status === "available"
                            ? "bg-pink-500/20 border border-pink-500/30 text-pink-300 hover:bg-pink-500/30"
                            : "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                        }`}
                      >
                        {dog.status === "available" ? "Adopt Now 🐾" : "Adopted"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 3. DETAILED VIEW MODAL ── */}
      {selectedDog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4" onClick={() => setSelectedDog(null)}>
          <div
            className="bg-[#0A120E] border border-white/15 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "fadeUp 0.3s ease both" }}
          >
            {/* Close Icon */}
            <button
              onClick={() => setSelectedDog(null)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/90 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Photo Gallery */}
            <div className="relative w-full aspect-video bg-black/50">
              <img
                src={selectedDog.photos?.[activePhotoIdx] || selectedDog.image}
                alt={selectedDog.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl shadow-md ${
                  selectedDog.listingType === "Premium" ? "bg-amber-400 text-black" : "bg-sky-500 text-white"
                }`}>
                  {selectedDog.listingType || "Normal"}
                </span>
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-xl bg-black/60 border border-white/20 text-emerald-400">
                  {selectedDog.status}
                </span>
              </div>

              {/* Multi-photo Thumbnails */}
              {selectedDog.photos && selectedDog.photos.length > 1 && (
                <div className="absolute bottom-2 left-2 right-2 flex gap-1.5 overflow-x-auto p-1 bg-black/50 backdrop-blur-sm rounded-xl">
                  {selectedDog.photos.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhotoIdx(i)}
                      className={`w-10 h-10 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                        activePhotoIdx === i ? "border-amber-400 scale-105" : "border-white/20 opacity-60"
                      }`}
                    >
                      <img src={p} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Content */}
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-2xl font-black text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {selectedDog.name}
                </h3>
                <p className="text-white/50 text-sm">
                  {selectedDog.breed} • {selectedDog.age} • {selectedDog.gender || "Male"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-white/40 text-[10px] uppercase font-bold">Health Condition</p>
                  <p className="text-white font-semibold mt-0.5">{selectedDog.healthCondition || "Healthy & Active"}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-white/40 text-[10px] uppercase font-bold">Vaccination Status</p>
                  <p className="text-emerald-400 font-semibold mt-0.5">{selectedDog.vaccinationStatus || (selectedDog.vaccinated ? "Fully Vaccinated" : "Pending")}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-white/40 text-[10px] uppercase font-bold">Location</p>
                  <p className="text-white font-semibold mt-0.5">{selectedDog.location}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-white/40 text-[10px] uppercase font-bold">Rescued By</p>
                  <p className="text-white font-semibold mt-0.5">{selectedDog.ngoName || "PawRescue Trust"}</p>
                </div>
              </div>

              {selectedDog.description && (
                <div>
                  <p className="text-white/40 text-[10px] uppercase font-bold mb-1">About {selectedDog.name}</p>
                  <p className="text-white/70 text-xs leading-relaxed bg-white/4 p-3 rounded-xl border border-white/8">
                    {selectedDog.description}
                  </p>
                </div>
              )}

              {/* Action */}
              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setSelectedDog(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold hover:bg-white/10"
                >
                  Close
                </button>
                <button
                  disabled={selectedDog.status !== "available"}
                  onClick={() => {
                    setApplyModalDog(selectedDog);
                    setSelectedDog(null);
                  }}
                  className={`flex-[2] py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                    selectedDog.status === "available"
                      ? "bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white shadow-pink-500/25 hover:brightness-110"
                      : "bg-white/10 text-white/30 cursor-not-allowed"
                  }`}
                >
                  <Heart className="w-4 h-4 fill-white" />
                  {selectedDog.status === "available" ? `Apply to Adopt ${selectedDog.name} 🐾` : "Already Adopted"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. ADOPTION APPLICATION FORM MODAL ── */}
      {applyModalDog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4" onClick={() => setApplyModalDog(null)}>
          <div
            className="bg-[#0A120E] border border-pink-500/30 rounded-3xl w-full max-w-lg max-h-[82vh] sm:max-h-[85vh] flex flex-col shadow-2xl relative my-auto mb-20 sm:mb-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "fadeUp 0.3s ease both" }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 pb-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <img src={applyModalDog.image} alt={applyModalDog.name} className="w-12 h-12 rounded-xl object-cover border border-white/20" />
                <div>
                  <h3 className="text-white font-black text-lg" style={{ fontFamily: "'Sora', sans-serif" }}>
                    Adoption Application
                  </h3>
                  <p className="text-pink-400 text-xs font-bold">Applying for: {applyModalDog.name} ({applyModalDog.breed})</p>
                </div>
              </div>
              <button onClick={() => setApplyModalDog(null)} className="text-white/40 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleApplySubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs scrollbar-thin scrollbar-thumb-white/20">
              {/* Applicant Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rajeev Gupta"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/20 focus:border-pink-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/20 focus:border-pink-500/50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/20 focus:border-pink-500/50 outline-none"
                />
              </div>

              {/* Address and City */}
              <div>
                <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">Current Street Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. House #14, Sector 12"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/20 focus:border-pink-500/50 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. New Delhi"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/20 focus:border-pink-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Delhi NCR"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/20 focus:border-pink-500/50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">Preferred Location for Adoption Pickup / Visit</label>
                <input
                  type="text"
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  placeholder="e.g. At NGO shelter or local vet clinic"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/20 focus:border-pink-500/50 outline-none"
                />
              </div>

              {/* Reasons & Care Arrangement */}
              <div>
                <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">Reason for Adopting *</label>
                <textarea
                  required
                  rows={2}
                  value={reasonForAdoption}
                  onChange={(e) => setReasonForAdoption(e.target.value)}
                  placeholder="Why do you want to adopt this dog? Share your love and motivation..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/20 focus:border-pink-500/50 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">Experience with Pets</label>
                  <input
                    type="text"
                    value={petExperience}
                    onChange={(e) => setPetExperience(e.target.value)}
                    placeholder="e.g. Raised 2 dogs, familiar with Indie breeds"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/20 focus:border-pink-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">Home Environment & Arrangements</label>
                  <input
                    type="text"
                    value={homeEnvironment}
                    onChange={(e) => setHomeEnvironment(e.target.value)}
                    placeholder="e.g. Fenced garden, someone always at home"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/20 focus:border-pink-500/50 outline-none"
                  />
                </div>
              </div>

              {/* Consent Checkbox */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="mt-0.5 rounded accent-pink-500 cursor-pointer w-4 h-4"
                />
                <label htmlFor="consent" className="text-white/70 text-[11px] leading-relaxed cursor-pointer select-none">
                  I understand and agree that my submitted contact information, residential address, and adoption details will be securely shared with the verified NGO admin managing this dog's adoption.
                </label>
              </div>

              {/* Bottom Submit Sticky / Static Buttons */}
              <div className="sticky bottom-0 bg-[#0A120E] pt-3 pb-1 border-t border-white/10 flex gap-3 z-10">
                <button
                  type="button"
                  onClick={() => setApplyModalDog(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold hover:bg-white/10 transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 hover:brightness-110 transition-all disabled:opacity-50 text-xs"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Adoption Request 🐾
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 5. USER'S MY REQUESTS STATUS MODAL ── */}
      {myRequestsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setMyRequestsModal(false)}>
          <div
            className="bg-[#0A120E] border border-white/15 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "fadeUp 0.3s ease both" }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-pink-400" />
                <h3 className="text-white font-bold text-lg" style={{ fontFamily: "'Sora', sans-serif" }}>
                  My Adoption Applications
                </h3>
              </div>
              <button onClick={() => setMyRequestsModal(false)} className="text-white/40 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingRequests ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : myRequests.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-10 h-10 text-white/20 mx-auto mb-2" />
                <p className="text-white/60 text-sm font-bold">No applications submitted yet</p>
                <p className="text-white/40 text-xs mt-1">When you apply to adopt a dog, your request and its real-time approval status will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((req) => (
                  <div key={req.id} className="bg-white/4 border border-white/10 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-pink-400 font-bold text-xs">#{req.requestId}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider ${
                        req.status === "Approved"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : req.status === "Rejected"
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : req.status === "Completed"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {req.dog?.image && (
                        <img src={req.dog.image} alt={req.dog.name} className="w-12 h-12 rounded-xl object-cover" />
                      )}
                      <div>
                        <p className="text-white font-bold text-sm">{req.dog?.name || "Dog Listing"}</p>
                        <p className="text-white/40 text-[11px]">{req.dog?.breed || "Indie"} • {req.city}, {req.state}</p>
                      </div>
                    </div>

                    {req.adminNotes && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-emerald-200 text-[11px]">
                        <span className="font-bold">NGO Admin Note: </span>
                        {req.adminNotes}
                      </div>
                    )}

                    <div className="text-white/30 text-[10px] flex items-center justify-between pt-1 border-t border-white/5">
                      <span>Submitted: {new Date(req.createdAt).toLocaleDateString()}</span>
                      <span>NGO will review and contact you on: {req.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
