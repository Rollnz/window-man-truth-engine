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

/**
 * Maps a call status string to a UI badge variant.
 *
 * @param status - Call status (e.g., `completed`, `no_answer`, `failed`, `in_progress`, `pending`)
 * @returns The badge variant to use: `'default'`, `'secondary'`, `'destructive'`, or `'outline'`. Returns `'outline'` for unknown statuses.
 */
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

/**
 * Format a duration in seconds into a human-readable minutes-and-seconds string.
 *
 * @param seconds - Total duration in seconds (may be null). A falsy value results in no available duration.
 * @returns The formatted duration as "`Xm Ys`" (e.g., "2m 5s"), or `"N/A"` if `seconds` is `null` or otherwise falsy.
 */
function formatDuration(seconds: number | null): string {
  if (!seconds) return 'N/A';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

/**
 * Extracts transcript data from a JSON payload that may store the transcript in several common locations.
 *
 * @param payload - The raw JSON payload to inspect; may be null or an object containing a transcript property (e.g., `transcript`, `data.transcript`, `call.transcript`, `analysis.transcript`, `result.transcript`, or `outcome.transcript`).
 * @returns `TranscriptSegment[]` if a segmented transcript is found, `string` if a plain transcript string is found, or `null` if no transcript is present.
 */
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

/**
 * Format a transcript segment into a single human-readable line.
 *
 * The resulting line includes the speaker or role in square brackets if present, the time in
 * parentheses (numeric times are formatted as `m:ss`) if present, followed by the segment text.
 *
 * @param segment - Transcript segment containing optional `speaker` or `role`, a time value
 *   from `time`, `timestamp`, or `start`, and text from `text`, `content`, or `message`.
 * @returns The formatted single-line representation of the segment.
 */
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

/**
 * Converts a transcript into plain text suitable for export.
 *
 * @param transcript - Transcript data provided as a string, an array of `TranscriptSegment`, or `null`.
 * @returns The transcript as a single string (segments joined with newlines), or `null` when no transcript is available.
 */
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

/**
 * Builds a plain-text export combining call metadata header and the supplied transcript.
 *
 * @param log - Call log whose fields (source tool, status, duration, sentiment, timestamps) populate the header
 * @param transcriptText - Transcript content (plain text) to append after the header
 * @returns The full export text consisting of a metadata header followed by the transcript
 */
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

/**
 * Initiates a browser download of a plain-text export containing call metadata and the provided transcript.
 *
 * @param log - Call log used to populate export metadata and to generate the filename (uses source_tool, triggered_at date, and call_request_id).
 * @param transcriptText - Plain-text transcript content to include in the exported file.
 */
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

/**
 * Renders transcript data into safe, readable UI elements.
 *
 * @param transcript - Transcript data which may be:
 *   - a `string` containing newline-separated paragraphs,
 *   - an array of `TranscriptSegment` objects (with optional `speaker`/`role`, `time`/`timestamp`/`start`, and `text`/`content`/`message`), or
 *   - `null`/undefined when no transcript is available.
 *   When the transcript is missing or invalid, an inline alert message is shown.
 *
 * @returns The rendered transcript UI: an alert message if unavailable, paragraph elements for string transcripts, or a list of formatted segments with optional speaker badges and timestamps.
 */
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

/**
 * Displays a modal with call metadata, recording playback, AI notes, transcript rendering, and a transcript export action.
 *
 * Renders nothing when `isOpen` is false or `log` is null; when open, extracts and formats the transcript, handles audio playback errors, and provides a download button for the transcript if available.
 *
 * @param isOpen - Whether the modal is visible
 * @param onClose - Callback invoked to close the modal
 * @param log - The call log to display (metadata, recording URL, AI notes, and raw transcript payload)
 * @returns A React element for the call review modal, or `null` when closed or no `log` is provided
 */
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