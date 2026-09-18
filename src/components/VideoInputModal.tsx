import React, { useState, useRef } from 'react';
import { X, Upload, Link, Film } from 'lucide-react';

interface VideoInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomVideo: (data: {
    title: string;
    videoUrl: string;
    subtitleText?: string;
  }) => void;
}

export const VideoInputModal: React.FC<VideoInputModalProps> = ({
  isOpen,
  onClose,
  onCustomVideo,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload');
  const [videoLink, setVideoLink] = useState('');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [customSubtitles, setCustomSubtitles] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const prevBlobUrlRef = useRef<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    if (file && file.type.startsWith('video/')) {
      // Clean up previous blob URL to avoid memory leak
      if (prevBlobUrlRef.current) {
        URL.revokeObjectURL(prevBlobUrlRef.current);
      }
      const blobUrl = URL.createObjectURL(file);
      prevBlobUrlRef.current = blobUrl;
      setUploadedVideoUrl(blobUrl);
      setSelectedFileName(file.name);
      setEpisodeTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const isYouTubeOrVimeo = /youtube\.com|youtu\.be|vimeo\.com/i.test(videoLink);

  const handleApplyCustom = () => {
    const url = activeTab === 'upload' ? uploadedVideoUrl : videoLink;
    if (!url) return;

    onCustomVideo({
      title: episodeTitle || 'Custom Drama Episode',
      videoUrl: url,
      subtitleText: customSubtitles.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-cyan-600" />
            <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
              Select or Upload Drama Episode
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 px-5 pt-3 gap-4 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 transition border-b-2 ${
              activeTab === 'upload'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Upload Video File
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`pb-2.5 transition border-b-2 ${
              activeTab === 'link'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Link Video URL
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
                  dragActive
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30'
                    : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
                }`}
              >
                <input
                  type="file"
                  id="video-file-input"
                  accept="video/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <label htmlFor="video-file-input" className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {selectedFileName || 'Click to select or drag & drop episode video (MP4, WebM)'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Plays natively inside the browser with synchronized subtitles and pronunciation
                  </p>
                </label>
              </div>

              {/* Optional Subtitle text input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Optional Subtitle Script / Transcript (AI will analyze, align Pinyin, and translate):
                </label>
                <textarea
                  rows={3}
                  value={customSubtitles}
                  onChange={(e) => setCustomSubtitles(e.target.value)}
                  placeholder="Paste Mandarin lines or subtitles (e.g. 真的假的啦？我怎麼都不知道！)..."
                  className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-gray-900 dark:text-white"
                />
              </div>

              <button
                onClick={handleApplyCustom}
                disabled={!uploadedVideoUrl}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs sm:text-sm transition disabled:opacity-50"
              >
                Load Uploaded Video &amp; Analyze Subtitles
              </button>
            </div>
          )}

          {activeTab === 'link' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Video URL (Direct MP4, WebM, or media stream):
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    placeholder="https://example.com/drama-episode.mp4"
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-gray-900 dark:text-white"
                  />
                </div>

                {isYouTubeOrVimeo && (
                  <div className="mt-2 p-2.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800 text-[11px] text-yellow-800 dark:text-yellow-300 leading-relaxed">
                    <strong>Note on YouTube/Vimeo links:</strong> HTML5 video players cannot directly render web page URLs like YouTube due to iframe cross-origin streaming rules. For the best experience, please upload an MP4/WebM video file directly instead (in the <em>Upload Video File</em> tab).
                  </div>
                )}

                {/* Quick test direct sample URLs */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                  <span>Quick test direct link:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoLink('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4');
                      setEpisodeTitle('Tears of Steel (Sci-Fi Dialogue Demo)');
                    }}
                    className="text-cyan-600 hover:underline"
                  >
                    Sample MP4 Stream 1
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoLink('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
                      setEpisodeTitle('Short Clip Drama Demo');
                    }}
                    className="text-cyan-600 hover:underline"
                  >
                    Sample MP4 Stream 2
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Episode Title:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Someday or One Day - Episode 1"
                  value={episodeTitle}
                  onChange={(e) => setEpisodeTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Subtitles or Script text (Mandarin Chinese):
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste Mandarin lines here. Gemini AI will automatically extract character pinyin, English translations, and Taiwanese cultural notes..."
                  value={customSubtitles}
                  onChange={(e) => setCustomSubtitles(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-gray-900 dark:text-white"
                />
              </div>

              <button
                onClick={handleApplyCustom}
                disabled={!videoLink.trim()}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs sm:text-sm transition disabled:opacity-50"
              >
                Load Video &amp; Parse Subtitles
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
