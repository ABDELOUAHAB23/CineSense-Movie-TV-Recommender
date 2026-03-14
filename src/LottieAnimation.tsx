import React from "react";
import Lottie from "lottie-react";
import firstAnimation from "./Animation - 1741886974627.json";
import secondAnimation from "./Animation - 1741887006334.json";
import "./animation.css";

interface LottieAnimationProps {
  animationType?: 'first' | 'second';
}

const LottieAnimation: React.FC<LottieAnimationProps> = ({ animationType = 'first' }) => {
  const animationData = animationType === 'first' ? firstAnimation : secondAnimation;

  return (
    <div className="animation-container" style={{ width: 200, height: 200 }}>
      <Lottie animationData={animationData} loop={true} className="lottie-animation" />
    </div>
  );
};

export default LottieAnimation;
