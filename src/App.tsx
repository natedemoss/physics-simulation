import React, { useState, useEffect, useRef } from 'react';
import './App.css';

interface ProjectileState {
  x: number;
  y: number;
  time: number;
}

const TABS = [
  'Projectile Motion',
  "Newton's Laws",
  'Harmonic Motion',
  'Collision & Momentum',
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Projectile Motion');

  // Stop all simulations when tab changes (initial state cleanup)
  useEffect(() => {
    setIsSimulating(false);
    setShowProjectile(false);
    setNewtonSimulating(false);
    setHmSimulating(false);
    setCmSimulating(false);
    // Individual effect cleanups will handle canvas clearing and animation frame cancellation
  }, [activeTab]);

  // --- Projectile Motion State & Logic ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [velocity, setVelocity] = useState(50);
  const [angle, setAngle] = useState(45);
  const [isSimulating, setIsSimulating] = useState(false);
  const [maxHeight, setMaxHeight] = useState(0);
  const [range, setRange] = useState(0);
  const [timeOfFlight, setTimeOfFlight] = useState(0);
  const [trajectory, setTrajectory] = useState<{x: number, y: number}[]>([]);
  const [showProjectile, setShowProjectile] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1); // 1x speed by default
  const g = 9.81; // gravity in m/s²
  // Dynamically set scale so the projectile fits the canvas
  const canvasWidth = 1200;
  const canvasHeight = 400;
  const margin = 100;
  // Use a default scale if range is 0 to avoid division by zero
  const scale = (canvasWidth - margin) / (range > 0 ? range : 100);
  const timeStep = 0.016; // Approximate time step for animation logic (not actual frame time)
  const projectileAnimationRef = useRef<number | null>(null); // Ref for projectile animation frame ID

  // Helper to recalculate trajectory and metrics
  const recalcTrajectoryAndMetrics = (vel: number, ang: number) => {
    const radians = (ang * Math.PI) / 180;
    const tFlight = (2 * vel * Math.sin(radians)) / g;
    const r = (vel * vel * Math.sin(2 * radians)) / g;
    const h = (vel * vel * Math.sin(radians) * Math.sin(radians)) / (2 * g);
    setTimeOfFlight(tFlight);
    setRange(r);
    setMaxHeight(h);
    // Precompute trajectory
    const traj: {x: number, y: number}[] = [];
    for (let t = 0; t <= tFlight; t += 0.01) {
      const x = vel * Math.cos(radians) * t;
      const y = vel * Math.sin(radians) * t - 0.5 * g * t * t;
      if (y >= 0) traj.push({x, y});
    }
    setTrajectory(traj);
    // Set animation speed proportional to velocity (higher velocity = faster animation)
    setAnimationSpeed(vel / 50); // 50 is the default velocity, so 1x at 50, 2x at 100, etc.
  };

  // Recalculate trajectory and metrics on slider change
  useEffect(() => {
    recalcTrajectoryAndMetrics(velocity, angle);
    setIsSimulating(false); // Stop animation if sliders change
    setShowProjectile(false);
  }, [velocity, angle]);

  const startSimulation = () => {
    setIsSimulating(true);
    setShowProjectile(true);
  };

  const resetSimulation = () => {
    setVelocity(50);
    setAngle(45);
    setIsSimulating(false);
    setShowProjectile(false);
    recalcTrajectoryAndMetrics(50, 45);
    // Clear the canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Projectile Motion animation
  useEffect(() => {
    if (activeTab !== 'Projectile Motion' || !isSimulating) {
      // Cleanup when leaving tab or simulation stops
      if (projectileAnimationRef.current) {
        cancelAnimationFrame(projectileAnimationRef.current);
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the full trajectory path
    // Clear the canvas before drawing each frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw ground
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 50);
    ctx.lineTo(canvas.width, canvas.height - 50);
    ctx.strokeStyle = '#333';
    ctx.stroke();
    // Draw trajectory path (only in Projectile Motion tab)
    if (activeTab === 'Projectile Motion') {
      ctx.beginPath();
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2.5;
      if (trajectory.length > 0) {
        ctx.moveTo(trajectory[0].x * scale + 50, canvas.height - 50 - trajectory[0].y * scale);
        for (let i = 1; i < trajectory.length; i++) {
          ctx.lineTo(trajectory[i].x * scale + 50, canvas.height - 50 - trajectory[i].y * scale);
        }
        ctx.stroke();
      }
    }
    if (!isSimulating) return;
    let start = performance.now();
    const totalTime = timeOfFlight;
    const animate = (now: number) => {
      const elapsed = (now - start) / 1000 * animationSpeed; // speed up based on velocity
      const t = Math.min(elapsed, totalTime);
      const radians = (angle * Math.PI) / 180;
      const x = velocity * Math.cos(radians) * t;
      const y = velocity * Math.sin(radians) * t - 0.5 * g * t * t;
      // Redraw trajectory and ground
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 50);
      ctx.lineTo(canvas.width, canvas.height - 50);
      ctx.strokeStyle = '#333';
      ctx.stroke();
      // Draw trajectory path (only in Projectile Motion tab)
      if (activeTab === 'Projectile Motion') {
        ctx.beginPath();
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2.5;
        if (trajectory.length > 0) {
          ctx.moveTo(trajectory[0].x * scale + 50, canvas.height - 50 - trajectory[0].y * scale);
          for (let i = 1; i < trajectory.length; i++) {
            ctx.lineTo(trajectory[i].x * scale + 50, canvas.height - 50 - trajectory[i].y * scale);
          }
          ctx.stroke();
        }
      }
      // Draw projectile
      if (showProjectile && y >= 0) {
        ctx.save();
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(x * scale + 50, canvas.height - 50 - y * scale, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x * scale + 50, canvas.height - 50 - y * scale, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4444';
        ctx.fill();
        ctx.restore();
      }
      if (y < 0 || t >= totalTime) {
        setIsSimulating(false);
        setShowProjectile(false);
        return;
      }
      // Request next frame only if still simulating and on the correct tab
      if (isSimulating && activeTab === 'Projectile Motion') {
        projectileAnimationRef.current = requestAnimationFrame(animate);
      }
    };
    // Start the animation only if simulating and on the correct tab
    if (isSimulating && activeTab === 'Projectile Motion') {
      projectileAnimationRef.current = requestAnimationFrame(animate);
    }

    // Cleanup function for the effect
    return () => {
      if (projectileAnimationRef.current) {
        cancelAnimationFrame(projectileAnimationRef.current);
      }
      // Also clear the canvas when unmounting or leaving tab
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [isSimulating, velocity, angle, activeTab, trajectory, showProjectile, timeOfFlight, animationSpeed, scale]);

  // --- Newton's Laws State & Logic ---
  const [newtonForce, setNewtonForce] = useState(0);
  const [newtonMass, setNewtonMass] = useState(10);
  const [newtonMu, setNewtonMu] = useState(0.5);
  const [newtonSimulating, setNewtonSimulating] = useState(false);
  const [frictionForce, setFrictionForce] = useState(0);
  const [netForce, setNetForce] = useState(0);
  const [acceleration, setAcceleration] = useState(0);
  const newtonCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const newtonAnimationRef = useRef<number | null>(null); // Ref for Newton's animation frame ID

  const startNewtonSim = () => {
    setNewtonSimulating(true);
    const friction = newtonMu * newtonMass * g;
    setFrictionForce(friction);
    setNetForce(newtonForce - friction);
    setAcceleration(netForce / newtonMass);
  };

  const resetNewtonSim = () => {
    setNewtonSimulating(false);
     if (newtonAnimationRef.current) {
      cancelAnimationFrame(newtonAnimationRef.current);
    }
    setNewtonForce(0);
    setNewtonMass(10);
    setNewtonMu(0.5);
    setFrictionForce(0);
    setNetForce(0);
    setAcceleration(0);
    // Clear the canvas
    const canvas = newtonCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Newton's Laws animation
  useEffect(() => {
    if (activeTab !== "Newton's Laws" || !newtonSimulating) {
       // Cleanup when leaving tab or simulation stops
       if (newtonAnimationRef.current) {
        cancelAnimationFrame(newtonAnimationRef.current);
      }
      const canvas = newtonCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    const canvas = newtonCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Start block in the horizontal center
    let blockX = (canvas.width - 60) / 2;
    let blockY = canvas.height - 90;
    let velocity = 0;
    const blockWidth = 60;
    const blockHeight = 40;

     // Fix: Check if ctx is null before using it
    function drawArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      // Arrowhead
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const headlen = 18;
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 7), toY - headlen * Math.sin(angle - Math.PI / 7));
      ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 7), toY - headlen * Math.sin(angle + Math.PI / 7));
      ctx.lineTo(toX, toY);
      ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 7), toY - headlen * Math.sin(angle - Math.PI / 7));
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fill();
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw ground
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 50);
      ctx.lineTo(canvas.width, canvas.height - 50);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 3;
      ctx.stroke();
      // Draw block
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(blockX, blockY, blockWidth, blockHeight);
      // Draw force arrows
      // Applied force (red)
      if (ctx) {
        drawArrow(ctx, blockX + blockWidth / 2, blockY + blockHeight / 2, blockX + blockWidth / 2 + newtonForce * 3, blockY + blockHeight / 2, '#ff4444');
      }
      // Friction force (blue, always opposes motion)
      if (ctx) {
        drawArrow(ctx, blockX + blockWidth / 2, blockY + blockHeight / 2 + 20, blockX + blockWidth / 2 - Math.sign(netForce) * Math.abs(frictionForce) * 3, blockY + blockHeight / 2 + 20, '#4488ff');
      }
      // Net force (purple)
      if (ctx) {
        drawArrow(ctx, blockX + blockWidth / 2, blockY + blockHeight / 2 - 20, blockX + blockWidth / 2 + netForce * 3, blockY + blockHeight / 2 - 20, '#a020f0');
      }
    };

     // Fix: Use requestAnimationFrame for continuous animation
    const animate = () => {
      if (!newtonSimulating || activeTab !== "Newton's Laws") return; // Stop if simulation is off or tab changes
      // F = ma, update velocity and position
      velocity += (netForce / newtonMass) * timeStep;
      blockX += velocity * 60 * timeStep; // 60 is a scale factor for visible motion
      draw();
      // Stop if block reaches end or net force is zero (within a small tolerance)
      if (blockX > canvas.width - blockWidth - 10 || blockX < 10 || Math.abs(netForce) < 0.01) {
        setNewtonSimulating(false);
        return;
      }
      newtonAnimationRef.current = requestAnimationFrame(animate);
    };

    // Start animation only if simulating and on the correct tab
    if (newtonSimulating && activeTab === "Newton's Laws") {
       animate(); // Start the first frame directly or with requestAnimationFrame?
       newtonAnimationRef.current = requestAnimationFrame(animate); // Let's use requestAnimationFrame for consistency
    }

    // Cleanup function for the effect
    return () => {
      if (newtonAnimationRef.current) {
        cancelAnimationFrame(newtonAnimationRef.current);
      }
      // Also clear the canvas when unmounting or leaving tab
      const canvas = newtonCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

  }, [newtonSimulating, newtonForce, newtonMass, newtonMu, netForce, frictionForce, activeTab]);

  // --- Harmonic Motion State & Logic ---
  const [hmMass, setHmMass] = useState(2);
  const [hmK, setHmK] = useState(10);
  const [hmAmp, setHmAmp] = useState(100); // pixels
  const [hmSimulating, setHmSimulating] = useState(false);
  const [hmMetrics, setHmMetrics] = useState({ period: 0, freq: 0, maxSpeed: 0 });
  const hmCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hmAnimationRef = useRef<number | null>(null); // Ref for Harmonic Motion animation frame ID

  // Calculate metrics
  useEffect(() => {
    const omega = Math.sqrt(hmK / hmMass);
    const period = 2 * Math.PI / omega;
    const freq = 1 / period;
    const maxSpeed = Math.abs(omega * hmAmp);
    setHmMetrics({ period, freq, maxSpeed });
  }, [hmMass, hmK, hmAmp]);

  // Animation
  useEffect(() => {
    if (activeTab !== 'Harmonic Motion' || !hmSimulating) {
       // Cleanup when leaving tab or simulation stops
       if (hmAnimationRef.current) {
        cancelAnimationFrame(hmAnimationRef.current);
      }
      const canvas = hmCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    const canvas = hmCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const originX = 100;
    const centerY = canvas.height / 2;
    const massWidth = 50;
    const massHeight = 50;
    const omega = Math.sqrt(hmK / hmMass);
    let start = performance.now();

    const animate = (now: number) => {
      if (!hmSimulating || activeTab !== 'Harmonic Motion') return; // Stop if simulation is off or tab changes
      const t = (now - start) / 1000;
      const x = hmAmp * Math.cos(omega * t);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw spring
      ctx.beginPath();
      ctx.moveTo(originX, centerY);
      ctx.lineTo(originX + x, centerY);
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 6;
      ctx.stroke();
      // Draw mass
      ctx.beginPath();
      ctx.rect(originX + x, centerY - massHeight / 2, massWidth, massHeight);
      ctx.fillStyle = '#ff4444';
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;
      if (hmSimulating && activeTab === 'Harmonic Motion') {
        hmAnimationRef.current = requestAnimationFrame(animate);
      }
    };
    // Start animation only if simulating and on the correct tab
    if (hmSimulating && activeTab === 'Harmonic Motion') {
       hmAnimationRef.current = requestAnimationFrame(animate);
    }

    // Cleanup function for the effect
    return () => {
      if (hmAnimationRef.current) {
        cancelAnimationFrame(hmAnimationRef.current);
      }
      // Also clear the canvas when unmounting or leaving tab
      const canvas = hmCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [hmSimulating, hmAmp, hmK, hmMass, activeTab]);

  const startHmSim = () => setHmSimulating(true);
  const resetHmSim = () => {
    setHmSimulating(false);
    const canvas = hmCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw spring at rest
        const originX = 100;
        const centerY = canvas.height / 2;
        const massWidth = 50;
        const massHeight = 50;
        ctx.beginPath();
        ctx.moveTo(originX, centerY);
        ctx.lineTo(originX, centerY);
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 6;
        ctx.stroke();
        // Draw mass at rest
        ctx.beginPath();
        ctx.rect(originX, centerY - massHeight / 2, massWidth, massHeight);
        ctx.fillStyle = '#ff4444';
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  };

  // --- Collision & Momentum State & Logic ---
  const [ball1Mass, setBall1Mass] = useState(1);
  const [ball2Mass, setBall2Mass] = useState(2);
  const [ball1Velocity, setBall1Velocity] = useState(50);
  const [ball2Velocity, setBall2Velocity] = useState(-20);
  const [cmSimulating, setCmSimulating] = useState(false);
  const [totalMomentum, setTotalMomentum] = useState(0);
  const [totalEnergy, setTotalEnergy] = useState(0);
  const cmCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cmAnimationRef = useRef<number | null>(null); // Corrected ref name and added initial value
  const positionsRef = useRef({ ball1: 100, ball2: 400 });
  const velocitiesRef = useRef({ ball1: 50, ball2: -20 });

  const startCmSim = () => {
    setCmSimulating(true);
    positionsRef.current = { ball1: 100, ball2: 400 };
    velocitiesRef.current = { ball1: ball1Velocity, ball2: ball2Velocity };
    
    // Calculate initial momentum and energy
    const momentum = ball1Mass * ball1Velocity + ball2Mass * ball2Velocity;
    const energy = 0.5 * (ball1Mass * ball1Velocity * ball1Velocity + 
                         ball2Mass * ball2Velocity * ball2Velocity);
    setTotalMomentum(momentum);
    setTotalEnergy(energy);
  };

  const resetCmSim = () => {
    setCmSimulating(false);
    if (cmAnimationRef.current) {
      cancelAnimationFrame(cmAnimationRef.current);
    }
    setBall1Mass(1);
    setBall2Mass(2);
    setBall1Velocity(50);
    setBall2Velocity(-20);
    positionsRef.current = { ball1: 100, ball2: 400 };
    velocitiesRef.current = { ball1: 50, ball2: -20 };
    setTotalMomentum(0);
    setTotalEnergy(0);
    
    const canvas = cmCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  // Collision & Momentum animation
  useEffect(() => {
    if (activeTab !== 'Collision & Momentum' || !cmSimulating) {
      // Clean up: cancel animation and clear canvas if leaving tab
      if (cmAnimationRef.current) {
        cancelAnimationFrame(cmAnimationRef.current);
      }
      const canvas = cmCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    const canvas = cmCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ballRadius = 30;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const centerY = canvasHeight / 2;
    let lastTime = performance.now();

    const draw = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // Draw ground
      ctx.beginPath();
      ctx.moveTo(0, centerY + ballRadius + 10);
      ctx.lineTo(canvasWidth, centerY + ballRadius + 10);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw ball 1
      ctx.beginPath();
      ctx.arc(positionsRef.current.ball1, centerY, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#4CAF50';
      ctx.shadowColor = '#4CAF50';
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Draw ball 2
      ctx.beginPath();
      ctx.arc(positionsRef.current.ball2, centerY, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4444';
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw mass labels
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${ball1Mass} kg`, positionsRef.current.ball1, centerY);
      ctx.fillText(`${ball2Mass} kg`, positionsRef.current.ball2, centerY);
    };

    const animate = (currentTime: number) => {
      if (!cmSimulating || activeTab !== 'Collision & Momentum') return; // Stop if simulation is off or tab changes

      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      // Update positions
      positionsRef.current.ball1 += velocitiesRef.current.ball1 * deltaTime * 20;
      positionsRef.current.ball2 += velocitiesRef.current.ball2 * deltaTime * 20;

      // Check for wall collisions
      if (positionsRef.current.ball1 <= ballRadius) {
        positionsRef.current.ball1 = ballRadius;
        velocitiesRef.current.ball1 = -velocitiesRef.current.ball1;
      } else if (positionsRef.current.ball1 >= canvasWidth - ballRadius) {
        positionsRef.current.ball1 = canvasWidth - ballRadius;
        velocitiesRef.current.ball1 = -velocitiesRef.current.ball1;
      }

      if (positionsRef.current.ball2 <= ballRadius) {
        positionsRef.current.ball2 = ballRadius;
        velocitiesRef.current.ball2 = -velocitiesRef.current.ball2;
      } else if (positionsRef.current.ball2 >= canvasWidth - ballRadius) {
        positionsRef.current.ball2 = canvasWidth - ballRadius;
        velocitiesRef.current.ball2 = -velocitiesRef.current.ball2;
      }

      // Check for ball collision
      if (Math.abs(positionsRef.current.ball1 - positionsRef.current.ball2) < ballRadius * 2) {
        // Elastic collision formulas
        const v1 = ((ball1Mass - ball2Mass) * velocitiesRef.current.ball1 + 
                   2 * ball2Mass * velocitiesRef.current.ball2) / (ball1Mass + ball2Mass);
        const v2 = ((ball2Mass - ball1Mass) * velocitiesRef.current.ball2 + 
                   2 * ball1Mass * velocitiesRef.current.ball1) / (ball1Mass + ball2Mass);
        
        velocitiesRef.current.ball1 = v1;
        velocitiesRef.current.ball2 = v2;
      }

      draw();
      cmAnimationRef.current = requestAnimationFrame(animate);
    };

    cmAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      if (cmAnimationRef.current) {
        cancelAnimationFrame(cmAnimationRef.current);
      }
      // Also clear the canvas when unmounting or leaving tab
      const canvas = cmCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [cmSimulating, ball1Mass, ball2Mass, ball1Velocity, ball2Velocity, activeTab]); // Added dependencies

  // Update the tab content renderer
  function renderTabContent() {
    switch (activeTab) {
      case 'Projectile Motion':
        return (
          <div className="centered">
            <h1 className="centered-title fancy-title">Projectile Motion Simulator</h1>
            <div className="metrics metrics-top fancy-metrics">
              <div><span className="metric-label">Max Height</span><span className="metric-value">{maxHeight.toFixed(2)} m</span></div>
              <div><span className="metric-label">Time of Flight</span><span className="metric-value">{timeOfFlight.toFixed(2)} s</span></div>
              <div><span className="metric-label">Range</span><span className="metric-value">{range.toFixed(2)} m</span></div>
            </div>
            <div className="simulation-container">
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                style={{ border: '2.5px solid #4CAF50', background: '#181a20', display: 'block', margin: '0 auto', borderRadius: '12px', boxShadow: '0 4px 32px #0008' }}
              />
            </div>
            <div className="controls fancy-controls">
              <div className="control-group">
                <label>
                  <span className="slider-label">Initial Velocity (m/s):</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={velocity}
                    onChange={(e) => setVelocity(Number(e.target.value))}
                  />
                  <span className="slider-value">{velocity} m/s</span>
                </label>
              </div>
              <div className="control-group">
                <label>
                  <span className="slider-label">Launch Angle (degrees):</span>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={angle}
                    onChange={(e) => setAngle(Number(e.target.value))}
                  />
                  <span className="slider-value">{angle}°</span>
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                <button className="fancy-btn" onClick={startSimulation} disabled={isSimulating}>
                  Start Simulation
                </button>
                <button className="fancy-btn" onClick={resetSimulation}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        );
      case "Newton's Laws":
        // Newton's Laws simulation
        return (
          <div className="centered">
            <h1 className="centered-title fancy-title">Newton's Laws: Forces, Friction, Acceleration</h1>
            <div className="metrics metrics-top fancy-metrics">
              <div><span className="metric-label">Friction Force</span><span className="metric-value">{frictionForce.toFixed(2)} N</span></div>
              <div><span className="metric-label">Net Force</span><span className="metric-value">{netForce.toFixed(2)} N</span></div>
              <div><span className="metric-label">Acceleration</span><span className="metric-value">{acceleration.toFixed(2)} m/s²</span></div>
            </div>
            <div className="simulation-container">
              <canvas
                id="newton-canvas"
                width={600}
                height={200}
                style={{ border: '2.5px solid #4CAF50', background: '#181a20', display: 'block', margin: '0 auto', borderRadius: '12px', boxShadow: '0 4px 32px #0008' }}
                ref={newtonCanvasRef}
              />
            </div>
            <div className="controls fancy-controls">
              <div className="control-group">
                <label>
                  <span className="slider-label">Applied Force (N):</span>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={newtonForce}
                    onChange={e => setNewtonForce(Number(e.target.value))}
                  />
                  <span className="slider-value">{newtonForce} N</span>
                </label>
              </div>
              <div className="control-group">
                <label>
                  <span className="slider-label">Mass (kg):</span>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={newtonMass}
                    onChange={e => setNewtonMass(Number(e.target.value))}
                  />
                  <span className="slider-value">{newtonMass} kg</span>
                </label>
              </div>
              <div className="control-group">
                <label>
                  <span className="slider-label">Friction Coefficient (μ):</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={newtonMu}
                    onChange={e => setNewtonMu(Number(e.target.value))}
                  />
                  <span className="slider-value">{newtonMu}</span>
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                <button className="fancy-btn" onClick={startNewtonSim} disabled={newtonSimulating}>
                  Start
                </button>
                <button className="fancy-btn" onClick={resetNewtonSim}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        );
      case 'Harmonic Motion':
        return (
          <div className="centered">
            <h1 className="centered-title fancy-title">Harmonic Motion: Mass on a Spring</h1>
            <div className="metrics metrics-top fancy-metrics">
              <div><span className="metric-label">Period</span><span className="metric-value">{hmMetrics.period.toFixed(2)} s</span></div>
              <div><span className="metric-label">Frequency</span><span className="metric-value">{hmMetrics.freq.toFixed(2)} Hz</span></div>
              <div><span className="metric-label">Max Speed</span><span className="metric-value">{hmMetrics.maxSpeed.toFixed(2)} px/s</span></div>
            </div>
            <div className="simulation-container">
              <canvas
                ref={hmCanvasRef}
                width={700}
                height={250}
                style={{ border: '2.5px solid #4CAF50', background: '#181a20', display: 'block', margin: '0 auto', borderRadius: '12px', boxShadow: '0 4px 32px #0008' }}
              />
            </div>
            <div className="controls fancy-controls">
              <div className="control-group">
                <label>
                  <span className="slider-label">Mass (kg):</span>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.1"
                    value={hmMass}
                    onChange={e => setHmMass(Number(e.target.value))}
                  />
                  <span className="slider-value">{hmMass} kg</span>
                </label>
              </div>
              <div className="control-group">
                <label>
                  <span className="slider-label">Spring Constant (N/m):</span>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="0.5"
                    value={hmK}
                    onChange={e => setHmK(Number(e.target.value))}
                  />
                  <span className="slider-value">{hmK} N/m</span>
                </label>
              </div>
              <div className="control-group">
                <label>
                  <span className="slider-label">Amplitude (px):</span>
                  <input
                    type="range"
                    min="20"
                    max="250"
                    step="1"
                    value={hmAmp}
                    onChange={e => setHmAmp(Number(e.target.value))}
                  />
                  <span className="slider-value">{hmAmp} px</span>
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                <button className="fancy-btn" onClick={startHmSim} disabled={hmSimulating}>
                  Start
                </button>
                <button className="fancy-btn" onClick={resetHmSim}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        );
      case 'Collision & Momentum':
        return (
          <div className="centered">
            <h1 className="centered-title fancy-title">Collision & Momentum Simulator</h1>
            <div className="metrics metrics-top fancy-metrics">
              <div><span className="metric-label">Total Momentum</span><span className="metric-value">{totalMomentum.toFixed(2)} kg⋅m/s</span></div>
              <div><span className="metric-label">Total Energy</span><span className="metric-value">{totalEnergy.toFixed(2)} J</span></div>
              <div><span className="metric-label">Ball 1 Speed</span><span className="metric-value">{Math.abs(velocitiesRef.current.ball1).toFixed(2)} m/s</span></div>
            </div>
            <div className="simulation-container">
              <canvas
                ref={cmCanvasRef}
                width={800}
                height={200}
                style={{ border: '2.5px solid #4CAF50', background: '#181a20', display: 'block', margin: '0 auto', borderRadius: '12px', boxShadow: '0 4px 32px #0008' }}
              />
            </div>
            <div className="controls fancy-controls">
              <div className="control-group">
                <label>
                  <span className="slider-label">Ball 1 Mass (kg):</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.1"
                    value={ball1Mass}
                    onChange={e => setBall1Mass(Number(e.target.value))}
                  />
                  <span className="slider-value">{ball1Mass} kg</span>
                </label>
              </div>
              <div className="control-group">
                <label>
                  <span className="slider-label">Ball 2 Mass (kg):</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.1"
                    value={ball2Mass}
                    onChange={e => setBall2Mass(Number(e.target.value))}
                  />
                  <span className="slider-value">{ball2Mass} kg</span>
                </label>
              </div>
              <div className="control-group">
                <label>
                  <span className="slider-label">Ball 1 Initial Velocity (m/s):</span>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={ball1Velocity}
                    onChange={e => setBall1Velocity(Number(e.target.value))}
                  />
                  <span className="slider-value">{ball1Velocity} m/s</span>
                </label>
              </div>
              <div className="control-group">
                <label>
                  <span className="slider-label">Ball 2 Initial Velocity (m/s):</span>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={ball2Velocity}
                    onChange={e => setBall2Velocity(Number(e.target.value))}
                  />
                  <span className="slider-value">{ball2Velocity} m/s</span>
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                <button className="fancy-btn" onClick={startCmSim} disabled={cmSimulating}>
                  Start
                </button>
                <button className="fancy-btn" onClick={resetCmSim}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="app">
      <h1>Physics Visualizer</h1>
      <div className="tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={tab === activeTab ? 'tab active' : 'tab'}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      {renderTabContent()}
    </div>
  );
};

export default App; 