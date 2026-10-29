"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Lock, Plus, Calendar, Eye, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchProgressPhotos, logProgressPhoto } from "@/lib/db/progress-store";
import { ProgressPhoto } from "@/lib/db/types";

export default function PhotosPage() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [photoDate, setPhotoDate] = useState("");
  const [photoNote, setPhotoNote] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compareIndexA, setCompareIndexA] = useState<number>(0);
  const [compareIndexB, setCompareIndexB] = useState<number>(1);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setPhotoDate(new Date().toISOString().split("T")[0]);
    loadData();
  }, []);

  const loadData = async () => {
    const list = await fetchProgressPhotos();
    setPhotos(list);
    if (list.length > 1) {
      setCompareIndexA(list.length - 1); // oldest
      setCompareIndexB(0); // newest
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl) {
      alert("Please select a photo to upload.");
      return;
    }

    await logProgressPhoto(previewUrl, photoNote, photoDate);
    setIsModalOpen(false);
    setPreviewUrl(null);
    setPhotoNote("");
    setFeedback("Photo added to private vault!");
    setTimeout(() => setFeedback(null), 3000);
    await loadData();
  };

  const handleDeletePhoto = (id: string) => {
    if (confirm("Remove this photo from your progress vault?")) {
      const updated = photos.filter((p) => p.id !== id);
      setPhotos(updated);
      try {
        localStorage.setItem("bench_and_dal_photos", JSON.stringify(updated));
      } catch {}
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/progress">
            <Button variant="ghost" size="icon" aria-label="Back to progress">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Progress Photo Vault
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Side-by-side transformation comparison &amp; visual log
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          size="sm"
          className="font-bold flex items-center gap-1.5 h-10 px-4"
        >
          <Plus className="w-4 h-4" />
          <span>Add Photo</span>
        </Button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Privacy Guarantee Banner */}
      <div className="p-3.5 rounded-xl bg-muted/60 border border-border text-xs text-muted-foreground flex items-center gap-2.5">
        <Lock className="w-4 h-4 text-primary shrink-0" />
        <span>
          <strong className="text-foreground">100% Private:</strong> Your photos are stored locally on your device and inside your private, authenticated cloud container. They are never public.
        </span>
      </div>

      {/* Side-by-side Compare View (if 2+ photos) */}
      {photos.length >= 2 ? (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              <span>Side-by-Side Comparison</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Compare your baseline posture and muscle definition against recent photos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Photo A (Baseline / Older) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-muted-foreground">Photo A (Earlier)</span>
                  <select
                    value={compareIndexA}
                    onChange={(e) => setCompareIndexA(Number(e.target.value))}
                    className="p-1 text-xs rounded-md bg-muted border border-border font-semibold"
                  >
                    {photos.map((p, idx) => (
                      <option key={p.id} value={idx}>
                        {p.date} {p.note ? `(${p.note.slice(0, 15)}...)` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative aspect-3/4 rounded-2xl bg-muted overflow-hidden border border-border flex items-center justify-center">
                  {photos[compareIndexA] && (
                    <img
                      src={photos[compareIndexA].storage_path}
                      alt="Progress A"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {photos[compareIndexA]?.date}
                  </div>
                </div>
              </div>

              {/* Photo B (Current / Newer) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-primary">Photo B (Recent)</span>
                  <select
                    value={compareIndexB}
                    onChange={(e) => setCompareIndexB(Number(e.target.value))}
                    className="p-1 text-xs rounded-md bg-muted border border-border font-semibold text-primary"
                  >
                    {photos.map((p, idx) => (
                      <option key={p.id} value={idx}>
                        {p.date} {p.note ? `(${p.note.slice(0, 15)}...)` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative aspect-3/4 rounded-2xl bg-muted overflow-hidden border border-primary/40 flex items-center justify-center">
                  {photos[compareIndexB] && (
                    <img
                      src={photos[compareIndexB].storage_path}
                      alt="Progress B"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {photos[compareIndexB]?.date}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Photo Gallery Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-foreground">All Logged Photos ({photos.length})</h2>
        {photos.length === 0 ? (
          <Card className="border-border">
            <CardContent className="h-48 flex flex-col items-center justify-center text-xs text-muted-foreground space-y-3">
              <Camera className="w-8 h-8 text-muted-foreground/60" />
              <span>No progress photos uploaded yet</span>
              <Button size="sm" onClick={() => setIsModalOpen(true)} className="font-bold">
                Upload First Photo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative rounded-xl border border-border bg-card overflow-hidden">
                <div className="aspect-3/4 relative overflow-hidden bg-muted">
                  <img
                    src={photo.storage_path}
                    alt={photo.note || "Progress Photo"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/80 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-2 space-y-0.5 text-xs">
                  <span className="font-bold text-foreground block">{photo.date}</span>
                  {photo.note && (
                    <p className="text-[11px] text-muted-foreground truncate">{photo.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-sm border-border shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                <span>Upload Progress Photo</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Take front or side posture photos with relaxed stomach under consistent morning lighting.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSavePhoto}>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Select Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    className="text-xs w-full file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-primary-foreground hover:file:opacity-90"
                  />
                </div>

                {previewUrl && (
                  <div className="aspect-3/4 w-32 mx-auto rounded-xl overflow-hidden border border-border">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Date</label>
                  <Input
                    type="date"
                    value={photoDate}
                    onChange={(e) => setPhotoDate(e.target.value)}
                    required
                    className="h-10 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Note (Optional)</label>
                  <Input
                    placeholder="e.g. Week 4, morning empty stomach"
                    value={photoNote}
                    onChange={(e) => setPhotoNote(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>
              </CardContent>
              <div className="p-4 pt-0 flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button type="submit" className="text-xs font-bold px-4">
                  Save to Vault
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
