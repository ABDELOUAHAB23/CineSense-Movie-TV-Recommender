import React, { useState, useEffect, useRef } from "react";
import MyAnimation from "./LottieAnimation";
import "./LandingPage.css";

const LandingPage: React.FC = () => {
  const [showContent, setShowContent] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Function to reset and replay video
  const resetVideo = () => {
    if (videoRef.current) {
      // Reset video to beginning
      videoRef.current.currentTime = 0;
      // Reset content visibility
      setShowContent(false);
      // Play video
      videoRef.current.play().catch(err => {
        console.error("Error playing video:", err);
        // If video can't play, show content anyway
        setShowContent(true);
      });
    }
  };

  useEffect(() => {
    // Initial setup when component mounts
    if (videoRef.current) {
      const video = videoRef.current;
      
      // Show content when video ends
      video.onended = () => {
        console.log("Video ended, showing content");
        setShowContent(true);
      };
      
      // Try to play the video (may be prevented by browser autoplay policies)
      video.play().catch(err => {
        console.error("Initial video play error:", err);
        setShowContent(true); // Show content if video can't play
      });
      
      // Reset video on page visibility change (when user returns to tab)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          resetVideo();
        }
      });

      // Safety fallback - show content after video duration + 1 second
      video.onloadedmetadata = () => {
        const videoDuration = video.duration;
        setTimeout(() => {
          if (!showContent) {
            console.log("Fallback timeout: Showing content");
            setShowContent(true);
          }
        }, (videoDuration * 1000) + 1000);
      };
    }

    // Event listener for page refresh using beforeunload
    const handleBeforeUnload = () => {
      // Note: Can't actually reset video here as the page will unload anyway
      // This is just to prepare for when the page reloads
      localStorage.setItem('videoShouldReplay', 'true');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Check if we should replay video (after refresh)
    if (localStorage.getItem('videoShouldReplay') === 'true') {
      resetVideo();
      localStorage.removeItem('videoShouldReplay');
    }

    // Clean up event listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', resetVideo);
    };
  }, []);

  return (
    <div className="landing-container">
      {/* Video background with ref for direct control */}
      <video
        ref={videoRef}
        id="landing-video"
        autoPlay
        muted
        playsInline
        className="background-video"
      >
        <source src="/assets/forest-lights-copy.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Dark overlay */}
      <div className="overlay"></div>
      
      {/* Content - will show after video ends */}
      {showContent && (
        <div className="content-wrapper">
          <div className="animations-container">
            <div className="animation-section left">
              <MyAnimation animationType="first" />
            </div>
            <div className="animation-section right">
              <MyAnimation animationType="second" />
            </div>
          </div>
          <div className="button-container">
            <h1>Welcome to Movie Recommender</h1>
            <p>Discover Your Next Favorite Movies With AI Recommendation</p>
            <a href="/recommendations" className="btn">Get Started</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;