import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  PlusCircle,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Filter,
  Image as ImageIcon,
  Share2,
  Phone,
  User,
  Shield,
  Upload,
  X,
  RefreshCw,
  Dog,
  ExternalLink,
} from "lucide-react";
import { useApp } from "./App";
import { apiUrl } from "./lib/apiClient";

interface LostFoundReportItem {
  _id: string;
  reportType: "lost" | "found";
  dogName: string;
  photos: string[];
  features?: {
    breed?: string;
    age?: string;
    gender?: string;
    height?: string;
    approximateWeight?: string;
    primaryColor?: string;
    secondaryColor?: string;
    identifyingMarks?: string;
    earShape?: string;
    tailCharacteristics?: string;
    collarDetails?: string;
  };
  dateIncident: string;
  timeIncident?: string;
  location: {
    address: string;
    city: string;
    state: string;
  };
  currentLocation?: string;
  description?: string;
  contactInfo: {
    name: string;
    phone: string;
    email?: string;
    shareConsent?: boolean;
  };
  status: "open" | "resolved" | "closed";
  reporterUser?: string;
  possibleMatches?: Array<{
    matchedPetId: any;
    similarityScore: number;
    matchedCharacteristics: string[];
    differences: string[];
  }>;
  createdAt: string;
}

export function LostFoundSection() {
  const { user, addToast } = useApp();
  const [tab, setTab] = useState<"all" | "lost" | "found" | "my-reports">("all");
  const [reports, setReports] = useState<LostFoundReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"lost" | "found">("lost");
  const [selectedReport, setSelectedReport] = useState<LostFoundReportItem | null>(null);
  const [aiMatchingId, setAiMatchingId] = useState<string | null>(null);
  const [aiMatchResults, setAiMatchResults] = useState<any[] | null>(null);

  // Form Fields
  const [dogName, setDogName] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "unknown">("unknown");
  const [height, setHeight] = useState("");
  const [approximateWeight, setApproximateWeight] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [identifyingMarks, setIdentifyingMarks] = useState("");
  const [earShape, setEarShape] = useState("");
  const [tailCharacteristics, setTailCharacteristics] = useState("");
  const [collarDetails, setCollarDetails] = useState("");
  const [dateIncident, setDateIncident] = useState(new Date().toISOString().split("T")[0]);
  const [timeIncident, setTimeIncident] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Delhi");
  const [state, setState] = useState("Delhi");
  const [currentLocation, setCurrentLocation] = useState("");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState(user?.name || "");
  const [contactPhone, setContactPhone] = useState(user?.phone || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [consent, setConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch reports
  const fetchReports = async () => {
    setLoading(true);
    try {
      let url = `${apiUrl("/api/lost-found")}`;
      const params = new URLSearchParams();
      if (tab === "lost") params.append("reportType", "lost");
      if (tab === "found") params.append("reportType", "found");
      if (tab === "my-reports") params.append("onlyMine", "true");
      if (searchQuery) params.append("search", searchQuery);

      const qs = params.toString();
      if (qs) url += `?${qs}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${(localStorage.getItem("pawrescue_token") || localStorage.getItem("token")) || ""}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setReports(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching lost/found reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [tab, searchQuery]);

  // Handle multiple image uploads
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !city.trim() || !state.trim()) {
      addToast({ type: "error", title: "Missing Location", message: "Please enter street address, city, and state." });
      return;
    }
    if (!contactName.trim() || !contactPhone.trim()) {
      addToast({ type: "error", title: "Missing Contact", message: "Name and phone number are required." });
      return;
    }
    if (photos.length === 0) {
      addToast({ type: "error", title: "Photo Required", message: "Please upload at least one photo of the dog." });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        reportType: formMode,
        dogName: formMode === "lost" ? dogName : dogName || "Found Dog",
        photos,
        features: {
          breed,
          age,
          gender,
          height,
          approximateWeight,
          primaryColor,
          secondaryColor,
          identifyingMarks,
          earShape,
          tailCharacteristics,
          collarDetails,
        },
        dateIncident,
        timeIncident,
        location: {
          address,
          city,
          state,
        },
        currentLocation: formMode === "found" ? currentLocation : undefined,
        description,
        contactInfo: {
          name: contactName,
          phone: contactPhone,
          email: contactEmail,
          shareConsent: consent,
        },
      };

      const res = await fetch(apiUrl("/api/lost-found"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(localStorage.getItem("pawrescue_token") || localStorage.getItem("token")) || ""}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        addToast({
          type: "success",
          title: "Report Submitted! 🎉",
          message: `${formMode === "lost" ? "Lost" : "Found"} dog report is now live in the network.`,
        });
        setIsFormOpen(false);
        resetForm();
        fetchReports();
      } else {
        addToast({ type: "error", title: "Submission Failed", message: data.message || "Failed to submit." });
      }
    } catch {
      addToast({ type: "error", title: "Network Error", message: "Failed to connect to server." });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setDogName("");
    setPhotos([]);
    setBreed("");
    setAge("");
    setGender("unknown");
    setHeight("");
    setApproximateWeight("");
    setPrimaryColor("");
    setSecondaryColor("");
    setIdentifyingMarks("");
    setEarShape("");
    setTailCharacteristics("");
    setCollarDetails("");
    setDescription("");
    setCurrentLocation("");
  };

  // Run on-demand AI Match
  const handleRunAiMatch = async (reportId: string) => {
    setAiMatchingId(reportId);
    try {
      const res = await fetch(apiUrl(`/api/lost-found/${reportId}/match`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${(localStorage.getItem("pawrescue_token") || localStorage.getItem("token")) || ""}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setAiMatchResults(data.data || []);
      } else {
        addToast({ type: "info", title: "AI Match Scan", message: "No counter reports found to match against." });
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to run AI Match scan." });
    } finally {
      setAiMatchingId(null);
    }
  };

  // Mark dog as resolved/found
  const handleMarkResolved = async (reportId: string) => {
    if (!window.confirm("Has this dog been reunited with its family?")) return;
    try {
      const res = await fetch(apiUrl(`/api/lost-found/${reportId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(localStorage.getItem("pawrescue_token") || localStorage.getItem("token")) || ""}`,
        },
        body: JSON.stringify({ status: "resolved" }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({ type: "success", title: "Reunited! 🐾", message: "Status marked as reunited." });
        fetchReports();
        if (selectedReport?._id === reportId) {
          setSelectedReport(null);
        }
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to update report status." });
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header Banner ── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-sky-950/60 via-[#06141F] to-[#0A0F0D] border border-sky-500/25 p-6 backdrop-blur-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-sky-400 text-xs font-bold uppercase tracking-widest">
                AI Lost & Found Network
              </span>
            </div>
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
              Lost & Found Pets
            </h2>
            <p className="text-white/60 text-xs mt-1 max-w-xl">
              Report missing pets or dogs you have spotted. Our computer-vision AI automatically scans coat colors, patterns, and features to suggest verified matches.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => {
                setFormMode("lost");
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-bold tracking-wide transition-all shadow-lg shadow-red-500/10"
            >
              <AlertCircle className="w-4 h-4 text-red-400" />
              Report Lost Dog
            </button>
            <button
              onClick={() => {
                setFormMode("found");
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold tracking-wide transition-all shadow-lg shadow-emerald-500/10"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Report Found Dog
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 border-t border-white/5 pt-4">
          {[
            { id: "all", label: "All Listings" },
            { id: "lost", label: "Lost Dogs" },
            { id: "found", label: "Found Dogs" },
            { id: "my-reports", label: "My Reports" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                tab === t.id
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                  : "bg-white/5 text-white/50 hover:text-white border border-white/8"
              }`}
            >
              {t.label}
            </button>
          ))}

          {/* Search bar */}
          <div className="ml-auto relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search breed, color, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-sky-500/50"
            />
          </div>
        </div>
      </div>

      {/* ── Reports Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 text-center rounded-[2rem] border border-white/10 bg-white/[0.02]">
          <Dog className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white font-bold text-sm">No Pet Reports Found</p>
          <p className="text-white/40 text-xs mt-1">Be the first to report a missing or found pet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((item) => {
            const isLost = item.reportType === "lost";
            const mainPhoto = item.photos?.[0] || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80";
            const isResolved = item.status === "resolved";

            return (
              <div
                key={item._id}
                className={`group rounded-[1.8rem] overflow-hidden border transition-all duration-300 hover:shadow-2xl flex flex-col ${
                  isLost
                    ? "bg-[#140D0E]/60 border-red-500/20 hover:border-red-500/40 hover:shadow-red-500/5"
                    : "bg-[#0A150F]/60 border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-emerald-500/5"
                }`}
              >
                {/* Photo & Badges */}
                <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                  <img
                    src={mainPhoto}
                    alt={item.dogName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-md border ${
                        isLost
                          ? "bg-red-500/80 text-white border-red-400/30"
                          : "bg-emerald-500/80 text-white border-emerald-400/30"
                      }`}
                    >
                      {isLost ? "🚨 LOST PET" : "🐾 FOUND PET"}
                    </span>
                    {isResolved && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-green-500 text-white shadow-md">
                        REUNITED 🎉
                      </span>
                    )}
                  </div>

                  {item.photos && item.photos.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-white border border-white/20">
                      +{item.photos.length - 1} photos
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-white font-bold text-lg leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
                        {item.dogName}
                      </h3>
                      <span className="text-[10px] text-white/40 font-mono">
                        {new Date(item.dateIncident).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sky-300/80 text-xs font-semibold mt-1">
                      {item.features?.breed || "Breed Unknown"} · {item.features?.gender || "Unknown Gender"}
                    </p>

                    <p className="text-white/50 text-xs flex items-center gap-1 mt-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      {item.location.address}, {item.location.city}
                    </p>

                    {/* Identifying traits badges */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.features?.primaryColor && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/60">
                          Color: {item.features.primaryColor}
                        </span>
                      )}
                      {item.features?.identifyingMarks && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/60">
                          Marks: {item.features.identifyingMarks}
                        </span>
                      )}
                      {item.features?.collarDetails && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/60">
                          Collar: {item.features.collarDetails}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedReport(item)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-all border border-white/10"
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => handleRunAiMatch(item._id)}
                      disabled={aiMatchingId === item._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 text-violet-300 text-xs font-bold transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      {aiMatchingId === item._id ? "Scanning..." : "AI Match"}
                    </button>

                    {item.possibleMatches && item.possibleMatches.length > 0 && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                        {item.possibleMatches.length} Matches
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Submission Modal Form ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 pb-28 sm:pb-6 overflow-y-auto">
          <div className="bg-[#0A120E] border border-white/15 rounded-[2rem] w-full max-w-2xl max-h-[80vh] sm:max-h-[88vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative mb-12 sm:mb-0">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                  formMode === "lost" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {formMode === "lost" ? "🚨" : "🐾"}
              </div>
              <div>
                <h3 className="text-xl font-black text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {formMode === "lost" ? "Report a Lost Dog" : "Report a Found Dog"}
                </h3>
                <p className="text-white/40 text-xs">
                  {formMode === "lost"
                    ? "Provide dog photos and traits to alert local shelters and trigger AI visual matching."
                    : "Help reunite a found stray with their pet parent."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-5">
              {/* Photos upload */}
              <div>
                <label className="block text-xs font-bold text-white/70 mb-2">
                  Upload Dog Photos (Multiple Allowed) *
                </label>
                <div className="flex flex-wrap gap-3">
                  {photos.map((src, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/20">
                      <img src={src} alt="Uploaded dog" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 rounded-xl border border-dashed border-white/30 hover:border-sky-400 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white/5">
                    <Upload className="w-5 h-5 text-white/40 mb-1" />
                    <span className="text-[9px] text-white/40">Add Photo</span>
                    <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Dog Identification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">
                    {formMode === "lost" ? "Dog Name *" : "Temporary / Nick Name"}
                  </label>
                  <input
                    type="text"
                    value={dogName}
                    onChange={(e) => setDogName(e.target.value)}
                    placeholder="e.g. Bruno"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-sky-500 focus:outline-none"
                    required={formMode === "lost"}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">Breed (if known)</label>
                  <input
                    type="text"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    placeholder="e.g. Golden Retriever, Indie Mix"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">Approximate Age</label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 2 years, Puppy"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06100A] border border-white/10 text-white text-xs focus:border-sky-500 focus:outline-none"
                  >
                    <option value="unknown">Unknown</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* Physical Characteristics (AI Matching Traits) */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 space-y-4">
                <p className="text-xs font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Visual & Distinct Traits (For AI Matching)
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-white/60 mb-1">Primary Color</label>
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="e.g. Golden, Black"
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/60 mb-1">Secondary Color</label>
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="e.g. White chest"
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/60 mb-1">Ear Shape</label>
                    <input
                      type="text"
                      value={earShape}
                      onChange={(e) => setEarShape(e.target.value)}
                      placeholder="e.g. Floppy, Pointed"
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/60 mb-1">Tail Characteristics</label>
                    <input
                      type="text"
                      value={tailCharacteristics}
                      onChange={(e) => setTailCharacteristics(e.target.value)}
                      placeholder="e.g. Bushy, Curled"
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-white/60 mb-1">Height & Approx Weight</label>
                    <input
                      type="text"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="e.g. Medium height, ~18kg"
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/60 mb-1">Identifying Marks / Scars</label>
                    <input
                      type="text"
                      value={identifyingMarks}
                      onChange={(e) => setIdentifyingMarks(e.target.value)}
                      placeholder="e.g. Black spot over left eye"
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/60 mb-1">Collar / Tag Details</label>
                    <input
                      type="text"
                      value={collarDetails}
                      onChange={(e) => setCollarDetails(e.target.value)}
                      placeholder="e.g. Red collar with brass tag"
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Incident Date & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">
                    {formMode === "lost" ? "Date Missing *" : "Date Found *"}
                  </label>
                  <input
                    type="date"
                    value={dateIncident}
                    onChange={(e) => setDateIncident(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">Approximate Time</label>
                  <input
                    type="text"
                    value={timeIncident}
                    onChange={(e) => setTimeIncident(e.target.value)}
                    placeholder="e.g. 5:30 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">City & State *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-1/2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                      required
                    />
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                      className="w-1/2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">
                  {formMode === "lost" ? "Last Seen Location Address *" : "Found Spot Location *"}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Community Park, Sector 15"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                  required
                />
              </div>

              {formMode === "found" && (
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">
                    Current Dog Location (Where is the dog right now?)
                  </label>
                  <input
                    type="text"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    placeholder="e.g. Safe at my home / Near local veterinary clinic"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">Additional Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any behavioral traits (friendly, timid), medical needs, or other clues..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs resize-none"
                />
              </div>

              {/* Contact Information */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 space-y-3">
                <p className="text-xs font-bold text-white/90">
                  {formMode === "lost" ? "Owner Contact Information" : "Finder Contact Information"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Full Name *"
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                    required
                  />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Phone Number *"
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
                    required
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="rounded bg-white/10 border-white/20 text-emerald-500"
                  />
                  <label htmlFor="consent" className="text-[11px] text-white/50">
                    I consent to sharing this contact information with potential pet parents and verified rescue NGOs.
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="sticky bottom-0 -mx-6 -mb-6 md:-mx-8 md:-mb-8 px-6 py-4 md:px-8 bg-[#0A120E]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-end gap-3 z-20">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-xl transition-all ${
                    formMode === "lost"
                      ? "bg-red-500 hover:bg-red-400 shadow-red-500/30"
                      : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30"
                  }`}
                >
                  {submitting ? "Submitting Report..." : `Publish ${formMode === "lost" ? "Lost" : "Found"} Report`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Detail & Match Comparison Modal ── */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 pb-28 sm:pb-6 overflow-y-auto">
          <div className="bg-[#0A120E] border border-white/20 rounded-[2.5rem] w-full max-w-2xl max-h-[80vh] sm:max-h-[88vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative mb-12 sm:mb-0">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-black uppercase px-3 py-1 rounded-xl ${
                  selectedReport.reportType === "lost" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {selectedReport.reportType === "lost" ? "LOST PET" : "FOUND PET"}
              </span>
              <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                {selectedReport.dogName}
              </h2>
            </div>

            {/* Photo Gallery */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {selectedReport.photos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={selectedReport.dogName}
                  className="w-48 h-48 rounded-2xl object-cover border border-white/10 flex-shrink-0"
                />
              ))}
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/8 text-xs">
              <div>
                <span className="text-white/40 block">Breed</span>
                <span className="text-white font-semibold">{selectedReport.features?.breed || "Unknown"}</span>
              </div>
              <div>
                <span className="text-white/40 block">Age / Gender</span>
                <span className="text-white font-semibold">
                  {selectedReport.features?.age || "N/A"} · {selectedReport.features?.gender || "Unknown"}
                </span>
              </div>
              <div>
                <span className="text-white/40 block">Colors</span>
                <span className="text-white font-semibold">
                  {selectedReport.features?.primaryColor || "N/A"} / {selectedReport.features?.secondaryColor || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-white/40 block">Ear & Tail</span>
                <span className="text-white font-semibold">
                  {selectedReport.features?.earShape || "N/A"}, {selectedReport.features?.tailCharacteristics || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-white/40 block">Collar</span>
                <span className="text-white font-semibold">{selectedReport.features?.collarDetails || "None"}</span>
              </div>
              <div>
                <span className="text-white/40 block">Date of Incident</span>
                <span className="text-white font-semibold">
                  {new Date(selectedReport.dateIncident).toLocaleDateString()}
                </span>
              </div>
            </div>

            {selectedReport.description && (
              <div>
                <h4 className="text-xs font-bold text-white/50 mb-1">Description & Clues</h4>
                <p className="text-white/80 text-xs leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                  {selectedReport.description}
                </p>
              </div>
            )}

            {/* Contact Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">{selectedReport.contactInfo.name}</p>
                <p className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5" /> {selectedReport.contactInfo.phone}
                </p>
              </div>
              <a
                href={`tel:${selectedReport.contactInfo.phone}`}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1"
              >
                Call Contact
              </a>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 -mx-6 -mb-6 md:-mx-8 md:-mb-8 px-6 py-4 md:px-8 bg-[#0A120E]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-between z-20">
              {selectedReport.status !== "resolved" && (
                <button
                  onClick={() => handleMarkResolved(selectedReport._id)}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all"
                >
                  ✓ Mark as Reunited / Found
                </button>
              )}
              <button
                onClick={() => handleRunAiMatch(selectedReport._id)}
                className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-xs font-bold shadow-lg shadow-violet-500/30 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Scan For AI Matches
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Matching Scan Results Modal ── */}
      {aiMatchResults !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#0A120E] border border-violet-500/30 rounded-[2.5rem] w-full max-w-2xl max-h-[80vh] sm:max-h-[88vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative mb-12 sm:mb-0">
            <button
              onClick={() => setAiMatchResults(null)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                  AI Visual & Trait Match Results
                </h3>
                <p className="text-white/40 text-xs">
                  Side-by-side comparison calculated using visual features, coat colors, and location data.
                </p>
              </div>
            </div>

            {aiMatchResults.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-white/[0.02] border border-white/8">
                <p className="text-white/70 font-semibold text-sm">No Counterpart Matches Found (≥50%)</p>
                <p className="text-white/40 text-xs mt-1">
                  As new lost or found reports are submitted, our system will notify you automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {aiMatchResults.map((match, idx) => {
                  const candidate = match.candidate;
                  return (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 hover:border-violet-500/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={candidate.photos?.[0]}
                            alt={candidate.dogName}
                            className="w-16 h-16 rounded-xl object-cover border border-white/10"
                          />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/60">
                              {candidate.reportType}
                            </span>
                            <h4 className="text-white font-bold text-base mt-1">{candidate.dogName}</h4>
                            <p className="text-white/40 text-xs">{candidate.location?.address}, {candidate.location?.city}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-black text-emerald-400" style={{ fontFamily: "'Sora', sans-serif" }}>
                            {match.similarityScore}/100
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                            Similarity Score
                          </span>
                        </div>
                      </div>

                      {/* Matching traits */}
                      {match.matchedCharacteristics?.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-emerald-400 block">Matched Traits:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {match.matchedCharacteristics.map((trait: string, ti: number) => (
                              <span key={ti} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                                ✓ {trait}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Differences */}
                      {match.differences?.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-red-400/80 block">Differences:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {match.differences.map((diff: string, di: number) => (
                              <span key={di} className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-300">
                                · {diff}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-between border-t border-white/5">
                        <span className="text-white/40 text-xs">
                          Contact: {candidate.contactInfo?.name} ({candidate.contactInfo?.phone})
                        </span>
                        <a
                          href={`tel:${candidate.contactInfo?.phone}`}
                          className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs"
                        >
                          Contact Now
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setAiMatchResults(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
            >
              Close AI Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
