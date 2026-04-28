import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ImagePlus, Loader2, X, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import { SCREEN_TYPES, ScreenType, UxReport, priorityFromScore } from "@/lib/uxAudit";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/device";
import { toast } from "sonner";

const NewCheck = () => {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [screenType, setScreenType] = useState<ScreenType>("Landing Page");
  const [loading, setLoading] = useState(false);

  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!imagePreview) {
      toast.error("Please upload a screenshot to analyze");
      return;
    }
    setLoading(true);
    try {
      const { data: aiData, error: aiError } = await supabase.functions.invoke("analyze-ux", {
        body: {
          imageDataUrl: imagePreview,
          screenType,
          description: description.trim() || undefined,
        },
      });

      if (aiError || !aiData?.report) {
        const msg = (aiError as any)?.context?.error || aiData?.error || aiError?.message || "Could not analyze screenshot";
        toast.error(msg);
        setLoading(false);
        return;
      }

      const report = aiData.report as UxReport;

      const { data, error } = await supabase
        .from("reports")
        .insert({
          device_id: getDeviceId(),
          screen_type: screenType,
          description: description.trim() || null,
          image_url: imagePreview,
          overall_score: report.overall_score,
          visual_hierarchy: report.visual_hierarchy_score,
          accessibility: report.accessibility_risk_score,
          layout_consistency_score: report.layout_consistency_score,
          typography_consistency_score: report.typography_consistency_score,
          component_consistency_score: report.component_consistency_score,
          color_consistency_score: report.color_consistency_score,
          accessibility_risk_score: report.accessibility_risk_score,
          strengths: report.strengths,
          issues: report.issues,
          recommendations: report.recommendations,
          priority_fixes: report.priority_fixes,
          design_system_notes: report.design_system_notes,
          summary: report.summary,
          priority: priorityFromScore(report.overall_score),
        })
        .select("id")
        .single();

      if (error || !data) {
        toast.error("Could not save report");
        setLoading(false);
        return;
      }
      navigate(`/report/${data.id}`);
    } catch (e) {
      console.error(e);
      toast.error("Unexpected error");
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="px-5 pt-12 pb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="h-10 w-10 -ml-2 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>

        <h1 className="text-title-lg mb-2">New UX Check</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Upload a screenshot. AI will analyze visual consistency, hierarchy, and design system discipline.
        </p>

        <div className="space-y-6">
          {/* Image upload */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Screenshot</Label>
            {imagePreview ? (
              <div className="relative ios-card overflow-hidden">
                <img src={imagePreview} alt="Upload preview" className="w-full max-h-72 object-cover" />
                <button
                  onClick={() => setImagePreview(null)}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/90 backdrop-blur flex items-center justify-center shadow-sm"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="w-full ios-card border-dashed border-2 border-border hover:border-foreground/30 transition-colors py-10 flex flex-col items-center gap-2 text-muted-foreground"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-sm font-medium">Tap to upload</span>
                <span className="text-xs">PNG or JPG, up to 5MB</span>
              </button>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="desc" className="text-sm font-medium mb-2 block">
              Optional context
            </Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Pricing page targeting SMB users, primary goal is plan upgrade…"
              maxLength={1000}
              className="min-h-24 rounded-2xl resize-none text-base"
            />
          </div>

          {/* Screen type */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Screen type</Label>
            <Select value={screenType} onValueChange={(v) => setScreenType(v as ScreenType)}>
              <SelectTrigger className="h-12 rounded-2xl text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCREEN_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !imagePreview}
            size="lg"
            className="w-full h-14 rounded-2xl text-base font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing visual consistency…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Run Visual UX Audit
              </>
            )}
          </Button>

          {loading && (
            <p className="text-xs text-center text-muted-foreground">
              This usually takes 10–25 seconds.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default NewCheck;
