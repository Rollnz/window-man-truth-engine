import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Eye, EyeOff, X, Minimize2, Copy, Check } from 'lucide-react';
import { validateEMQEvent, isConversionEvent, EXPECTED_VALUES, type EMQValidationResult } from '@/lib/emqValidator';

interface CapturedEvent {
  event: string;
  timestamp: Date;
  payload: Record<string, unknown>;
  validation: EMQValidationResult;
}

// Check if running in sandbox/development environment
function isSandboxEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname.endsWith('.lovable.app') ||
    hostname.endsWith('.lovableproject.com')
  );
}

// Check for ?debug=true URL parameter
function hasDebugParam(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === 'true';
}

function EMQValidatorOverlayInner() {
  const [isOpen, setIsOpen] = useState(() => {
    const stored = sessionStorage.getItem('emq-validator-open');
    return stored === 'true';
  });
  const [isMinimized, setIsMinimized] = useState(() => {
    const stored = sessionStorage.getItem('emq-validator-minimized');
    return stored === 'true';
  });
  const [events, setEvents] = useState<CapturedEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRawPayload, setShowRawPayload] = useState(false);
  const [copied, setCopied] = useState(false);

  // Persist state
  useEffect(() => {
    sessionStorage.setItem('emq-validator-open', String(isOpen));
  }, [isOpen]);

  useEffect(() => {
    sessionStorage.setItem('emq-validator-minimized', String(isMinimized));
  }, [isMinimized]);

  // Monkey-patch dataLayer.push to capture conversion events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize dataLayer if needed
    window.dataLayer = window.dataLayer || [];
    const originalPush = window.dataLayer.push.bind(window.dataLayer);

    window.dataLayer.push = (...args: unknown[]) => {
      const result = originalPush(...args);

      // Capture conversion events
      args.forEach((arg) => {
        if (arg && typeof arg === 'object' && 'event' in arg) {
          const eventData = arg as Record<string, unknown>;
          const eventName = eventData.event as string;

          if (isConversionEvent(eventName)) {
            const validation = validateEMQEvent(eventData);
            const newEvent: CapturedEvent = {
              event: eventName,
              timestamp: new Date(),
              payload: eventData,
              validation,
            };

            setEvents((prev) => {
              const updated = [newEvent, ...prev].slice(0, 10); // Keep last 10
              return updated;
            });
            setCurrentIndex(0);
            
            // Auto-open on new conversion event
            setIsOpen(true);
            setIsMinimized(false);
          }
        }
      });

      return result;
    };

    return () => {
      window.dataLayer.push = originalPush;
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (events.length === 0) return;
    const currentEvent = events[currentIndex];
    try {
      await navigator.clipboard.writeText(JSON.stringify(currentEvent.payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [events, currentIndex]);

  const currentEvent = events[currentIndex];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[180px] right-4 md:bottom-6 md:right-6 z-[9999] bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-slate-800 transition-colors text-sm font-mono flex items-center gap-2"
      >
        <span className="text-xs">📊</span>
        <span>EMQ</span>
        {events.length > 0 && (
          <span className={`px-1.5 py-0.5 rounded text-xs ${
            currentEvent?.validation.overallScore === 'HIGH' ? 'bg-green-500' :
            currentEvent?.validation.overallScore === 'MEDIUM' ? 'bg-amber-500' : 'bg-red-500'
          }`}>
            {events.length}
          </span>
        )}
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-[180px] right-4 md:bottom-6 md:right-6 z-[9999] bg-slate-900 text-white rounded-lg shadow-xl">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="text-xs">📊</span>
          <span className="text-sm font-mono">EMQ Validator</span>
          {events.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded text-xs ${
              currentEvent?.validation.overallScore === 'HIGH' ? 'bg-green-500' :
              currentEvent?.validation.overallScore === 'MEDIUM' ? 'bg-amber-500' : 'bg-red-500'
            }`}>
              {currentEvent?.validation.passedCount}/{currentEvent?.validation.totalChecks}
            </span>
          )}
          <button onClick={() => setIsMinimized(false)} className="ml-2 hover:bg-slate-700 p-1 rounded">
            <ChevronUp size={14} />
          </button>
          <button onClick={() => setIsOpen(false)} className="hover:bg-slate-700 p-1 rounded">
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[180px] right-4 md:bottom-6 md:right-6 z-[9998] w-[360px] max-h-[520px] bg-slate-900 text-white rounded-lg shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-2">
          <span>📊</span>
          <span className="font-semibold text-sm">EMQ Validator</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(true)} className="hover:bg-slate-700 p-1.5 rounded">
            <Minimize2 size={14} />
          </button>
          <button onClick={() => setIsOpen(false)} className="hover:bg-slate-700 p-1.5 rounded">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {events.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <AlertCircle className="mx-auto mb-2 opacity-50" size={32} />
            <p className="text-sm">No conversion events captured yet</p>
            <p className="text-xs mt-1 opacity-70">Submit a form to see validation</p>
          </div>
        ) : (
          <>
            {/* Event Header */}
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <code className="text-green-400 text-sm font-mono">{currentEvent.event}</code>
                <span className="text-xs text-slate-400">
                  {currentEvent.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Score Badge */}
            <div className={`rounded-lg p-4 text-center ${
              currentEvent.validation.overallScore === 'HIGH' ? 'bg-green-900/50 border border-green-500/30' :
              currentEvent.validation.overallScore === 'MEDIUM' ? 'bg-amber-900/50 border border-amber-500/30' :
              'bg-red-900/50 border border-red-500/30'
            }`}>
              <div className="text-xs uppercase tracking-wide opacity-70 mb-1">EMQ Probability</div>
              <div className={`text-2xl font-bold ${
                currentEvent.validation.overallScore === 'HIGH' ? 'text-green-400' :
                currentEvent.validation.overallScore === 'MEDIUM' ? 'text-amber-400' : 'text-red-400'
              }`}>
                {currentEvent.validation.overallScore}
                {currentEvent.validation.overallScore === 'HIGH' && ' (9.5+)'}
              </div>
              <div className="flex justify-center gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < currentEvent.validation.passedCount
                        ? currentEvent.validation.overallScore === 'HIGH' ? 'bg-green-400' :
                          currentEvent.validation.overallScore === 'MEDIUM' ? 'bg-amber-400' : 'bg-red-400'
                        : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Validation Checklist */}
            <div className="space-y-2">
              <ValidationRow
                label="Event ID"
                passed={currentEvent.validation.eventId.passed}
                value={currentEvent.validation.eventId.value}
                reason={currentEvent.validation.eventId.reason}
              />
              <ValidationRow
                label="Email Hash"
                passed={currentEvent.validation.emailHash.passed}
                value={currentEvent.validation.emailHash.value || '64-char SHA-256'}
                reason={currentEvent.validation.emailHash.reason}
              />
              <ValidationRow
                label="Phone Hash"
                passed={currentEvent.validation.phoneHash.passed}
                value={currentEvent.validation.phoneHash.value || '64-char SHA-256'}
                reason={currentEvent.validation.phoneHash.reason}
                isOptional={!currentEvent.validation.phoneHash.value && currentEvent.validation.phoneHash.passed}
              />
              <ValidationRow
                label="External ID"
                passed={currentEvent.validation.externalId.passed}
                value={currentEvent.validation.externalId.matchesLeadId ? 'matches lead_id' : currentEvent.validation.externalId.value}
                reason={currentEvent.validation.externalId.reason}
              />
              <ValidationRow
                label="Value/Currency"
                passed={currentEvent.validation.valueAndCurrency.passed}
                value={`$${currentEvent.validation.valueAndCurrency.actualValue ?? '?'} ${currentEvent.validation.valueAndCurrency.currency ?? '?'}`}
                reason={currentEvent.validation.valueAndCurrency.reason}
              />
            </div>

            {/* Raw Payload Toggle */}
            <div className="border-t border-slate-700 pt-3">
              <button
                onClick={() => setShowRawPayload(!showRawPayload)}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-full"
              >
                {showRawPayload ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showRawPayload ? 'Hide' : 'Show'} Raw Payload</span>
                {showRawPayload ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
              </button>
              
              {showRawPayload && (
                <div className="mt-2 relative">
                  <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center gap-1"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                  <pre className="bg-slate-800 rounded-lg p-3 text-xs overflow-x-auto max-h-48 overflow-y-auto font-mono text-slate-300">
                    {JSON.stringify(currentEvent.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Pagination */}
            {events.length > 1 && (
              <div className="flex items-center justify-center gap-4 pt-2 border-t border-slate-700">
                <button
                  onClick={() => setCurrentIndex(Math.min(currentIndex + 1, events.length - 1))}
                  disabled={currentIndex >= events.length - 1}
                  className="p-1.5 hover:bg-slate-700 rounded disabled:opacity-30"
                >
                  ◀
                </button>
                <span className="text-sm text-slate-400">
                  {currentIndex + 1} / {events.length}
                </span>
                <button
                  onClick={() => setCurrentIndex(Math.max(currentIndex - 1, 0))}
                  disabled={currentIndex <= 0}
                  className="p-1.5 hover:bg-slate-700 rounded disabled:opacity-30"
                >
                  ▶
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface ValidationRowProps {
  label: string;
  passed: boolean;
  value?: string;
  reason?: string;
  isOptional?: boolean;
}

function ValidationRow({ label, passed, value, reason, isOptional }: ValidationRowProps) {
  return (
    <div className={`flex items-start gap-3 p-2 rounded-lg ${
      passed ? 'bg-green-900/20' : isOptional ? 'bg-slate-800' : 'bg-red-900/20'
    }`}>
      <div className="mt-0.5">
        {passed ? (
          <CheckCircle2 size={16} className="text-green-400" />
        ) : isOptional ? (
          <AlertCircle size={16} className="text-slate-400" />
        ) : (
          <XCircle size={16} className="text-red-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {value && (
            <code className={`text-xs px-1.5 py-0.5 rounded truncate max-w-[180px] ${
              passed ? 'bg-green-900/30 text-green-300' : 'bg-slate-700 text-slate-300'
            }`}>
              {value}
            </code>
          )}
        </div>
        {reason && !passed && (
          <p className="text-xs text-red-300 mt-0.5">{reason}</p>
        )}
      </div>
    </div>
  );
}

export function EMQValidatorOverlay() {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    setShouldRender(isSandboxEnvironment() || hasDebugParam());
  }, []);

  if (!shouldRender) return null;

  return <EMQValidatorOverlayInner />;
}
