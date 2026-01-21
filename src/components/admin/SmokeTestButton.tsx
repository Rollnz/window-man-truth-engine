import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, TestTube2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TestResult {
  function_name: string;
  test_name: string;
  passed: boolean;
  status_code: number;
  duration_ms: number;
  error?: string;
}

interface SmokeTestReport {
  ok: boolean;
  timestamp: string;
  total_tests: number;
  passed: number;
  failed: number;
  results: TestResult[];
  markdown_report: string;
}

export function SmokeTestButton() {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState<SmokeTestReport | null>(null);

  const runSmokeTest = async () => {
    setLoading(true);
    setReport(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-smoke-test`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      const data: SmokeTestReport = await res.json();
      setReport(data);
      setOpen(true);

      if (data.ok) {
        toast.success(`All ${data.total_tests} tests passed!`);
      } else {
        toast.error(`${data.failed} of ${data.total_tests} tests failed`);
      }
    } catch (err) {
      toast.error("Smoke test failed");
      setReport({
        ok: false,
        timestamp: new Date().toISOString(),
        total_tests: 0,
        passed: 0,
        failed: 0,
        results: [],
        markdown_report: `Error: ${err instanceof Error ? err.message : "Unknown"}`,
      });
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={runSmokeTest}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            Testing...
          </>
        ) : (
          <>
            <TestTube2 className="h-4 w-4 mr-1" />
            Smoke Test
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {report?.ok ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Smoke Test Results
            </DialogTitle>
          </DialogHeader>

          {report && (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <Badge variant={report.ok ? "default" : "destructive"}>
                  {report.ok ? "All Passed" : "Failures Detected"}
                </Badge>
                <span>✅ {report.passed} passed</span>
                <span>❌ {report.failed} failed</span>
                <span className="text-muted-foreground">
                  {new Date(report.timestamp).toLocaleString()}
                </span>
              </div>

              <ScrollArea className="h-[400px] border rounded-md p-4">
                <div className="space-y-2">
                  {report.results.map((r, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded text-sm flex justify-between items-center ${
                        r.passed ? "bg-primary/10" : "bg-destructive/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {r.passed ? (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        <span className="font-medium">{r.function_name}</span>
                        <span className="text-muted-foreground">{r.test_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline">HTTP {r.status_code}</Badge>
                        <span className="text-muted-foreground">{r.duration_ms}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
