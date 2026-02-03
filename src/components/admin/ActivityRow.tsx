import { useState } from 'react';
import { Play, ChevronDown, Copy } from 'lucide-react';
import { formatRelativeTime } from '@/utils/relativeTime';
import { copyToClipboard } from '@/utils/clipboard';
import { getStatusStyle } from '@/constants/callStatusStyles';
import { SOURCE_TOOL_LABELS } from '@/constants/sourceToolLabels';
import { AudioPlayer } from './AudioPlayer';
import { ActivityCall } from '@/hooks/useCallActivity';
import { useToast } from '@/hooks/use-toast';

interface ActivityRowProps {
  call: ActivityCall;
}

function formatTime(secs: number | null): string {
  if (secs === null || isNaN(secs)) return "—";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return m + ":" + (s < 10 ? "0" : "") + s;
}

export function ActivityRow({ call }: ActivityRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [playOnOpen, setPlayOnOpen] = useState(false);
  const { toast } = useToast();

  const handleRowClick = () => {
    setPlayOnOpen(false);
    setIsExpanded((prev) => !prev);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlayOnOpen(true);
    setIsExpanded(true);
  };

  const statusStyle = getStatusStyle(call.status);

  return (
    <div>
      {/* Collapsed Row */}
      <div
        onClick={handleRowClick}
        className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        {/* Relative time */}
        <span className="text-xs text-gray-500 w-24 flex-shrink-0">
          {formatRelativeTime(call.triggered_at)}
        </span>

        {/* Source tool badge */}
        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 flex-shrink-0 whitespace-nowrap">
          {SOURCE_TOOL_LABELS[call.source_tool] || call.source_tool}
        </span>

        {/* Status badge */}
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${statusStyle.bgClass} ${statusStyle.textClass} flex-shrink-0`}
        >
          {statusStyle.label}
        </span>

        {/* Duration */}
        {call.duration_seconds !== null && (
          <span className="text-xs text-gray-400 flex-shrink-0">
            {formatTime(call.duration_seconds)}
          </span>
        )}

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          {/* Play button */}
          {call.recording_url && (
            <button
              onClick={handlePlayClick}
              className="w-7 h-7 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center hover:bg-green-500/20 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Expand/collapse chevron */}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="bg-gray-50 border-t border-gray-200 p-4 space-y-4">
          {/* A: Audio Player */}
          {call.recording_url && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Recording
              </p>
              <AudioPlayer src={call.recording_url} autoStart={playOnOpen} playerId={call.id} />
            </div>
          )}

          {/* B: Transcript */}
          {call.transcript && call.transcript.trim() !== "" && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Transcript
              </p>
              <div className="bg-white border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap">
                {call.transcript}
              </div>
            </div>
          )}

          {/* C: Details grid */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Details
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <div>
                <span className="text-gray-500">Phone</span>
                <span className="text-gray-800 ml-2">
                  {call.phone_masked || "Unknown"}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500">Lead ID</span>
                <span className="text-gray-800 ml-2 font-mono text-xs">
                  {call.wm_lead_id || "—"}
                </span>
                {call.wm_lead_id && (
                  <button
                    onClick={() => {
                      copyToClipboard(call.wm_lead_id!);
                      toast({ description: "Lead ID copied" });
                    }}
                    className="ml-1.5 text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div>
                <span className="text-gray-500">Dispatched</span>
                <span className="text-gray-800 ml-2">
                  {new Date(call.triggered_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Status</span>
                <span className={`ml-2 ${statusStyle.textClass}`}>
                  {statusStyle.label}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Sentiment</span>
                <span className="text-gray-800 ml-2">
                  {call.sentiment || "—"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Duration</span>
                <span className="text-gray-800 ml-2">
                  {formatTime(call.duration_seconds)}
                </span>
              </div>
            </div>
          </div>

          {/* D: Error details */}
          {call.status === "dead_letter" && call.error_message && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-xs font-semibold text-red-600 mb-1">Error</p>
              <p className="text-sm text-red-700">{call.error_message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
