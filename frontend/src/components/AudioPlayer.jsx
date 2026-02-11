import React, { useState, useRef, useEffect, useCallback } from 'react';

const AudioPlayer = ({ audioUrl, duration, transcript }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  const API_URL = process.env.REACT_APP_API ?? '';
  const fullAudioUrl = audioUrl?.startsWith('http') ? audioUrl : `${API_URL}/${audioUrl}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleProgressClick = useCallback((e) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar) return;

    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newTime = ratio * (totalDuration || audio.duration || 0);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [totalDuration]);

  const formatTime = (seconds) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  if (!audioUrl) return null;

  return (
    <div className="heritage-audio-player">
      <audio ref={audioRef} src={fullAudioUrl} preload="metadata" />

      <div className="heritage-audio-controls">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="heritage-audio-play-btn"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        {/* Progress Section */}
        <div className="heritage-audio-progress-section">
          {/* Waveform decoration */}
          <div className="heritage-audio-waveform">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className="heritage-audio-wave-bar"
                style={{
                  height: `${20 + Math.sin(i * 0.8) * 15 + Math.random() * 10}%`,
                  opacity: (i / 32) * 100 <= progress ? 1 : 0.3,
                }}
              />
            ))}
          </div>

          {/* Clickable progress bar */}
          <div
            ref={progressRef}
            className="heritage-audio-progress"
            onClick={handleProgressClick}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={totalDuration}
            aria-valuenow={currentTime}
            tabIndex={0}
          >
            <div
              className="heritage-audio-progress-fill"
              style={{ width: `${progress}%` }}
            />
            <div
              className="heritage-audio-scrubber"
              style={{ left: `${progress}%` }}
            />
          </div>

          {/* Time display */}
          <div className="heritage-audio-time">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* Transcript toggle */}
      {transcript && (
        <>
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="heritage-audio-transcript-toggle"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {showTranscript ? 'Hide Transcript' : 'View Transcript'}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-3 h-3"
              style={{ transform: showTranscript ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showTranscript && (
            <div className="vellum-scroll">
              <p className="vellum-scroll-text">{transcript}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AudioPlayer;
