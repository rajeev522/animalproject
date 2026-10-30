import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  Plus,
  Sparkles,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Phone,
  Mail,
  Home,
  User,
  Search,
  Filter,
  Trash2,
  Edit3,
  Eye,
  X,
  Upload,
  RefreshCw,
  Bell,
  Check,
  FileText,
  Activity,
  ArrowUpRight
} from "lucide-react";
import { useApp } from "./App";
import { apiUrl } from "./lib/apiClient";
import { AdoptionDog, UserAdoptionRequest } from "./AdoptionPublicView";

interface AdoptionStats {
  totalDogs: number;
  availableDogs: number;
  premiumDogs: number;
  normalDogs: number;
  pendingRequests: number;
  approvedRequests: number;
  completedAdoptions: number;
}

interface AdminNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  relatedDogId?: string;
  relatedRequestId?: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export function AdoptionAdminPanel() {
  const { user, addToast } = useApp();
  const [subTab, setSubTab] = useState<"dogs" | "requests" | "stats" | "notifications">("dogs");
  
  // Data States
  const [dogs, setDogs] = useState<AdoptionDog[]>([]);
  const [requests, setRequests] = useState<UserAdoptionRequest[]>([]);
  const [stats, setStats] = useState<AdoptionStats | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [listingFilter, setListingFilter] = useState<"all" | "Normal" | "Premium">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Add / Edit Dog Modal State
  const [dogModalOpen, setDogModalOpen] = useState(false);
  const [editingDogId, setEditingDogId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formBreed, setFormBreed] = useState("");
  const [formAge, setFormAge] = useState("");
  const [formGender, setFormGender] = useState<"Male" | "Female" | "Unknown">("Male");
  const [formLocation, setFormLocation] = useState("");
  const [formHealth, setFormHealth] = useState("Healthy & Active");
  const [formVaccinated, setFormVaccinated] = useState(true);
  const [formVaccStatus, setFormVaccStatus] = useState("Fully Vaccinated");
  const [formDesc, setFormDesc] = useState("");
  const [formListingType, setFormListingType] = useState<"Normal" | "Premium">("Normal");
  const [formStatus, setFormStatus] = useState<"available" | "pending" | "adopted" | "unavailable">("available");
  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [savingDog, setSavingDog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Applicant Details Modal State
  const [selectedRequest, setSelectedRequest] = useState<UserAdoptionRequest | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState("");
  const [updatingReq, setUpdatingReq] = useState(false);

  // Fetch Dogs
  const fetchDogs = async () => {
    try {
      const token = localStorage.getItem("pawrescue_token");
      const res = await fetch(apiUrl("/api/adoptions/admin/all"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDogs(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Requests
  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("pawrescue_token");
      const res = await fetch(apiUrl("/api/adoptions/admin/requests"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("pawrescue_token");
      const res = await fetch(apiUrl("/api/adoptions/admin/stats"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setStats(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("pawrescue_token");
      const res = await fetch(apiUrl("/api/adoptions/admin/notifications"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
        setUnreadNotifsCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const refreshAll = () => {
    setLoading(true);
    Promise.all([fetchDogs(), fetchRequests(), fetchStats(), fetchNotifications()]).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Handle Photo selection from files
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          setFormPhotos((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx: number) => {
    setFormPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingDogId(null);
    setFormName("");
    setFormBreed("Indie Mix");
    setFormAge("1-2 years");
    setFormGender("Male");
    setFormLocation(user?.name ? `${user.name} Shelter` : "City Shelter");
    setFormHealth("Healthy & Dewormed");
    setFormVaccinated(true);
    setFormVaccStatus("Fully Vaccinated");
    setFormDesc("");
    setFormListingType("Normal");
    setFormStatus("available");
    setFormPhotos([
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&q=80"
    ]);
    setDogModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (dog: AdoptionDog) => {
    setEditingDogId(dog.id);
    setFormName(dog.name);
    setFormBreed(dog.breed || "");
    setFormAge(dog.age || "");
    setFormGender(dog.gender || "Male");
    setFormLocation(dog.location);
    setFormHealth(dog.healthCondition || "Healthy");
    setFormVaccinated(Boolean(dog.vaccinated));
    setFormVaccStatus(dog.vaccinationStatus || "Fully Vaccinated");
    setFormDesc(dog.description || "");
    setFormListingType(dog.listingType || "Normal");
    setFormStatus(dog.status);
    setFormPhotos(dog.photos && dog.photos.length > 0 ? dog.photos : [dog.image]);
    setDogModalOpen(true);
  };

  // Save Dog (Create or Update)
  const handleSaveDog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formPhotos.length === 0) {
      addToast({ type: "warning", title: "Photo Required", message: "Please upload at least one photo of the dog." });
      return;
    }

    setSavingDog(true);
    try {
      const token = localStorage.getItem("pawrescue_token");
      const url = editingDogId
        ? apiUrl(`/api/adoptions/admin/dog/${editingDogId}`)
        : apiUrl("/api/adoptions/admin/dog");
      const method = editingDogId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formName,
          breed: formBreed,
          age: formAge,
          gender: formGender,
          location: formLocation,
          healthCondition: formHealth,
          vaccinated: formVaccinated,
          vaccinationStatus: formVaccStatus,
          description: formDesc,
          listingType: formListingType,
          status: formStatus,
          photos: formPhotos
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast({
          type: "success",
          title: editingDogId ? "Dog Updated! 🐾" : "Dog Listed for Adoption! 🐾",
          message: data.message || "Saved successfully."
        });
        setDogModalOpen(false);
        refreshAll();
      } else {
        addToast({ type: "error", title: "Error", message: data.message || "Failed to save dog" });
      }
    } catch (err: any) {
      addToast({ type: "error", title: "Network Error", message: err.message });
    } finally {
      setSavingDog(false);
    }
  };

  // Delete Dog
  const handleDeleteDog = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from adoption directory?`)) return;

    try {
      const token = localStorage.getItem("pawrescue_token");
      const res = await fetch(apiUrl(`/api/adoptions/admin/dog/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addToast({ type: "info", title: "Listing Deleted", message: data.message });
        refreshAll();
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to delete listing" });
    }
  };

  // Toggle Premium / Normal quickly
  const handleToggleListingType = async (dog: AdoptionDog) => {
    const nextType = dog.listingType === "Premium" ? "Normal" : "Premium";
    try {
      const token = localStorage.getItem("pawrescue_token");
      const res = await fetch(apiUrl(`/api/adoptions/admin/dog/${dog.id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ listingType: nextType })
      });
      if (res.ok) {
        addToast({
          type: "success",
          title: "Listing Tier Changed",
          message: `"${dog.name}" is now marked as ${nextType}!`
        });
        refreshAll();
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Could not update listing tier" });
    }
  };

  // Update Request Status (Approve, Reject, Under Review, Completed)
  const handleUpdateRequestStatus = async (
    newStatus: "Pending" | "Under Review" | "Approved" | "Rejected" | "Completed",
    markDogAdopted = false
  ) => {
    if (!selectedRequest) return;
    setUpdatingReq(true);
    try {
      const token = localStorage.getItem("pawrescue_token");
      const res = await fetch(apiUrl(`/api/adoptions/admin/requests/${selectedRequest.id}/status`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotesInput,
          markDogAdopted
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast({
          type: "success",
          title: `Application ${newStatus}!`,
          message: `Request #${selectedRequest.requestId} has been marked as ${newStatus}.`
        });
        setSelectedRequest(null);
        refreshAll();
      } else {
        addToast({ type: "error", title: "Error", message: data.message || "Failed to update request" });
      }
    } catch {
      addToast({ type: "error", title: "Network Error", message: "Could not update status" });
    } finally {
      setUpdatingReq(false);
    }
  };

  // Mark all notifications as read
  const handleMarkNotifsRead = async () => {
    try {
      const token = localStorage.getItem("pawrescue_token");
      await fetch(apiUrl("/api/adoptions/admin/notifications/mark-read"), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadNotifsCount(0);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered Dogs list
  const filteredDogs = dogs.filter((d) => {
    if (listingFilter !== "all" && (d.listingType || "Normal") !== listingFilter) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.breed.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030906] overflow-hidden text-white font-sans">
      {/* ── SUB-HEADER NAVIGATION BAR ── */}
      <div className="bg-[#060E09] border-b border-white/5 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSubTab("dogs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === "dogs"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner"
                : "bg-white/5 text-white/50 hover:text-white"
            }`}
          >
            <Heart className="w-4 h-4 text-emerald-400" /> Manage Dogs ({dogs.length})
          </button>

          <button
            onClick={() => setSubTab("requests")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold relative transition-all ${
              subTab === "requests"
                ? "bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-inner"
                : "bg-white/5 text-white/50 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4 text-pink-400" />
            Adoption Requests ({requests.length})
            {requests.filter((r) => r.status === "Pending").length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
                {requests.filter((r) => r.status === "Pending").length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab("stats")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === "stats"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner"
                : "bg-white/5 text-white/50 hover:text-white"
            }`}
          >
            <Activity className="w-4 h-4 text-amber-400" /> Adoption Statistics
          </button>

          <button
            onClick={() => { setSubTab("notifications"); handleMarkNotifsRead(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold relative transition-all ${
              subTab === "notifications"
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-inner"
                : "bg-white/5 text-white/50 hover:text-white"
            }`}
          >
            <Bell className="w-4 h-4 text-violet-400" />
            Notifications
            {unreadNotifsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black">
                {unreadNotifsCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshAll}
            title="Refresh All Data"
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Dog
          </button>
        </div>
      </div>

      {/* ── TAB 1: MANAGE DOGS (LIST & TIERS) ── */}
      {subTab === "dogs" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Filter / Search Bar */}
          <div className="bg-[#0A120E]/50 border-b border-white/5 px-6 py-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
            <div className="relative flex-1 max-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dog name, breed..."
                className="w-full bg-[#030906] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-white/40 text-[11px] font-bold uppercase">Tier:</span>
              <button
                onClick={() => setListingFilter("all")}
                className={`px-3 py-1 rounded-lg font-bold border transition-all ${listingFilter === "all" ? "bg-white/15 border-white/30 text-white" : "bg-white/5 border-white/5 text-white/40"}`}
              >
                All
              </button>
              <button
                onClick={() => setListingFilter("Premium")}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold border transition-all ${listingFilter === "Premium" ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-white/5 border-white/5 text-white/40"}`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" /> Premium
              </button>
              <button
                onClick={() => setListingFilter("Normal")}
                className={`px-3 py-1 rounded-lg font-bold border transition-all ${listingFilter === "Normal" ? "bg-sky-500/20 border-sky-500/40 text-sky-300" : "bg-white/5 border-white/5 text-white/40"}`}
              >
                Normal
              </button>

              <span className="text-white/40 text-[11px] font-bold uppercase ml-3">Status:</span>
              {["all", "available", "pending", "adopted"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg font-bold uppercase text-[10px] border transition-all ${statusFilter === st ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-white/5 border-white/5 text-white/40"}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Dogs Grid */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
            {filteredDogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Heart className="w-12 h-12 text-white/20 mb-3" />
                <p className="text-white/60 font-bold text-sm">No dog listings found</p>
                <p className="text-white/40 text-xs mt-1">Click "Add New Dog" above to create your first adoption listing.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDogs.map((dog) => (
                  <div
                    key={dog.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between transition-all group ${
                      dog.listingType === "Premium"
                        ? "bg-gradient-to-br from-amber-500/10 via-[#0E1712] to-[#0A120E] border-amber-500/30 hover:border-amber-400/50 shadow-md shadow-amber-500/5"
                        : "bg-white/[0.03] border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div>
                      {/* Dog Image */}
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-3 bg-black/50">
                        <img src={dog.image} alt={dog.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute top-2 left-2 flex gap-1.5">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md ${
                            dog.listingType === "Premium" ? "bg-amber-400 text-black font-extrabold" : "bg-sky-500 text-white"
                          }`}>
                            {dog.listingType || "Normal"}
                          </span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            dog.status === "available"
                              ? "bg-emerald-500 text-white"
                              : dog.status === "pending"
                              ? "bg-amber-500 text-white"
                              : "bg-red-500 text-white"
                          }`}>
                            {dog.status}
                          </span>
                        </div>
                        {dog.photos && dog.photos.length > 1 && (
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px]">
                            📷 {dog.photos.length} photos
                          </div>
                        )}
                      </div>

                      {/* Header Info */}
                      <div className="flex items-start justify-between mb-1.5">
                        <div>
                          <h4 className="text-white font-black text-base" style={{ fontFamily: "'Sora', sans-serif" }}>
                            {dog.name}
                          </h4>
                          <p className="text-white/50 text-xs">{dog.breed} • {dog.age} • {dog.gender || "Male"}</p>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] mb-3">
                        <p className="text-white/60 flex items-center gap-1.5 truncate">
                          <MapPin className="w-3 h-3 text-orange-400 flex-shrink-0" /> {dog.location}
                        </p>
                        <p className="text-emerald-400/90 flex items-center gap-1.5 truncate">
                          <ShieldCheck className="w-3 h-3 flex-shrink-0" /> {dog.vaccinationStatus || (dog.vaccinated ? "Vaccinated" : "Pending")}
                        </p>
                      </div>

                      {dog.description && (
                        <p className="text-white/40 text-xs line-clamp-2 italic mb-3 bg-white/3 p-2 rounded-lg">
                          "{dog.description}"
                        </p>
                      )}
                    </div>

                    {/* Quick Control Actions */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      {/* Tier Switch Toggle */}
                      <button
                        onClick={() => handleToggleListingType(dog)}
                        className={`w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all ${
                          dog.listingType === "Premium"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                            : "bg-white/5 text-white/50 border-white/10 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Tier: {dog.listingType === "Premium" ? "Premium (Active)" : "Normal (Make Premium)"}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(dog)}
                          className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-sky-400" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDog(dog.id, dog.name)}
                          className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: ADOPTION REQUESTS & APPLICANT DETAILS ── */}
      {subTab === "requests" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="bg-[#0A120E]/50 border-b border-white/5 px-6 py-3 flex items-center justify-between text-xs text-white/60">
            <span>Review submitted applications, applicant environment, and verify pet adoption readiness.</span>
            <span className="font-bold text-pink-400">{requests.length} Total Requests</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileText className="w-12 h-12 text-white/20 mb-3" />
                <p className="text-white/60 font-bold text-sm">No adoption requests received yet</p>
                <p className="text-white/40 text-xs mt-1">When users apply to adopt dogs from the public page, their applications will appear here in real-time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white/[0.03] border border-white/10 hover:border-pink-500/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {req.dog?.image ? (
                        <img src={req.dog.image} alt={req.dog.name} className="w-16 h-16 rounded-xl object-cover border border-white/10" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
                          <Heart className="w-6 h-6" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-pink-400 font-black text-xs">#{req.requestId}</span>
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
                          <span className="text-white/30 text-[11px]">• Submitted: {new Date(req.createdAt).toLocaleDateString()}</span>
                        </div>

                        <h4 className="text-white font-bold text-sm">
                          Applicant: <span className="text-emerald-400">{req.fullName}</span> wants to adopt <span className="text-pink-300">"{req.dog?.name || 'Dog'}"</span>
                        </h4>

                        <div className="flex items-center gap-4 text-xs text-white/50 flex-wrap">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-sky-400" /> {req.phone}</span>
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-violet-400" /> {req.email}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-orange-400" /> {req.city}, {req.state}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setAdminNotesInput(req.adminNotes || "");
                        }}
                        className="px-4 py-2.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-300 text-xs font-bold transition-all shadow-sm"
                      >
                        View Applicant Details
                      </button>

                      <a
                        href={`tel:${req.phone}`}
                        className="p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 transition-all"
                        title="Call Applicant"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: ADOPTION STATISTICS ── */}
      {subTab === "stats" && (
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
          <div className="max-w-4xl mx-auto space-y-6">
            <h3 className="text-xl font-black text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
              Adoption Program Analytics 📊
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
                <p className="text-white/40 text-xs uppercase font-bold tracking-wider">Total Dogs</p>
                <p className="text-3xl font-black text-white mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {stats?.totalDogs ?? dogs.length}
                </p>
                <p className="text-white/40 text-[11px] mt-2">Registered in NGO catalog</p>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                <p className="text-emerald-400 text-xs uppercase font-bold tracking-wider">Available Dogs</p>
                <p className="text-3xl font-black text-emerald-300 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {stats?.availableDogs ?? dogs.filter(d => d.status === "available").length}
                </p>
                <p className="text-emerald-300/60 text-[11px] mt-2">Ready for immediate adoption</p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                <p className="text-amber-400 text-xs uppercase font-bold tracking-wider">Premium Listings</p>
                <p className="text-3xl font-black text-amber-300 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {stats?.premiumDogs ?? dogs.filter(d => d.listingType === "Premium").length}
                </p>
                <p className="text-amber-300/60 text-[11px] mt-2">Highlighted at top of adoption page</p>
              </div>

              <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-5">
                <p className="text-sky-400 text-xs uppercase font-bold tracking-wider">Normal Listings</p>
                <p className="text-3xl font-black text-sky-300 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {stats?.normalDogs ?? dogs.filter(d => d.listingType !== "Premium").length}
                </p>
                <p className="text-sky-300/60 text-[11px] mt-2">Standard adoption catalog</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-5">
                <p className="text-pink-400 text-xs uppercase font-bold tracking-wider">Pending Requests</p>
                <p className="text-3xl font-black text-pink-300 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {stats?.pendingRequests ?? requests.filter(r => r.status === "Pending").length}
                </p>
                <p className="text-pink-300/60 text-[11px] mt-2">Awaiting NGO verification</p>
              </div>

              <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-5">
                <p className="text-teal-400 text-xs uppercase font-bold tracking-wider">Approved Requests</p>
                <p className="text-3xl font-black text-teal-300 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {stats?.approvedRequests ?? requests.filter(r => r.status === "Approved").length}
                </p>
                <p className="text-teal-300/60 text-[11px] mt-2">Approved and in final handover</p>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5">
                <p className="text-purple-400 text-xs uppercase font-bold tracking-wider">Completed Adoptions</p>
                <p className="text-3xl font-black text-purple-300 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {stats?.completedAdoptions ?? dogs.filter(d => d.status === "adopted").length}
                </p>
                <p className="text-purple-300/60 text-[11px] mt-2">Forever homes found</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: PERSISTENT NOTIFICATIONS ── */}
      {subTab === "notifications" && (
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                Adoption Alerts & Notifications 🔔
              </h3>
              <button
                onClick={handleMarkNotifsRead}
                className="text-xs text-white/40 hover:text-white transition-all"
              >
                Mark all as read
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-16 bg-white/2 rounded-2xl border border-white/5">
                <Bell className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-white/50 text-xs">No notifications in history</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`p-4 rounded-2xl border transition-all ${
                      n.isRead ? "bg-white/[0.02] border-white/5 text-white/60" : "bg-pink-500/10 border-pink-500/30 text-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-pink-500" />}
                          <h5 className="font-bold text-sm text-white">{n.title}</h5>
                        </div>
                        <p className="text-xs text-white/70 mt-1 leading-relaxed">{n.message}</p>
                        {n.metadata?.applicantName && (
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-white/40">
                            <span>Applicant: {n.metadata.applicantName}</span>
                            <span>Phone: {n.metadata.phone}</span>
                            <span>Req ID: {n.metadata.requestId}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-white/30 whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: ADD / EDIT DOG ── */}
      {dogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setDogModalOpen(false)}>
          <div
            className="bg-[#0A120E] border border-white/15 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "fadeUp 0.3s ease both" }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Heart className="w-4 h-4" />
                </div>
                <h3 className="text-white font-bold text-lg" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {editingDogId ? "Edit Dog Listing" : "Add New Dog for Adoption"}
                </h3>
              </div>
              <button onClick={() => setDogModalOpen(false)} className="text-white/40 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDog} className="space-y-4 text-xs">
              {/* Photo Upload Section */}
              <div>
                <label className="block text-white/50 text-[10px] font-bold uppercase mb-1.5">
                  Dog Photos (Upload Multiple Photos) *
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handlePhotoUpload}
                />

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-2xl bg-white/5 border border-dashed border-white/20 hover:border-emerald-400 flex flex-col items-center justify-center gap-1 text-white/40 hover:text-emerald-300 transition-all flex-shrink-0"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-[9px] font-bold">Upload</span>
                  </button>

                  {formPhotos.map((photo, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/20 flex-shrink-0 group">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-80 hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 bg-black/70 text-[8px] font-bold px-1 rounded text-white">Cover</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">Dog Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Bruno, Bella"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-emerald-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">Breed *</label>
                  <input
                    type="text"
                    required
                    value={formBreed}
                    onChange={(e) => setFormBreed(e.target.value)}
                    placeholder="e.g. Indie, Labrador Mix"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-emerald-500/50 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">Age</label>
                  <input
                    type="text"
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value)}
                    placeholder="e.g. 8 months, 2 years"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-emerald-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">Gender</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full bg-[#0A120E] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-emerald-500/50 outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">Shelter / Location *</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Delhi Shelter, South Ext"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-emerald-500/50 outline-none"
                  />
                </div>
              </div>

              {/* Health & Vaccination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">Health Condition</label>
                  <input
                    type="text"
                    value={formHealth}
                    onChange={(e) => setFormHealth(e.target.value)}
                    placeholder="e.g. Healthy, Dewormed, Spayed"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-emerald-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">Vaccination Status</label>
                  <select
                    value={formVaccStatus}
                    onChange={(e) => {
                      setFormVaccStatus(e.target.value);
                      setFormVaccinated(e.target.value === "Fully Vaccinated" || e.target.value === "Partially Vaccinated");
                    }}
                    className="w-full bg-[#0A120E] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-emerald-500/50 outline-none"
                  >
                    <option value="Fully Vaccinated">Fully Vaccinated</option>
                    <option value="Partially Vaccinated">Partially Vaccinated</option>
                    <option value="Not Vaccinated">Not Vaccinated</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              </div>

              {/* Listing Tier and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white/3 border border-white/8 rounded-2xl">
                <div>
                  <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">Listing Tier</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormListingType("Normal")}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        formListingType === "Normal"
                          ? "bg-sky-500/20 border-sky-500/40 text-sky-300"
                          : "bg-white/5 border-white/10 text-white/50"
                      }`}
                    >
                      Normal Listing
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormListingType("Premium")}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all ${
                        formListingType === "Premium"
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-md"
                          : "bg-white/5 border-white/10 text-white/50"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Premium
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">Adoption Availability</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-[#0A120E] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-emerald-500/50 outline-none"
                  >
                    <option value="available">Available (Public can apply)</option>
                    <option value="pending">Pending (Applications in review)</option>
                    <option value="adopted">Adopted (Finalized forever home)</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">Description / Temperament</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Tell potential adopters about this dog's personality, habits, and background..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500/50 outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDogModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDog}
                  className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:brightness-110 disabled:opacity-50"
                >
                  {savingDog ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> {editingDogId ? "Update Dog Listing" : "Publish Adoption Listing"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: COMPLETE APPLICANT & ADOPTION DETAILS ── */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setSelectedRequest(null)}>
          <div
            className="bg-[#0A120E] border border-pink-500/30 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "fadeUp 0.3s ease both" }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <span className="font-mono text-pink-400 font-bold text-xs">Application #{selectedRequest.requestId}</span>
                <h3 className="text-white font-black text-xl" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Adoption Review & Applicant Profile
                </h3>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-white/40 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Dog Summary */}
              {selectedRequest.dog && (
                <div className="flex items-center gap-4 bg-white/4 border border-white/10 p-3.5 rounded-2xl">
                  <img src={selectedRequest.dog.image} alt={selectedRequest.dog.name} className="w-14 h-14 rounded-xl object-cover" />
                  <div>
                    <h4 className="text-white font-bold text-sm">{selectedRequest.dog.name} ({selectedRequest.dog.breed})</h4>
                    <p className="text-white/50 text-[11px]">{selectedRequest.dog.age} • {selectedRequest.dog.gender || "Male"} • Current status: <span className="text-emerald-400 font-bold uppercase">{selectedRequest.dog.status}</span></p>
                    <p className="text-white/40 text-[10px]">Location: {selectedRequest.dog.location}</p>
                  </div>
                </div>
              )}

              {/* Section 1: Complete Applicant Contact & Location Details */}
              <div className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-2.5">
                <h5 className="text-white font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Applicant Contact & Submitted Location
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-white/40 text-[10px] uppercase font-bold">Full Name</p>
                    <p className="text-white font-bold text-sm mt-0.5">{selectedRequest.fullName}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase font-bold">Contact Phone</p>
                    <p className="text-sky-300 font-mono font-bold mt-0.5 flex items-center gap-2">
                      {selectedRequest.phone}
                      <a href={`tel:${selectedRequest.phone}`} className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded border border-sky-500/30">Call Now</a>
                    </p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase font-bold">Email Address</p>
                    <p className="text-white mt-0.5 font-mono">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase font-bold">City & State</p>
                    <p className="text-white mt-0.5">{selectedRequest.city}, {selectedRequest.state}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <p className="text-white/40 text-[10px] uppercase font-bold">Physical Residential Address</p>
                  <p className="text-white/90 text-xs mt-0.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                    {selectedRequest.address}
                  </p>
                </div>

                {selectedRequest.preferredLocation && (
                  <div>
                    <p className="text-white/40 text-[10px] uppercase font-bold">Preferred Handover / Pickup Location</p>
                    <p className="text-white/80 text-xs mt-0.5">{selectedRequest.preferredLocation}</p>
                  </div>
                )}
              </div>

              {/* Section 2: Adoption Readiness & Home Environment */}
              <div className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-2.5">
                <h5 className="text-white font-bold text-xs uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                  <Home className="w-4 h-4" /> Adoption Readiness & Home Care
                </h5>

                <div>
                  <p className="text-white/40 text-[10px] uppercase font-bold">Reason for Adopting</p>
                  <p className="text-white/80 text-xs mt-0.5 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/5">
                    {selectedRequest.reasonForAdoption}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-white/40 text-[10px] uppercase font-bold">Pet Ownership Experience</p>
                    <p className="text-white/80 mt-0.5">{selectedRequest.petExperience || "None stated"}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase font-bold">Home Environment & Arrangements</p>
                    <p className="text-white/80 mt-0.5">{selectedRequest.homeEnvironment || "Standard home"}</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Admin Notes */}
              <div>
                <label className="block text-white/50 text-[10px] font-bold uppercase mb-1">
                  NGO Internal Notes & Assessment
                </label>
                <textarea
                  rows={2}
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  placeholder="Record verification call summary, home check notes, or adopter feedback..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:border-pink-500/50 outline-none resize-none"
                />
              </div>

              {/* Section 4: Workflow Action Buttons */}
              <div className="p-3 bg-white/4 border border-white/10 rounded-2xl space-y-2">
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">
                  Workflow State Actions:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    disabled={updatingReq}
                    onClick={() => handleUpdateRequestStatus("Under Review")}
                    className="py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all"
                  >
                    Mark Under Review
                  </button>

                  <button
                    disabled={updatingReq}
                    onClick={() => handleUpdateRequestStatus("Approved")}
                    className="py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-all"
                  >
                    Approve Application
                  </button>

                  <button
                    disabled={updatingReq}
                    onClick={() => handleUpdateRequestStatus("Rejected")}
                    className="py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs transition-all"
                  >
                    Reject Application
                  </button>

                  <button
                    disabled={updatingReq}
                    onClick={() => handleUpdateRequestStatus("Completed", true)}
                    className="py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-extrabold text-xs shadow-md shadow-purple-500/20 transition-all"
                  >
                    Mark as Adopted 🐾
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
