import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Upload } from 'lucide-react';

const STORY_PROMPTS = [
  "What holiday tradition is uniquely yours?",
  "Describe the smell of a grandparent's kitchen.",
  "What's the funniest thing said at a family dinner?",
  "Tell about a road trip that went sideways.",
  "What recipe has been passed down for generations?",
  "Describe the house you grew up in — sounds, light, corners.",
  "What story did your parents always tell about their childhood?",
  "Who was the family storyteller? What was their best tale?",
  "What lesson did an elder teach you without ever saying a word?",
  "Describe a moment the whole family laughed together.",
  "What family photograph tells the best story?",
  "What did Sunday mornings look like in your family?",
  "Tell about a time someone in the family surprised everyone.",
  "What was the most memorable family reunion?",
  "What sounds do you remember from your childhood home?",
  "What family saying or phrase do you still use today?",
  "Who in your family had the most interesting career?",
  "What was the bravest thing a family member ever did?",
  "Describe a garden, yard, or favorite outdoor place.",
  "What secret talent did someone in your family have?",
  "What was a favorite bedtime story or lullaby?",
  "Describe a family gathering place — porch, kitchen, yard.",
  "What did your family do on rainy afternoons?",
  "Tell about a piece of furniture or heirloom with a history.",
];

const MAX_RECORDINGS = 3;

