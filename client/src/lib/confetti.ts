// Simple confetti animation using canvas
export default function confetti() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const COLORS = [
    '#4285F4', // blue
    '#EA4335', // red
    '#FBBC05', // yellow
    '#34A853', // green
    '#FF6D00', // orange
    '#8F00FF', // purple
    '#FF8AD8', // pink
  ];
  
  let particles: Particle[] = [];
  
  // Configure canvas size
  const W = window.innerWidth;
  const H = window.innerHeight;
  
  // Apply fixed position so confetti shows above all content
  canvas.width = W;
  canvas.height = H;
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.zIndex = '9999';
  canvas.style.pointerEvents = 'none'; // So it doesn't block mouse events
  
  // Add canvas to body
  document.body.appendChild(canvas);
  
  // Particle class for confetti pieces
  class Particle {
    x: number;
    y: number;
    color: string;
    size: number;
    speed: number;
    angle: number;
    rotation: number;
    rotationSpeed: number;
    
    constructor() {
      this.x = Math.random() * W;
      this.y = -20 - Math.random() * 100;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.size = Math.random() * 10 + 5;
      this.speed = Math.random() * 3 + 2;
      this.angle = Math.random() * Math.PI * 2;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = Math.random() * 0.2 - 0.1;
    }
    
    update() {
      this.y += this.speed;
      this.x += Math.sin(this.angle) * 2;
      this.rotation += this.rotationSpeed;
      
      // Remove particles that fall outside the canvas
      return this.y <= H;
    }
    
    draw() {
      if (!ctx) return;
      
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      
      // Draw a rectangular confetti piece
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      
      ctx.restore();
    }
  }
  
  // Initialize particles
  function createParticles() {
    // Create 100 particles
    for (let i = 0; i < 100; i++) {
      particles.push(new Particle());
    }
  }
  
  // Animation loop
  function animate() {
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, W, H);
    
    // Update and draw particles
    particles = particles.filter(p => {
      p.update();
      p.draw();
      return p.y <= H;
    });
    
    // Continue animation if particles remain
    if (particles.length > 0) {
      requestAnimationFrame(animate);
    } else {
      // Remove canvas when animation completes
      document.body.removeChild(canvas);
    }
  }
  
  // Start confetti
  createParticles();
  animate();
}