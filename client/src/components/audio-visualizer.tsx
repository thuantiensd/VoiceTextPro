import { useEffect, useState, useRef } from "react";

interface AudioVisualizerProps {
  isPlaying: boolean;
  height?: number;
  barCount?: number;
  mode?: "particles" | "liquid" | "neural" | "galaxy";
  showFrequencyLabels?: boolean;
  color?: "sunset" | "ocean" | "forest" | "cosmic";
}

export default function AudioVisualizer({ 
  isPlaying, 
  height = 120, 
  barCount = 32,
  mode = "particles",
  showFrequencyLabels = false,
  color = "sunset"
}: AudioVisualizerProps) {
  const [particles, setParticles] = useState<any[]>([]);
  const [liquidPhase, setLiquidPhase] = useState(0);
  const [neuralNodes, setNeuralNodes] = useState<any[]>([]);
  const [galaxyRotation, setGalaxyRotation] = useState(0);
  const animationRef = useRef<number>();

  // Generate particles for particle mode
  const generateParticles = () => {
    if (!isPlaying) return [];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      speed: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      color: getParticleColor(i),
      phase: Math.random() * Math.PI * 2
    }));
  };

  // Generate neural network nodes
  const generateNeuralNodes = () => {
    if (!isPlaying) return [];
    
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      connections: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, 
        () => Math.floor(Math.random() * 20)),
      pulse: Math.random(),
      activity: Math.random()
    }));
  };

  const getParticleColor = (index: number) => {
    switch (color) {
      case "sunset":
        const sunsetColors = ["#ff6b6b", "#ffd93d", "#ff8c69", "#ff4757"];
        return sunsetColors[index % sunsetColors.length];
      case "ocean":
        const oceanColors = ["#00d2ff", "#3742fa", "#2f86eb", "#70a1ff"];
        return oceanColors[index % oceanColors.length];
      case "forest":
        const forestColors = ["#00d8d6", "#05c46b", "#0be881", "#00b894"];
        return forestColors[index % forestColors.length];
      case "cosmic":
        const cosmicColors = ["#a55eea", "#26de81", "#fd79a8", "#fdcb6e"];
        return cosmicColors[index % cosmicColors.length];
      default:
        return "#3b82f6";
    }
  };

  const getGradientColors = () => {
    switch (color) {
      case "sunset":
        return "from-orange-400 via-red-500 to-pink-500";
      case "ocean":
        return "from-blue-400 via-cyan-500 to-teal-500";
      case "forest":
        return "from-green-400 via-emerald-500 to-teal-500";
      case "cosmic":
        return "from-purple-400 via-pink-500 to-indigo-500";
      default:
        return "from-blue-400 via-purple-500 to-pink-500";
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      setParticles([]);
      setNeuralNodes([]);
      setLiquidPhase(0);
      setGalaxyRotation(0);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = () => {
      setParticles(prev => prev.map(p => ({
        ...p,
        x: (p.x + p.speed * 0.5) % 100,
        y: p.y + Math.sin(Date.now() * 0.001 + p.phase) * 0.5,
        opacity: 0.3 + Math.sin(Date.now() * 0.002 + p.phase) * 0.3
      })));
      
      setLiquidPhase(prev => prev + 0.05);
      setGalaxyRotation(prev => prev + 0.5);
      setNeuralNodes(prev => prev.map(node => ({
        ...node,
        pulse: Math.sin(Date.now() * 0.003 + node.id) * 0.5 + 0.5,
        activity: Math.sin(Date.now() * 0.002 + node.id * 0.5) * 0.5 + 0.5
      })));
      
      animationRef.current = requestAnimationFrame(animate);
    };

    // Initialize based on mode
    if (mode === "particles") {
      setParticles(generateParticles());
    } else if (mode === "neural") {
      setNeuralNodes(generateNeuralNodes());
    }

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, mode, color]);

  const renderParticles = () => (
    <div className="relative w-full h-full overflow-hidden">
      {/* Animated background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradientColors()} opacity-20 animate-pulse`} />
      
      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            transform: `scale(${isPlaying ? 1 : 0.3})`,
            transition: 'transform 0.3s ease'
          }}
        />
      ))}
      
      {/* Central energy core */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div 
          className={`w-20 h-20 rounded-full bg-gradient-to-r ${getGradientColors()} animate-spin-slow opacity-70`}
          style={{
            animationDuration: isPlaying ? '3s' : '10s',
            boxShadow: `0 0 40px ${getParticleColor(0)}`
          }}
        />
      </div>
    </div>
  );

  const renderLiquid = () => (
    <div className="relative w-full h-full overflow-hidden rounded-xl">
      {/* Liquid background */}
      <div className={`absolute inset-0 bg-gradient-to-t ${getGradientColors()}`} />
      
      {/* Animated liquid waves */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
        <defs>
          <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
          </linearGradient>
        </defs>
        
        {/* Multiple flowing waves */}
        {[0, 1, 2].map(i => (
          <path
            key={i}
            d={`M 0 ${100 + i * 20} Q 100 ${80 + Math.sin(liquidPhase + i) * 20} 200 ${100 + i * 20} T 400 ${100 + i * 20} V 200 H 0 Z`}
            fill="url(#liquidGradient)"
            opacity={0.6 - i * 0.2}
            style={{
              transform: isPlaying ? 'none' : 'scaleY(0.3)',
              transition: 'transform 0.5s ease'
            }}
          />
        ))}
        
        {/* Bubbles */}
        {Array.from({ length: 10 }).map((_, i) => (
          <circle
            key={i}
            cx={50 + i * 30}
            cy={150 + Math.sin(liquidPhase + i) * 30}
            r={3 + Math.sin(liquidPhase * 2 + i) * 2}
            fill="rgba(255,255,255,0.6)"
            style={{
              opacity: isPlaying ? 0.8 : 0.2,
              transition: 'opacity 0.3s ease'
            }}
          />
        ))}
      </svg>
    </div>
  );

  const renderNeural = () => (
    <div className="relative w-full h-full overflow-hidden bg-black rounded-xl">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Neural connections */}
        {neuralNodes.map(node => 
          node.connections.map((targetId: number, i: number) => {
            const target = neuralNodes[targetId];
            if (!target) return null;
            
            return (
              <line
                key={`${node.id}-${targetId}-${i}`}
                x1={node.x}
                y1={node.y}
                x2={target.x}
                y2={target.y}
                stroke={getParticleColor(node.id)}
                strokeWidth={node.activity * 2}
                opacity={node.pulse * 0.8}
                className="transition-all duration-300"
              />
            );
          })
        )}
        
        {/* Neural nodes */}
        {neuralNodes.map(node => (
          <circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={2 + node.pulse * 3}
            fill={getParticleColor(node.id)}
            opacity={0.8}
            style={{
              filter: `drop-shadow(0 0 ${node.activity * 10}px ${getParticleColor(node.id)})`
            }}
          />
        ))}
        
        {/* Data pulses */}
        {neuralNodes.slice(0, 5).map(node => (
          <circle
            key={`pulse-${node.id}`}
            cx={node.x}
            cy={node.y}
            r={node.pulse * 8}
            fill="none"
            stroke={getParticleColor(node.id)}
            strokeWidth="1"
            opacity={1 - node.pulse}
          />
        ))}
      </svg>
    </div>
  );

  const renderGalaxy = () => (
    <div className="relative w-full h-full overflow-hidden bg-black rounded-xl">
      {/* Stars background */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.8 + 0.2
            }}
          />
        ))}
      </div>
      
      {/* Galaxy spiral */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div 
          className="relative w-32 h-32"
          style={{ transform: `rotate(${galaxyRotation}deg)` }}
        >
          {/* Spiral arms */}
          {[0, 1, 2].map(arm => (
            <div key={arm} className="absolute inset-0">
              {Array.from({ length: 20 }).map((_, i) => {
                const angle = (arm * 120 + i * 18) * Math.PI / 180;
                const radius = (i / 20) * 60;
                const x = 50 + Math.cos(angle) * radius;
                const y = 50 + Math.sin(angle) * radius;
                
                return (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      backgroundColor: getParticleColor(i),
                      boxShadow: `0 0 ${4 + Math.sin(Date.now() * 0.005 + i) * 2}px ${getParticleColor(i)}`,
                      transform: `scale(${0.5 + Math.sin(Date.now() * 0.003 + i) * 0.3})`,
                      opacity: isPlaying ? 0.8 : 0.3
                    }}
                  />
                );
              })}
            </div>
          ))}
          
          {/* Central black hole */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div 
              className={`w-8 h-8 rounded-full bg-gradient-radial from-transparent via-purple-500 to-black`}
              style={{
                boxShadow: isPlaying ? '0 0 20px purple, inset 0 0 20px black' : '0 0 5px purple'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderVisualizer = () => {
    switch (mode) {
      case "particles":
        return renderParticles();
      case "liquid":
        return renderLiquid();
      case "neural":
        return renderNeural();
      case "galaxy":
        return renderGalaxy();
      default:
        return renderParticles();
    }
  };

  return (
    <div 
      className="relative rounded-xl border-2 border-white/20 overflow-hidden transition-all duration-500 backdrop-blur-sm"
      style={{ 
        height: `${height + 20}px`,
        background: `linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,40,0.9) 100%)`
      }}
    >
      {renderVisualizer()}
      
      {/* Overlay effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />
      
      {/* Status indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
        <div 
          className={`w-2 h-2 rounded-full transition-all ${
            isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
          }`} 
        />
        <span className="text-xs text-white font-medium">
          {isPlaying ? 'CREATING' : 'IDLE'}
        </span>
      </div>
    </div>
  );
}