const VoiceRecorder = ({ storyId, onAudioSaved, existingRecordings = [], pendingMode = false, pendingRecordings = [], onPendingAudioAdd, onPendingAudioRemove }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * STORY_PROMPTS.length));
  const [promptFading, setPromptFading] = useState(false);
  const [permissionState, setPermissionState] = useState('unknown');
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // File upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);

  const API_URL = process.env.REACT_APP_API ?? '';

  // Count both existing and pending recordings for the limit
  const totalRecordings = existingRecordings.length + (pendingRecordings?.length || 0);
  const canAddMore = totalRecordings < MAX_RECORDINGS;

  // Check microphone permission state on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'microphone' });
          setPermissionState(result.state);
          result.onchange = () => {
            setPermissionState(result.state);
            if (result.state === 'granted') {
              setShowPermissionGuide(false);
              setError(null);
            }
          };
        }
      } catch {
        // permissions.query may not support 'microphone' in all browsers
      }
    };
    checkPermission();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [audioPreviewUrl, filePreviewUrl]);

  const startRecording = useCallback(async () => {
    setError(null);
    setShowPermissionGuide(false);

    if (!canAddMore) {
      setError(`Maximum of ${MAX_RECORDINGS} recordings reached. Delete one to record another.`);
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Microphone access requires a secure connection (HTTPS). Please access this site over HTTPS.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermissionState('granted');

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioPreviewUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      setAudioBlob(null);
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl(null);
      }

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setShowPermissionGuide(true);
        setError('Microphone access was denied.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError('Could not access microphone. Please check your device settings.');
      }
    }
  }, [audioPreviewUrl, canAddMore]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const discardRecording = useCallback(() => {
    setAudioBlob(null);
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }
    setRecordingTime(0);
  }, [audioPreviewUrl]);

  // File upload handlers
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
                        'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/m4a'];
    const validExtensions = ['.mp3', '.wav', '.m4a', '.aac'];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      setError('Please select a valid audio file (MP3, WAV, M4A, or AAC)');
      return;
    }

    if (!canAddMore) {
      setError(`Maximum of ${MAX_RECORDINGS} recordings reached. Delete one to add another.`);
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview URL
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setFilePreviewUrl(URL.createObjectURL(file));

    // Reset input so the same file can be selected again if needed
    e.target.value = '';
  }, [canAddMore, filePreviewUrl]);

  const discardSelectedFile = useCallback(() => {
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
  }, [filePreviewUrl]);

  const uploadSelectedFile = useCallback(async () => {
    if (!selectedFile) return;

    // If in pending mode, add to pending list instead of uploading
    if (pendingMode) {
      if (onPendingAudioAdd) {
        onPendingAudioAdd({
          id: `pending-${Date.now()}`,
          blob: selectedFile,
          fileName: selectedFile.name,
          previewUrl: filePreviewUrl,
          type: 'upload'
        });
      }
      setSelectedFile(null);
      setFilePreviewUrl(null); // Don't revoke - it's now owned by the pending list
      return;
    }

    if (!storyId) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', selectedFile);
      // Try to get duration from audio element if possible
      const audio = document.createElement('audio');
      audio.src = filePreviewUrl;

      const token = localStorage.getItem('familyVine_token');
      const response = await axios.post(
        `${API_URL}/api/stories/${storyId}/audio`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (onAudioSaved) {
        onAudioSaved(response.data.audio);
      }

      setSelectedFile(null);
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
        setFilePreviewUrl(null);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to upload audio file. Please try again.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  }, [selectedFile, storyId, filePreviewUrl, API_URL, onAudioSaved, pendingMode, onPendingAudioAdd]);

  const uploadAudio = useCallback(async () => {
    if (!audioBlob) return;

    // If in pending mode, add to pending list instead of uploading
    if (pendingMode) {
      if (onPendingAudioAdd) {
        onPendingAudioAdd({
          id: `pending-${Date.now()}`,
          blob: audioBlob,
          duration: recordingTime,
          fileName: 'recording.webm',
          previewUrl: audioPreviewUrl,
          type: 'recording'
        });
      }
      setAudioBlob(null);
      setAudioPreviewUrl(null); // Don't revoke - it's now owned by the pending list
      setRecordingTime(0);
      return;
    }

    if (!storyId) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('duration', String(recordingTime));

      const token = localStorage.getItem('familyVine_token');
      const response = await axios.post(
        `${API_URL}/api/stories/${storyId}/audio`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (onAudioSaved) {
        onAudioSaved(response.data.audio);
      }

      setAudioBlob(null);
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl(null);
      }
      setRecordingTime(0);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to upload audio. Please try again.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  }, [audioBlob, storyId, recordingTime, API_URL, onAudioSaved, audioPreviewUrl, pendingMode, onPendingAudioAdd]);

  const deleteRecording = useCallback(async (audioId) => {
    if (!storyId || !audioId) return;
    setDeletingId(audioId);
    setError(null);

    try {
      const token = localStorage.getItem('familyVine_token');
      await axios.delete(
        `${API_URL}/api/stories/${storyId}/audio/${audioId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (onAudioSaved) {
        onAudioSaved(null, audioId);
      }
    } catch (err) {
      setError('Failed to delete recording. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }, [storyId, API_URL, onAudioSaved]);

  const nextPrompt = useCallback(() => {
    setPromptFading(true);
    setTimeout(() => {
      setPromptIndex(prev => {
        let next;
        do { next = Math.floor(Math.random() * STORY_PROMPTS.length); } while (next === prev);
        return next;
      });
      setPromptFading(false);
    }, 300);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="voice-recorder">
      <div className="voice-recorder-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5" style={{ color: 'var(--vine-green, #2E5A2E)' }}>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="8" y1="23" x2="16" y2="23" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ flex: 1 }}>
          <span style={{
            fontFamily: 'var(--font-header, "Playfair Display", serif)',
            fontSize: '1.1rem',
            fontWeight: 600,
            color: 'var(--vine-dark, #2D4F1E)',
            display: 'block',
          }}>
            Voice of the Vine
          </span>
          <span style={{
            fontFamily: 'var(--font-body, "Inter", sans-serif)',
            fontSize: '0.7rem',
            color: 'var(--vine-sage, #86A789)',
          }}>
            Record or upload audio
          </span>
        </div>
        <span style={{
          fontFamily: 'var(--font-body, "Inter", sans-serif)',
          fontSize: '0.7rem',
          color: 'var(--vine-sage, #86A789)',
        }}>
          {totalRecordings}/{MAX_RECORDINGS}
        </span>
      </div>

      {/* Pending Recordings List (for new stories) */}
      {pendingMode && pendingRecordings && pendingRecordings.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {pendingRecordings.map((recording, index) => (
            <div key={recording.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              background: 'rgba(212, 175, 55, 0.08)',
              borderRadius: '8px',
              marginBottom: index < pendingRecordings.length - 1 ? '6px' : 0,
              border: '1px solid rgba(212, 175, 55, 0.2)',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '16px', height: '16px', color: 'var(--vine-green, #2E5A2E)', flexShrink: 0 }}>
                <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <span style={{
                fontFamily: 'var(--font-body, "Inter", sans-serif)',
                fontSize: '0.8rem',
                color: 'var(--vine-dark, #2D4F1E)',
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {recording.type === 'upload' ? recording.fileName : `Recording ${index + 1}`}
                {recording.duration && (
                  <span style={{ color: 'var(--vine-sage, #86A789)', marginLeft: '6px' }}>
                    ({formatTime(recording.duration)})
                  </span>
                )}
              </span>
              <span style={{
                fontFamily: 'var(--font-body, "Inter", sans-serif)',
                fontSize: '0.65rem',
                color: '#D4AF37',
                fontStyle: 'italic',
              }}>
                pending
              </span>
              <button
                type="button"
                onClick={() => onPendingAudioRemove && onPendingAudioRemove(recording.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#8B2E2E',
                  opacity: 0.7,
                  padding: '2px',
                  flexShrink: 0,
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-body, "Inter", sans-serif)',
                  transition: 'opacity 0.2s',
                }}
                title="Remove"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Existing Recordings List */}
      {existingRecordings.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {existingRecordings
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((recording, index) => (
              <div key={recording.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background: 'rgba(134, 167, 137, 0.06)',
                borderRadius: '8px',
                marginBottom: index < existingRecordings.length - 1 ? '6px' : 0,
                border: '1px solid rgba(134, 167, 137, 0.12)',
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '16px', height: '16px', color: 'var(--vine-green, #2E5A2E)', flexShrink: 0 }}>
                  <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
                <span style={{
                  fontFamily: 'var(--font-body, "Inter", sans-serif)',
                  fontSize: '0.8rem',
                  color: 'var(--vine-dark, #2D4F1E)',
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {recording.title || `Recording ${index + 1}`}
                  {recording.audio_duration && (
                    <span style={{ color: 'var(--vine-sage, #86A789)', marginLeft: '6px' }}>
                      ({formatTime(recording.audio_duration)})
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => deleteRecording(recording.id)}
                  disabled={deletingId === recording.id}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#8B2E2E',
                    opacity: deletingId === recording.id ? 0.5 : 0.7,
                    padding: '2px',
                    flexShrink: 0,
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-body, "Inter", sans-serif)',
                    transition: 'opacity 0.2s',
                  }}
                  title="Delete recording"
                >
                  {deletingId === recording.id ? '...' : 'Delete'}
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Recording Controls */}
      {canAddMore && (
        <div className="voice-recorder-controls">
          {!isRecording && !audioBlob && (
            <button
              type="button"
              onClick={startRecording}
              className="voice-recorder-btn"
              title={permissionState === 'denied' ? 'Click to retry microphone access' : 'Start recording'}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <circle cx="12" cy="12" r="8" />
              </svg>
            </button>
          )}

          {isRecording && (
            <>
              <button
                type="button"
                onClick={stopRecording}
                className="voice-recorder-btn recording"
                title="Stop recording"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
              <span className="voice-recorder-timer">{formatTime(recordingTime)}</span>
            </>
          )}

          {audioBlob && !isRecording && (
            <div className="voice-recorder-preview">
              <audio src={audioPreviewUrl} controls className="voice-recorder-audio" />
              <div className="voice-recorder-actions">
                <button
                  type="button"
                  onClick={uploadAudio}
                  disabled={uploading}
                  className="voice-recorder-upload-btn"
                >
                  {uploading ? (
                    <span className="voice-recorder-uploading">
                      <div className="voice-recorder-spinner" />
                      Saving...
                    </span>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="17 21 17 13 7 13 7 21" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="7 3 7 8 15 8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {pendingMode ? 'Add Recording' : 'Save Recording'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={discardRecording}
                  className="voice-recorder-discard-btn"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* File Upload Preview */}
      {selectedFile && !isRecording && !audioBlob && (
        <div className="voice-recorder-preview" style={{ marginTop: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
            padding: '6px 10px',
            background: 'rgba(134, 167, 137, 0.08)',
            borderRadius: '6px',
          }}>
            <Upload style={{ width: '14px', height: '14px', color: 'var(--vine-green, #2E5A2E)' }} />
            <span style={{
              fontFamily: 'var(--font-body, "Inter", sans-serif)',
              fontSize: '0.78rem',
              color: 'var(--vine-dark, #2D4F1E)',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {selectedFile.name}
            </span>
          </div>
          <audio src={filePreviewUrl} controls className="voice-recorder-audio" />
          <div className="voice-recorder-actions">
            <button
              type="button"
              onClick={uploadSelectedFile}
              disabled={uploading}
              className="voice-recorder-upload-btn"
            >
              {uploading ? (
                <span className="voice-recorder-uploading">
                  <div className="voice-recorder-spinner" />
                  Saving...
                </span>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="17 21 17 13 7 13 7 21" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="7 3 7 8 15 8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {pendingMode ? 'Add Audio' : 'Save Audio'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={discardSelectedFile}
              className="voice-recorder-discard-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Divider and Upload File Button - shown when not recording and no preview active */}
      {canAddMore && !isRecording && !audioBlob && !selectedFile && (
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          {/* "or" divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(134, 167, 137, 0.25)' }} />
            <span style={{
              fontFamily: 'var(--font-body, "Inter", sans-serif)',
              fontSize: '0.7rem',
              color: 'var(--vine-sage, #86A789)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              or
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(134, 167, 137, 0.25)' }} />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.m4a,.aac,audio/mpeg,audio/mp3,audio/wav,audio/mp4,audio/x-m4a,audio/aac"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'rgba(134, 167, 137, 0.1)',
              border: '1px dashed rgba(134, 167, 137, 0.4)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'var(--font-body, "Inter", sans-serif)',
              fontSize: '0.8rem',
              color: 'var(--vine-green, #2E5A2E)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(134, 167, 137, 0.18)';
              e.currentTarget.style.borderColor = 'var(--vine-green, #2E5A2E)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(134, 167, 137, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(134, 167, 137, 0.4)';
            }}
          >
            <Upload style={{ width: '14px', height: '14px' }} />
            Upload Audio File
          </button>
          <p style={{
            fontFamily: 'var(--font-body, "Inter", sans-serif)',
            fontSize: '0.7rem',
            color: 'var(--vine-sage, #86A789)',
            margin: '6px 0 0',
          }}>
            MP3, WAV, M4A, or AAC
          </p>
        </div>
      )}

      {!canAddMore && !isRecording && !audioBlob && !selectedFile && (
        <p style={{
          fontFamily: 'var(--font-body, "Inter", sans-serif)',
          fontSize: '0.78rem',
          color: 'var(--vine-sage, #86A789)',
          margin: '8px 0 0',
          textAlign: 'center',
        }}>
          Maximum of {MAX_RECORDINGS} recordings reached. Delete one to add another.
        </p>
      )}

      {error && (
        <p className="voice-recorder-error">{error}</p>
      )}

      {showPermissionGuide && (
        <div className="voice-permission-guide">
          <p className="voice-permission-guide-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" style={{ display: 'inline', verticalAlign: '-3px', marginRight: '6px' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            How to enable microphone access
          </p>
          <ol className="voice-permission-steps">
            <li>Click the <strong>lock icon</strong> (or site settings icon) in your browser's address bar</li>
            <li>Find <strong>Microphone</strong> in the permissions list</li>
            <li>Change it from "Block" to <strong>"Allow"</strong></li>
            <li>Reload this page, then try recording again</li>
          </ol>
          <button
            type="button"
            onClick={() => setShowPermissionGuide(false)}
            className="voice-permission-dismiss"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
