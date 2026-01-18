import { useState } from 'react';
import { X, Mic, FileText, AlertCircle, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Json } from '@/integrations/supabase/types';

export interface PhoneCallLogRow {
  id: string;
  call_request_id: string;
  source_tool: string;
  call_status: string;
  call_duration_sec: number | null;
  call_sentiment: string | null;
  recording_url: string | null;
  ai_notes: string | null;
  raw_outcome_payload: Json | null;
  triggered_at: string;
  ended_at: string | null;
  created_at: string;
}

interface CallReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: PhoneCallLogRow | null;
}

interface TranscriptSegment {
  speaker?: string;
  role?: string;
  time?: number | string;
  timestamp?: number | string;
  start?: number;
  end?: number;
  text?: string;
  content?: string;
  message?: string;
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    completed: 'default',
    no_answer: 'secondary',
    failed: 'destructive',
    in_progress: 'secondary',
    pending: 'outline',
  };
  return variants[status] || 'outline';
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return 'N/A';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

// Safe transcript extractor from various payload structures
function extractTranscript(payload: Json | null): TranscriptSegment[] | string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const obj = payload as Record<string, Json | undefined>;

  // Check common transcript locations
  const locations = [
    obj.transcript,
    (obj.data as Record<string, Json | undefined> | undefined)?.transcript,
    (obj.call as Record<string, Json | undefined> | undefined)?.transcript,
    (obj.analysis as Record<string, Json | undefined> | undefined)?.transcript,
    (obj.result as Record<string, Json | undefined> | undefined)?.transcript,
    (obj.outcome as Record<string, Json | undefined> | undefined)?.transcript,
  ];

  for (const location of locations) {
    if (location) {
      if (typeof location === 'string') {
        return location;
      }
      if (Array.isArray(location)) {
        return location as TranscriptSegment[];
      }
    }
  }

  return null;
}

// Format a single transcript segment as text line
function formatSegmentLine(segment: TranscriptSegment): string {
  const speaker = segment.speaker || segment.role;
  const time = segment.time ?? segment.timestamp ?? segment.start;
  const text = segment.text || segment.content || segment.message || '';

  let line = '';
  if (speaker) {
    line += `[${speaker}]`;
  }
  if (time !== undefined) {
    const timeStr = typeof time === 'number'
      ? `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`
      : String(time);
    line += ` (${timeStr})`;
  }
  if (line) {
    line += ' ';
  }
  line += String(text);
  return line;
}

// Convert transcript to plain text for export
function transcriptToPlainText(transcript: TranscriptSegment[] | string | null): string | null {
  if (!transcript) return null;

  if (typeof transcript === 'string') {
    return transcript;
  }

  if (Array.isArray(transcript) && transcript.length > 0) {
    return transcript.map(formatSegmentLine).join('\n');
  }

  return null;
}

// Generate export file content
function generateExportContent(log: PhoneCallLogRow, transcriptText: string): string {
  const header = [
    '='.repeat(60),
    'WINDOW MAN CALL TRANSCRIPT',
    '='.repeat(60),
    '',
    `Source Tool: ${log.source_tool}`,
    `Call Status: ${log.call_status}`,
    `Duration: ${formatDuration(log.call_duration_sec)}`,
    `Sentiment: ${log.call_sentiment || 'N/A'}`,
    `Triggered At: ${new Date(log.triggered_at).toLocaleString()}`,
    `Ended At: ${log.ended_at ? new Date(log.ended_at).toLocaleString() : 'N/A'}`,
    '',
    '-'.repeat(60),
    'TRANSCRIPT',
    '-'.repeat(60),
    '',
  ];

  return header.join('\n') + transcriptText;
}

// Trigger file download
function downloadTranscript(log: PhoneCallLogRow, transcriptText: string) {
  const content = generateExportContent(log, transcriptText);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const date = new Date(log.triggered_at).toISOString().split('T')[0];
  const filename = `windowman-call_${log.source_tool}_${date}_${log.call_request_id}.txt`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Render transcript segments safely
function TranscriptDisplay({ transcript }: { transcript: TranscriptSegment[] | string | null }) {
  if (!transcript) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-4">
        <AlertCircle className="h-4 w-4" />
        <span>Transcript not available (payload did not include it).</span>
      </div>
    );
  }

  if (typeof transcript === 'string') {
    return (
      <div className="space-y-2">
        {transcript.split('\n').map((paragraph, idx) => (
          <p key={idx} className="text-sm text-foreground">
            {paragraph}
          </p>
        ))}
      </div>
    );
  }

  if (Array.isArray(transcript) && transcript.length > 0) {
    return (
      <div className="space-y-3">
        {transcript.map((segment, idx) => {
          const speaker = segment.speaker || segment.role;
          const time = segment.time ?? segment.timestamp ?? segment.start;
          const text = segment.text || segment.content || segment.message || '';

          return (
            <div key={idx} className="flex gap-3">
              <div className="flex-shrink-0">
                {speaker && (
                  <Badge variant="outline" className="text-xs">
                    {String(speaker)}
                  </Badge>
                )}
                {time !== undefined && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {typeof time === 'number' ? `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}` : String(time)}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground flex-1">{String(text)}</p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-muted-foreground py-4">
      <AlertCircle className="h-4 w-4" />
      <span>Transcript not available (payload did not include it).</span>
    </div>
  );
}

export function CallReviewModal({ isOpen, onClose, log }: CallReviewModalProps) {
  const [audioError, setAudioError] = useState(false);

  if (!isOpen || !log) return null;

  const transcript = extractTranscript(log.raw_outcome_payload);
  const transcriptText = transcriptToPlainText(transcript);
  const hasTranscript = !!transcriptText;

  const handleAudioError = () => {
    setAudioError(true);
  };

  const handleDownload = () => {
    if (transcriptText) {
      downloadTranscript(log, transcriptText);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] mx-4 bg-card border border-border rounded-lg shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">Call Review</h2>
            <Badge variant={getStatusBadgeVariant(log.call_status)}>
              {log.call_status.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge variant="outline">{log.source_tool}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!hasTranscript}
              title={hasTranscript ? 'Download transcript as text file' : 'No transcript available'}
            >
              <Download className="h-4 w-4 mr-1" />
              Download Transcript
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <ScrollArea className="flex-1 p-4">
          {/* Meta info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
            <span>
              <strong>Duration:</strong> {formatDuration(log.call_duration_sec)}
            </span>
            <span>
              <strong>Triggered:</strong> {new Date(log.triggered_at).toLocaleString()}
            </span>
            {log.ended_at && (
              <span>
                <strong>Ended:</strong> {new Date(log.ended_at).toLocaleString()}
              </span>
            )}
            {log.call_sentiment && (
              <span>
                <strong>Sentiment:</strong> {log.call_sentiment}
              </span>
            )}
          </div>

          {/* 2-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Left: Audio Player */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-foreground">Recording</h3>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                {log.recording_url ? (
                  audioError ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm">
                        Unable to play recording. It may be unavailable or restricted.
                      </span>
                    </div>
                  ) : (
                    <audio
                      controls
                      src={log.recording_url}
                      onError={handleAudioError}
                      className="w-full"
                    >
                      Your browser does not support the audio element.
                    </audio>
                  )
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">No recording available</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: AI Notes */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-foreground">AI Notes</h3>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 min-h-[100px]">
                {log.ai_notes ? (
                  <div className="text-sm text-foreground whitespace-pre-wrap">
                    {log.ai_notes}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">No AI notes available</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Transcript Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-foreground">Transcript</h3>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <TranscriptDisplay transcript={transcript} />
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
